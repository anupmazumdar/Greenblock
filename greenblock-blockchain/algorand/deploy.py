"""
GreenBlock Algorand Deployment Script
py-algorand-sdk 2.7.x

Deploys on Algorand TestNet (algonode.cloud):
  1. Creates the GBT ASA (ARC-20)
  2. Deploys CreditRegistry application
  3. Deploys Marketplace application
  4. Deploys RetirementLedger application
  5. Funds each application account with 0.1 ALGO minimum balance
  6. Saves all deployment artefacts to algorand_deployments/testnet.json

Usage:
  export DEPLOYER_MNEMONIC="word1 word2 ... word25"
  export ORACLE_PUBKEY_HEX="<32-byte Ed25519 pubkey as hex>"  (optional, defaults to zero key)
  python deploy.py

The deployer account must be funded on TestNet (use faucet.testnet.algorand.network).
"""

from __future__ import annotations

import base64
import json
import os
import struct
import sys
import time
from pathlib import Path

import algosdk
from algosdk import account, encoding, mnemonic
from algosdk.transaction import (
    ApplicationCreateTxn,
    AssetConfigTxn,
    PaymentTxn,
    StateSchema,
    wait_for_confirmation,
)
from algosdk.v2client import algod

# ---------------------------------------------------------------------------
# Import PyTeal compilation functions
# ---------------------------------------------------------------------------
# Add contracts directory to path
CONTRACTS_DIR = Path(__file__).parent / "contracts"
sys.path.insert(0, str(CONTRACTS_DIR))

from credit_registry import (  # noqa: E402
    get_approval_program as cr_approval,
    get_clear_program as cr_clear,
)
from marketplace import (  # noqa: E402
    get_approval_program as mp_approval,
    get_clear_program as mp_clear,
)
from retirement_ledger import (  # noqa: E402
    get_approval_program as rl_approval,
    get_clear_program as rl_clear,
)

# ---------------------------------------------------------------------------
# Network configuration
# ---------------------------------------------------------------------------
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN   = ""   # algonode.cloud does not require a token

# Deployment output directory
OUTPUT_DIR = Path(__file__).parent / "algorand_deployments"

# Minimum balance to fund each app (0.1 ALGO = 100_000 microAlgo)
APP_FUND_AMOUNT_MICROALGO = 100_000

# GBT ASA parameters
GBT_TOTAL_SUPPLY = 10 ** 15          # 10^15 microGBT  = 10^9 GBT
GBT_DECIMALS     = 6
GBT_UNIT_NAME    = "GBT"
GBT_ASSET_NAME   = "GreenBlock Token"
GBT_URL          = "https://greenblock.io/token"
GBT_METADATA_HASH = b"\x00" * 32    # placeholder; set real hash before mainnet


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_algod_client() -> algod.AlgodClient:
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)


def compile_teal(client: algod.AlgodClient, teal_source: str) -> bytes:
    """Compile TEAL source to bytecode via the algod compile endpoint."""
    compile_response = client.compile(teal_source)
    return base64.b64decode(compile_response["result"])


def wait_confirmed(client: algod.AlgodClient, txid: str, rounds: int = 10) -> dict:
    """Wait for transaction confirmation and return the confirmed transaction."""
    result = wait_for_confirmation(client, txid, rounds)
    return result


def fund_address(
    client: algod.AlgodClient,
    sender_sk: str,
    sender_address: str,
    receiver: str,
    amount: int,
) -> str:
    """Send `amount` microAlgo from sender to receiver. Returns txid."""
    sp  = client.suggested_params()
    txn = PaymentTxn(
        sender=sender_address,
        sp=sp,
        receiver=receiver,
        amt=amount,
    )
    signed = txn.sign(sender_sk)
    txid   = client.send_transaction(signed)
    wait_confirmed(client, txid)
    print(f"  Funded {receiver} with {amount} microAlgo  (txid: {txid[:12]}…)")
    return txid


def application_address(app_id: int) -> str:
    """Derive the escrow address of an Algorand application."""
    return encoding.encode_address(
        encoding.checksum(b"appID" + struct.pack(">Q", app_id))
    )


