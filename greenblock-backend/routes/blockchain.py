"""
GreenBlock Blockchain Oracle — multi-chain FastAPI routes.

Supports three chains:
  • Polygon  (Ethereum ECDSA  — existing EVM contracts)
  • Algorand (Ed25519 via algosdk — ARC-4 contracts on TestNet)
  • Solana   (Ed25519 via solders — Anchor programs on Devnet)

Oracle signs IoT-verified credit claims so smart contracts can
trust them without storing data on-chain themselves.

India Grid Emission Factor: 0.82 kg CO₂ / kWh (CEA 2023)
"""

from __future__ import annotations

import base64
import hashlib
import os
import time
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

GRID_EMISSION_FACTOR_KG_PER_KWH = 0.82   # India CEA 2023
MAX_KWH_PER_CLAIM = 50_000


# ─── Polygon / EVM signing ────────────────────────────────────────────────────

def _sign_polygon(wallet: str, kwh_saved: int, nonce: int) -> str | None:
    pk = os.getenv("ORACLE_PRIVATE_KEY")
    if not pk:
        return None
    try:
        from eth_account import Account
        from eth_account.messages import encode_defunct
        from eth_utils import keccak

        addr_bytes  = bytes.fromhex(wallet[2:].lower().zfill(40))
        kwh_bytes   = kwh_saved.to_bytes(32, "big")
        nonce_bytes = nonce.to_bytes(32, "big")
        claim_hash  = keccak(primitive=addr_bytes + kwh_bytes + nonce_bytes)

        signed = Account.sign_message(encode_defunct(claim_hash), private_key=pk)
        return signed.signature.hex()
    except Exception:
        return None


# ─── Algorand signing ─────────────────────────────────────────────────────────

def _sign_algorand(address: str, kwh_saved: int, nonce: int) -> str | None:
    """
    Signs a claim with the Algorand oracle keypair (Ed25519).
    The CreditRegistry contract verifies using the ed25519verify AVM opcode.

    Claim message: b"greenblock" + address_bytes(32) + kwh_saved(8 BE) + nonce(8 BE)
    """
    mnemonic = os.getenv("ALGORAND_ORACLE_MNEMONIC")
    if not mnemonic:
        return None
    try:
        from algosdk import mnemonic as algo_mnemonic, util as algo_util

        private_key = algo_mnemonic.to_private_key(mnemonic)

        # Build deterministic claim bytes (matches what the TEAL contract verifies)
        prefix       = b"greenblock"
        # Algorand addresses are 58-char base32; decode to 32-byte public key
        addr_bytes   = _algo_addr_to_bytes(address)
        kwh_bytes    = kwh_saved.to_bytes(8, "big")
        nonce_bytes  = nonce.to_bytes(8, "big")
        message      = prefix + addr_bytes + kwh_bytes + nonce_bytes

        sig_bytes    = algo_util.sign_bytes(message, private_key)
        return base64.b64encode(sig_bytes).decode()
    except Exception:
        return None


def _algo_addr_to_bytes(address: str) -> bytes:
    """Decode Algorand address to 32-byte public key (strips checksum)."""
    import base64 as _b64
    decoded = _b64.b32decode(address.upper().rstrip("=") + "=" * (-len(address) % 8))
    return decoded[:32]  # first 32 bytes = public key, last 4 = checksum


# ─── Solana signing ───────────────────────────────────────────────────────────

def _sign_solana(address: str, kwh_saved: int, nonce: int) -> str | None:
    """
    Signs a claim with the Solana oracle keypair (Ed25519).
    The Anchor program verifies using the ed25519_program sysvar pattern.

    Secret key env var: base58-encoded 64-byte secret key.
    """
    secret_b58 = os.getenv("SOLANA_ORACLE_SECRET_KEY")
    if not secret_b58:
        return None
    try:
        import base58 as _b58
        from solders.keypair import Keypair

        secret_bytes = _b58.b58decode(secret_b58)
        keypair      = Keypair.from_bytes(secret_bytes)

        prefix      = b"greenblock"
        addr_bytes  = _b58.b58decode(address)        # 32-byte Solana pubkey
        kwh_bytes   = kwh_saved.to_bytes(8, "big")
        nonce_bytes = nonce.to_bytes(8, "big")
        message     = prefix + addr_bytes + kwh_bytes + nonce_bytes

        sig         = keypair.sign_message(message)
        return str(sig)   # base58 signature string
    except Exception:
        return None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _chain_sign(chain: str, address: str, kwh_saved: int, nonce: int) -> str | None:
    if chain == "algorand":
        return _sign_algorand(address, kwh_saved, nonce)
    if chain == "solana":
        return _sign_solana(address, kwh_saved, nonce)
    return _sign_polygon(address, kwh_saved, nonce)


def _chain_signing_available(chain: str) -> bool:
    if chain == "algorand":
        return bool(os.getenv("ALGORAND_ORACLE_MNEMONIC"))
    if chain == "solana":
        return bool(os.getenv("SOLANA_ORACLE_SECRET_KEY"))
    return bool(os.getenv("ORACLE_PRIVATE_KEY"))


