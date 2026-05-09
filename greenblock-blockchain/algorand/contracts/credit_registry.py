"""
CreditRegistry – GreenBlock IoT Carbon Credit System
ARC-4 Algorand Smart Contract (PyTeal 0.24.x)

Global State (8 slots):
  oracle_address      bytes   32-byte Ed25519 public key of the oracle signer
  gbt_asset_id        uint64  ASA ID of the GreenBlock Token
  total_gbt_minted    uint64  Running total of microGBT ever issued
  total_kwh_saved     uint64  Running total of kWh saved across all buildings
  total_buildings     uint64  Number of registered buildings

Local State per opted-in account (4 slots):
  kwh_saved_total     uint64  Cumulative kWh saved by this account
  gbt_claimed         uint64  Total microGBT claimed by this account
  baseline_kwh        uint64  Monthly baseline kWh (set at registration)
  building_id         bytes   32-byte building identifier string

Operations (via Txn.application_args[0]):
  b"\\x00"  create/setup    – store oracle pubkey + GBT ASA ID
  b"\\x01"  register_building – opt-in, store building_id + baseline_kwh
  b"\\x02"  claim_credits   – verify oracle sig, mint GBT to caller
  b"\\x03"  preview         – pure calculation, no state change

Conversion factor: 1 kWh avoided ≈ 0.82 kg CO₂
  microGBT = kwh_saved * 820_000 / 1_000_000  (6-decimal token)
"""

from pyteal import *  # noqa: F401,F403

# ---------------------------------------------------------------------------
# Global state key constants
# ---------------------------------------------------------------------------
KEY_ORACLE_ADDRESS   = Bytes("oracle_address")
KEY_GBT_ASSET_ID     = Bytes("gbt_asset_id")
KEY_TOTAL_GBT_MINTED = Bytes("total_gbt_minted")
KEY_TOTAL_KWH_SAVED  = Bytes("total_kwh_saved")
KEY_TOTAL_BUILDINGS  = Bytes("total_buildings")

# Local state key constants
KEY_KWH_SAVED_TOTAL  = Bytes("kwh_saved_total")
KEY_GBT_CLAIMED      = Bytes("gbt_claimed")
KEY_BASELINE_KWH     = Bytes("baseline_kwh")
KEY_BUILDING_ID      = Bytes("building_id")

# Conversion: microGBT per kWh  (0.82 × 10^6 = 820_000)
MICRO_GBT_PER_KWH    = Int(820_000)
DIVISOR              = Int(1_000_000)

# Minimum claim: 1 microGBT
MIN_CLAIM_MICRO_GBT  = Int(1)


# ---------------------------------------------------------------------------
# Helper: load a uint64 from an 8-byte big-endian Bytes argument
# ---------------------------------------------------------------------------
def btoi_arg(index: int) -> Expr:
    """Return the i-th application arg converted from 8-byte BE to uint64."""
    return Btoi(Txn.application_args[index])