# ---------------------------------------------------------------------------
# Create GBT ASA
# ---------------------------------------------------------------------------
def create_gbt_asa(
    client: algod.AlgodClient,
    creator_sk: str,
    creator_address: str,
    manager_address: str,
) -> int:
    """
    Create the GreenBlock Token ASA.
    manager/reserve/freeze/clawback will be updated to the CreditRegistry app
    address in a subsequent AssetConfig transaction after app deployment.
    """
    sp  = client.suggested_params()
    txn = AssetConfigTxn(
        sender=creator_address,
        sp=sp,
        total=GBT_TOTAL_SUPPLY,
        decimals=GBT_DECIMALS,
        default_frozen=False,
        unit_name=GBT_UNIT_NAME,
        asset_name=GBT_ASSET_NAME,
        url=GBT_URL,
        metadata_hash=GBT_METADATA_HASH,
        manager=manager_address,
        reserve=manager_address,
        freeze=manager_address,
        clawback=manager_address,
        strict_empty_address_check=False,
    )
    signed = txn.sign(creator_sk)
    txid   = client.send_transaction(signed)
    result = wait_confirmed(client, txid)
    asset_id: int = result["asset-index"]
    print(f"  GBT ASA created  asset_id={asset_id}  (txid: {txid[:12]}…)")
    return asset_id


# ---------------------------------------------------------------------------
# Deploy a generic application
# ---------------------------------------------------------------------------
def deploy_app(
    client: algod.AlgodClient,
    creator_sk: str,
    creator_address: str,
    approval_source: str,
    clear_source: str,
    global_schema: StateSchema,
    local_schema: StateSchema,
    app_args: list[bytes] | None = None,
    label: str = "app",
) -> int:
    """Compile and deploy an application. Returns app_id."""
    approval_bytes = compile_teal(client, approval_source)
    clear_bytes    = compile_teal(client, clear_source)

    sp  = client.suggested_params()
    txn = ApplicationCreateTxn(
        sender=creator_address,
        sp=sp,
        on_complete=algosdk.transaction.OnComplete.NoOpOC,
        approval_program=approval_bytes,
        clear_program=clear_bytes,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args or [],
    )
    signed = txn.sign(creator_sk)
    txid   = client.send_transaction(signed)
    result = wait_confirmed(client, txid)
    app_id: int = result["application-index"]
    app_addr    = application_address(app_id)
    print(f"  {label} deployed  app_id={app_id}  address={app_addr}  (txid: {txid[:12]}…)")
    return app_id


# ---------------------------------------------------------------------------
# Setup calls
# ---------------------------------------------------------------------------
def setup_app(
    client: algod.AlgodClient,
    caller_sk: str,
    caller_address: str,
    app_id: int,
    app_args: list[bytes],
    label: str = "setup",
) -> str:
    """Send a NoOp call with app_args to configure a deployed app."""
    from algosdk.transaction import ApplicationNoOpTxn

    sp  = client.suggested_params()
    txn = ApplicationNoOpTxn(
        sender=caller_address,
        sp=sp,
        index=app_id,
        app_args=app_args,
    )
    signed = txn.sign(caller_sk)
    txid   = client.send_transaction(signed)
    wait_confirmed(client, txid)
    print(f"  {label} configured  (txid: {txid[:12]}…)")
    return txid