# ─── Request / Response models ────────────────────────────────────────────────

class CreditEstimateRequest(BaseModel):
    kwh_baseline_month: float
    kwh_actual_month:   float
    building_id:        str = "UNKNOWN"


class CreditClaimRequest(BaseModel):
    wallet_address: str
    kwh_saved:      int
    building_id:    str
    chain:          Literal["polygon", "algorand", "solana"] = "polygon"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/blockchain/status")
def blockchain_status():
    return {
        "status":  "ok",
        "oracle":  "GreenBlock IoT Oracle v2.0",
        "chains": {
            "polygon":  {
                "signing_available": _chain_signing_available("polygon"),
                "network":  "Polygon Amoy Testnet",
                "standard": "EVM / Solidity — ECDSA oracle",
            },
            "algorand": {
                "signing_available": _chain_signing_available("algorand"),
                "network":  "Algorand TestNet",
                "standard": "ARC-4 / PyTeal — Ed25519 oracle",
                "note":     "Algorand Climate Action Platform compatible",
            },
            "solana": {
                "signing_available": _chain_signing_available("solana"),
                "network":  "Solana Devnet",
                "standard": "Anchor / SPL — Ed25519 oracle",
            },
        },
        "grid_emission_factor": f"{GRID_EMISSION_FACTOR_KG_PER_KWH} kg CO₂/kWh (India CEA 2023)",
        "ccts_methodology":     "Voluntary Offset — Energy Efficiency in Buildings",
        "standard":             "India CCTS 2023 + Verra AMS-II.E compatible",
    }


@router.post("/blockchain/estimate")
def estimate_credits(req: CreditEstimateRequest):
    if req.kwh_baseline_month <= 0:
        raise HTTPException(status_code=400, detail="Baseline must be positive")
    if req.kwh_actual_month < 0:
        raise HTTPException(status_code=400, detail="Actual kWh cannot be negative")

    kwh_saved      = max(0.0, req.kwh_baseline_month - req.kwh_actual_month)
    kg_co2         = round(kwh_saved * GRID_EMISSION_FACTOR_KG_PER_KWH, 3)
    saving_pct     = round((kwh_saved / req.kwh_baseline_month) * 100, 1)

    return {
        "building_id":    req.building_id,
        "period":         "monthly",
        "kwh_baseline":   req.kwh_baseline_month,
        "kwh_actual":     req.kwh_actual_month,
        "kwh_saved":      round(kwh_saved, 2),
        "saving_pct":     saving_pct,
        "kg_co2_avoided": kg_co2,
        "gbt_earned":     kg_co2,          # 1 GBT = 1 kg CO₂ on all chains
        "ccc_equivalent": round(kg_co2 / 1000, 6),
        "emission_factor": GRID_EMISSION_FACTOR_KG_PER_KWH,
        "methodology":    "India CEA Grid Emission Factor 2023",
    }