# ---------------------------------------------------------------------------
# Op 0 – create / setup
# ---------------------------------------------------------------------------
def op_create() -> Expr:
    """
    Expected args:
      args[1] = 32-byte oracle Ed25519 public key
      args[2] = 8-byte big-endian GBT ASA ID
    Must be called by the contract creator.
    """
    oracle_pubkey = Txn.application_args[1]
    asset_id      = btoi_arg(2)

    return Seq(
        Assert(Txn.sender() == Global.creator_address()),
        Assert(Len(oracle_pubkey) == Int(32)),
        App.globalPut(KEY_ORACLE_ADDRESS,   oracle_pubkey),
        App.globalPut(KEY_GBT_ASSET_ID,     asset_id),
        App.globalPut(KEY_TOTAL_GBT_MINTED, Int(0)),
        App.globalPut(KEY_TOTAL_KWH_SAVED,  Int(0)),
        App.globalPut(KEY_TOTAL_BUILDINGS,  Int(0)),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 1 – register_building (opt-in)
# ---------------------------------------------------------------------------
def op_register_building() -> Expr:
    """
    Called as an OptIn transaction.
    Expected args:
      args[1] = building_id  (≤ 32 bytes, right-padded with zeros if shorter)
      args[2] = 8-byte BE baseline_kwh
    """
    building_id  = Txn.application_args[1]
    baseline_kwh = btoi_arg(2)

    return Seq(
        Assert(Txn.on_completion() == OnComplete.OptIn),
        Assert(Len(building_id) <= Int(32)),
        Assert(baseline_kwh > Int(0)),
        App.localPut(Txn.sender(), KEY_BUILDING_ID,    building_id),
        App.localPut(Txn.sender(), KEY_BASELINE_KWH,   baseline_kwh),
        App.localPut(Txn.sender(), KEY_KWH_SAVED_TOTAL, Int(0)),
        App.localPut(Txn.sender(), KEY_GBT_CLAIMED,    Int(0)),
        App.globalPut(
            KEY_TOTAL_BUILDINGS,
            App.globalGet(KEY_TOTAL_BUILDINGS) + Int(1),
        ),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 2 – claim_credits
# ---------------------------------------------------------------------------
def op_claim_credits() -> Expr:
    """
    Expected args:
      args[1] = kwh_saved  (8-byte big-endian uint64)
      args[2] = nonce      (8-byte big-endian uint64, monotone per sender)
      args[3] = signature  (64-byte Ed25519 signature over claim_data)

    Claim data signed by the oracle:
      b"greenblock" + Txn.sender() (32 bytes) + kwh_saved (8 BE) + nonce (8 BE)

    Inner transaction: AssetTransfer of microGBT from contract to sender.
    """
    kwh_saved_bytes = Txn.application_args[1]   # raw 8 bytes
    nonce_bytes     = Txn.application_args[2]   # raw 8 bytes
    sig_bytes       = Txn.application_args[3]   # raw 64 bytes

    kwh_saved    = Btoi(kwh_saved_bytes)
    oracle_pubkey = App.globalGet(KEY_ORACLE_ADDRESS)
    asset_id      = App.globalGet(KEY_GBT_ASSET_ID)

    # Reconstruct the exact message the oracle signed
    claim_data = Concat(
        Bytes("greenblock"),
        Txn.sender(),
        kwh_saved_bytes,
        nonce_bytes,
    )

    # microGBT = kwh_saved * 820_000 / 1_000_000
    micro_gbt = kwh_saved * MICRO_GBT_PER_KWH / DIVISOR

    # Scratchvars for local updates (read-once then reuse)
    prev_kwh     = ScratchVar(TealType.uint64)
    prev_claimed = ScratchVar(TealType.uint64)

    return Seq(
        # Sender must have opted in
        Assert(App.optedIn(Txn.sender(), Global.current_application_id())),

        # Validate raw byte lengths
        Assert(Len(kwh_saved_bytes) == Int(8)),
        Assert(Len(nonce_bytes)     == Int(8)),
        Assert(Len(sig_bytes)       == Int(64)),
        Assert(kwh_saved > Int(0)),

        # Verify oracle signature
        Assert(Ed25519Verify(claim_data, sig_bytes, oracle_pubkey)),

        # Compute amount and sanity-check
        Assert(micro_gbt >= MIN_CLAIM_MICRO_GBT),

        # Read current local state
        prev_kwh    .store(App.localGet(Txn.sender(), KEY_KWH_SAVED_TOTAL)),
        prev_claimed.store(App.localGet(Txn.sender(), KEY_GBT_CLAIMED)),

        # Issue GBT via inner transaction (contract must hold the asset)
        InnerTxnBuilder.Execute({
            TxnField.type_enum:    TxnType.AssetTransfer,
            TxnField.asset_sender: Global.current_application_address(),
            TxnField.asset_receiver: Txn.sender(),
            TxnField.xfer_asset:   asset_id,
            TxnField.asset_amount: micro_gbt,
            TxnField.fee:          Int(0),   # fee pooling
        }),

        # Update local state
        App.localPut(
            Txn.sender(),
            KEY_KWH_SAVED_TOTAL,
            prev_kwh.load() + kwh_saved,
        ),
        App.localPut(
            Txn.sender(),
            KEY_GBT_CLAIMED,
            prev_claimed.load() + micro_gbt,
        ),

        # Update global stats
        App.globalPut(
            KEY_TOTAL_GBT_MINTED,
            App.globalGet(KEY_TOTAL_GBT_MINTED) + micro_gbt,
        ),
        App.globalPut(
            KEY_TOTAL_KWH_SAVED,
            App.globalGet(KEY_TOTAL_KWH_SAVED) + kwh_saved,
        ),

        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 3 – preview (pure read, no state change)
# ---------------------------------------------------------------------------
def op_preview() -> Expr:
    """
    Returns 1 (Approve) after asserting the calculation is non-zero.
    Off-chain callers simulate this call to read the computed micro_gbt
    via the ABI return log mechanism; no state is written.

    args[1] = kwh_saved (8-byte big-endian uint64)
    """
    kwh_saved = btoi_arg(1)
    micro_gbt = kwh_saved * MICRO_GBT_PER_KWH / DIVISOR

    return Seq(
        Assert(kwh_saved > Int(0)),
        Assert(micro_gbt >= MIN_CLAIM_MICRO_GBT),
        # Log the result so off-chain callers can inspect it
        Log(Itob(micro_gbt)),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
def approval_program() -> Expr:
    op = Txn.application_args[0]

    handle_create = Seq(
        Assert(Txn.application_args.length() >= Int(3)),
        op_create(),
    )

    handle_register = Seq(
        Assert(Txn.application_args.length() >= Int(3)),
        op_register_building(),
    )

    handle_claim = Seq(
        Assert(Txn.application_args.length() >= Int(4)),
        op_claim_credits(),
    )

    handle_preview = Seq(
        Assert(Txn.application_args.length() >= Int(2)),
        op_preview(),
    )

    return Cond(
        # Application create (no-op call during deployment, setup follows)
        [Txn.application_id() == Int(0),    Approve()],
        # Dispatch by first arg
        [op == Bytes("setup"),              handle_create],
        [op == Bytes("register_building"),  handle_register],
        [op == Bytes("claim_credits"),      handle_claim],
        [op == Bytes("preview"),            handle_preview],
    )


def clear_program() -> Expr:
    """
    On clear state: decrement total_buildings so the counter stays accurate.
    We do NOT refund GBT here – that would require an inner txn with full
    balance checks.  The user should transfer GBT out before clearing.
    """
    return Seq(
        If(App.globalGet(KEY_TOTAL_BUILDINGS) > Int(0)).Then(
            App.globalPut(
                KEY_TOTAL_BUILDINGS,
                App.globalGet(KEY_TOTAL_BUILDINGS) - Int(1),
            )
        ),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Compile helpers
# ---------------------------------------------------------------------------
def get_approval_program() -> str:
    return compileTeal(
        approval_program(),
        mode=Mode.Application,
        version=8,
    )


def get_clear_program() -> str:
    return compileTeal(
        clear_program(),
        mode=Mode.Application,
        version=8,
    )


if __name__ == "__main__":
    import os

    out_dir = os.path.join(os.path.dirname(__file__), "..", "build")
    os.makedirs(out_dir, exist_ok=True)

    with open(os.path.join(out_dir, "credit_registry_approval.teal"), "w") as f:
        f.write(get_approval_program())

    with open(os.path.join(out_dir, "credit_registry_clear.teal"), "w") as f:
        f.write(get_clear_program())

    print("CreditRegistry TEAL written to", out_dir)