# ---------------------------------------------------------------------------
# Main deployment routine
# ---------------------------------------------------------------------------
def main() -> None:
    # ---- Load deployer key ------------------------------------------------
    mnemonic_phrase = os.environ.get("DEPLOYER_MNEMONIC", "")
    if not mnemonic_phrase:
        print(
            "ERROR: Set DEPLOYER_MNEMONIC environment variable to a valid 25-word mnemonic.",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        deployer_sk      = mnemonic.to_private_key(mnemonic_phrase)
        deployer_address = account.address_from_private_key(deployer_sk)
    except Exception as exc:
        print(f"ERROR: Invalid mnemonic – {exc}", file=sys.stderr)
        sys.exit(1)

    oracle_pubkey_hex = os.environ.get("ORACLE_PUBKEY_HEX", "00" * 32)
    try:
        oracle_pubkey_bytes = bytes.fromhex(oracle_pubkey_hex)
        if len(oracle_pubkey_bytes) != 32:
            raise ValueError("Oracle public key must be exactly 32 bytes")
    except Exception as exc:
        print(f"ERROR: Invalid ORACLE_PUBKEY_HEX – {exc}", file=sys.stderr)
        sys.exit(1)

    client = get_algod_client()

    print("=" * 60)
    print("GreenBlock Algorand Deployment – TestNet")
    print(f"Deployer: {deployer_address}")
    print("=" * 60)

    # ---- Check deployer balance -------------------------------------------
    info = client.account_info(deployer_address)
    balance = info.get("amount", 0)
    print(f"\nDeployer balance: {balance / 1e6:.4f} ALGO")
    if balance < 1_000_000:
        print(
            "WARNING: Deployer balance is below 1 ALGO. "
            "Deployment may fail. Fund via https://faucet.testnet.algorand.network"
        )

    deployments: dict = {
        "network":          "testnet",
        "deployer_address": deployer_address,
        "deployed_at":      int(time.time()),
    }

    # ---- 1. Deploy CreditRegistry (no args on create; setup call follows) --
    print("\n[1/4] Deploying CreditRegistry…")
    cr_app_id = deploy_app(
        client=client,
        creator_sk=deployer_sk,
        creator_address=deployer_address,
        approval_source=cr_approval(),
        clear_source=cr_clear(),
        global_schema=StateSchema(num_uints=5, num_byte_slices=1),
        local_schema=StateSchema(num_uints=3, num_byte_slices=1),
        label="CreditRegistry",
    )
    cr_app_addr = application_address(cr_app_id)

    # ---- 2. Create GBT ASA with CreditRegistry as manager ------------------
    print("\n[2/4] Creating GBT ASA…")
    gbt_asset_id = create_gbt_asa(
        client=client,
        creator_sk=deployer_sk,
        creator_address=deployer_address,
        manager_address=cr_app_addr,
    )

    # ---- 3. Setup CreditRegistry (pass oracle pubkey + gbt asset id) -------
    print("\n  Calling CreditRegistry setup…")
    asset_id_bytes = struct.pack(">Q", gbt_asset_id)   # 8-byte big-endian
    setup_app(
        client=client,
        caller_sk=deployer_sk,
        caller_address=deployer_address,
        app_id=cr_app_id,
        app_args=[b"setup", oracle_pubkey_bytes, asset_id_bytes],
        label="CreditRegistry",
    )

    # ---- 4. Deploy Marketplace --------------------------------------------
    print("\n[3/4] Deploying Marketplace…")
    mp_app_id = deploy_app(
        client=client,
        creator_sk=deployer_sk,
        creator_address=deployer_address,
        approval_source=mp_approval(),
        clear_source=mp_clear(),
        global_schema=StateSchema(num_uints=4, num_byte_slices=0),
        local_schema=StateSchema(num_uints=0, num_byte_slices=0),
        label="Marketplace",
    )
    setup_app(
        client=client,
        caller_sk=deployer_sk,
        caller_address=deployer_address,
        app_id=mp_app_id,
        app_args=[b"create", asset_id_bytes],
        label="Marketplace",
    )

    # ---- 5. Deploy RetirementLedger ---------------------------------------
    print("\n[4/4] Deploying RetirementLedger…")
    rl_app_id = deploy_app(
        client=client,
        creator_sk=deployer_sk,
        creator_address=deployer_address,
        approval_source=rl_approval(),
        clear_source=rl_clear(),
        global_schema=StateSchema(num_uints=3, num_byte_slices=0),
        local_schema=StateSchema(num_uints=0, num_byte_slices=0),
        label="RetirementLedger",
    )
    setup_app(
        client=client,
        caller_sk=deployer_sk,
        caller_address=deployer_address,
        app_id=rl_app_id,
        app_args=[b"create", asset_id_bytes],
        label="RetirementLedger",
    )

    # ---- 6. Fund each app with 0.1 ALGO minimum balance -------------------
    print("\nFunding application accounts…")
    for app_id, label in [
        (cr_app_id, "CreditRegistry"),
        (mp_app_id, "Marketplace"),
        (rl_app_id, "RetirementLedger"),
    ]:
        fund_address(
            client=client,
            sender_sk=deployer_sk,
            sender_address=deployer_address,
            receiver=application_address(app_id),
            amount=APP_FUND_AMOUNT_MICROALGO,
        )

    # ---- 7. Persist deployment info ---------------------------------------
    deployments.update({
        "gbt_asset_id":         gbt_asset_id,
        "credit_registry": {
            "app_id":           cr_app_id,
            "app_address":      cr_app_addr,
        },
        "marketplace": {
            "app_id":           mp_app_id,
            "app_address":      application_address(mp_app_id),
        },
        "retirement_ledger": {
            "app_id":           rl_app_id,
            "app_address":      application_address(rl_app_id),
        },
    })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "testnet.json"
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(deployments, fh, indent=2)

    print("\n" + "=" * 60)
    print("Deployment complete!")
    print(f"  GBT ASA ID         : {gbt_asset_id}")
    print(f"  CreditRegistry     : app_id={cr_app_id}")
    print(f"  Marketplace        : app_id={mp_app_id}")
    print(f"  RetirementLedger   : app_id={rl_app_id}")
    print(f"  Saved to           : {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