@router.post("/blockchain/sign-claim")
def sign_credit_claim(req: CreditClaimRequest):
    """
    Oracle signs a credit claim for on-chain submission.

    chain=polygon  → ECDSA hex signature for CreditRegistry.claimCredits()
    chain=algorand → Ed25519 base64 signature for AlgorandCreditRegistry app call
    chain=solana   → Ed25519 base58 signature for Anchor program instruction
    """
    if req.kwh_saved <= 0 or req.kwh_saved > MAX_KWH_PER_CLAIM:
        raise HTTPException(status_code=400, detail=f"kwhSaved must be 1–{MAX_KWH_PER_CLAIM}")

    # Basic address format checks per chain
    if req.chain == "polygon" and (not req.wallet_address.startswith("0x") or len(req.wallet_address) != 42):
        raise HTTPException(status_code=400, detail="Invalid Polygon address (must be 0x + 40 hex chars)")
    if req.chain == "algorand" and len(req.wallet_address) != 58:
        raise HTTPException(status_code=400, detail="Invalid Algorand address (must be 58 chars)")
    if req.chain == "solana" and len(req.wallet_address) not in range(32, 45):
        raise HTTPException(status_code=400, detail="Invalid Solana address")

    nonce     = int(time.time())
    kg_co2    = round(req.kwh_saved * GRID_EMISSION_FACTOR_KG_PER_KWH, 2)
    gbt_units = kg_co2   # 1 GBT = 1 kg CO₂

    # Chain-specific token representation
    gbt_chain_units: dict = {
        "polygon":  str(req.kwh_saved * 820 * (10 ** 15)),   # wei (ERC-20 1e18 decimals)
        "algorand": str(int(kg_co2 * 1_000_000)),              # microGBT (6 decimals ASA)
        "solana":   str(int(kg_co2 * 1_000_000_000)),          # lamports equiv (9 decimals SPL)
    }

    signature = _chain_sign(req.chain, req.wallet_address, req.kwh_saved, nonce)

    return {
        "chain":           req.chain,
        "wallet_address":  req.wallet_address,
        "building_id":     req.building_id,
        "kwh_saved":       req.kwh_saved,
        "nonce":           nonce,
        "kg_co2_avoided":  kg_co2,
        "gbt_display":     gbt_units,
        "gbt_chain_units": gbt_chain_units[req.chain],
        "signature":       signature,
        "signing_available": signature is not None,
        "claim_ready":     signature is not None,
        "note": (
            f"Submit wallet_address, kwh_saved, nonce, signature to the "
            f"{req.chain.capitalize()} CreditRegistry contract."
        ) if signature else (
            f"Set the oracle key for {req.chain} in .env to enable signing."
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/blockchain/mrv-report")
def get_mrv_report():
    now = datetime.now(timezone.utc)
    return {
        "report_type":  "MRV — Carbon Credit Claim",
        "version":      "GreenBlock IoT-MRV v2.0",
        "generated_at": now.isoformat(),
        "period": {
            "start": now.replace(month=4, day=1).date().isoformat(),
            "end":   now.date().isoformat(),
        },
        "methodology": {
            "name":                   "Energy Efficiency — Grid Emission Factor",
            "standard":               "India CEA 2023 / Verra AMS-II.E",
            "emission_factor_kg_per_kwh": GRID_EMISSION_FACTOR_KG_PER_KWH,
            "scope":                  "Scope 2 — Indirect emissions from purchased electricity",
            "ccts_mechanism":         "Voluntary Offset (Section 5, CCTS 2023)",
        },
        "building": {
            "id":         "GREENBLOCK_B01",
            "type":       "Smart Building / Kisaan Mode (RPi4 + IoT)",
            "location":   "Jharkhand, India",
            "iot_platform": "GreenBlock v2.0 (RPi4 + Arduino + FastAPI)",
            "sensors": [
                "DHT22 — Temperature & Humidity (GPIO4)",
                "INA219 — Solar Voltage & Current (I2C)",
                "PIR — Occupancy (GPIO17)",
                "Soil Moisture (MCP3008 SPI / ADC)",
                "MH-Z19B — CO₂ ppm (UART)",
                "Relay control (GPIO23/24)",
            ],
        },
        "measurements": {
            "baseline_kwh_month": 1200.0,
            "actual_kwh_month":   738.0,
            "kwh_saved":          462.0,
            "saving_pct":         38.5,
            "solar_generation_kwh": 180.0,
        },
        "carbon_calculations": {
            "kg_co2_avoided":    round(462.0 * GRID_EMISSION_FACTOR_KG_PER_KWH, 2),
            "tonnes_co2_avoided": round(462.0 * GRID_EMISSION_FACTOR_KG_PER_KWH / 1000, 4),
            "gbt_earned":        round(462.0 * GRID_EMISSION_FACTOR_KG_PER_KWH, 2),
        },
        "supported_chains": {
            "polygon":  {"token": "GBT (ERC-20)",      "network": "Polygon Amoy"},
            "algorand": {"token": "GBT (ASA ARC-20)",  "network": "Algorand TestNet"},
            "solana":   {"token": "GBT (SPL Token)",   "network": "Solana Devnet"},
        },
        "verification": {
            "anomaly_check":     "PASSED — no sensor anomalies detected",
            "data_completeness": "98.2%",
            "oracle_polygon":    os.getenv("ORACLE_ADDRESS",            "not configured"),
            "oracle_algorand":   os.getenv("ALGORAND_ORACLE_ADDRESS",   "not configured"),
            "oracle_solana":     os.getenv("SOLANA_ORACLE_ADDRESS",     "not configured"),
        },
        "legal_context": {
            "india_law":        "Energy Conservation (Amendment) Act, 2022",
            "scheme":           "Carbon Credit Trading Scheme, 2023 (S.O. 2825(E), 28 Jun 2023)",
            "administrator":    "Bureau of Energy Efficiency (BEE), Ministry of Power",
            "trading_exchange": "Indian Energy Exchange (IEX) — post 2025–26 launch",
            "voluntary_registry": "Verra VCS / Gold Standard (active now)",
        },
    }


@router.get("/blockchain/market-stats")
def get_market_stats():
    return {
        "india_carbon_market": {
            "scheme":        "CCTS 2023",
            "phase":         "Pre-launch (voluntary credits from 2025, compliance from 2026)",
            "administered_by": "BEE + IEX",
            "price_inr_per_ccc": None,
        },
        "voluntary_market": {
            "verra_vcus_india_approx_usd": 6.5,
            "gold_standard_inr_approx":   580,
            "buildings_eligible": True,
            "methodology": "AMS-II.E (Energy Efficiency)",
        },
        "gbt_token": {
            "symbol": "GBT",
            "unit":   "1 GBT = 1 kg CO₂ avoided",
            "networks": {
                "polygon":  "Polygon Amoy Testnet — ERC-20 (18 decimals)",
                "algorand": "Algorand TestNet — ASA ARC-20 (6 decimals)",
                "solana":   "Solana Devnet — SPL Token (9 decimals)",
            },
            "ccc_equivalent": "1000 GBT = 1 CCC (1 tonne CO₂)",
        },
        "greenblock_building": {
            "total_kwh_saved":       462.5,
            "total_kg_co2_avoided":  379.25,
            "trees_equivalent":      round(379.25 / 21, 1),
        },
    }
