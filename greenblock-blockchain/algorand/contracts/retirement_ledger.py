"""
RetirementLedger – GreenBlock Carbon Credit Retirement
PyTeal 0.24.x Smart Contract (ARC-72–style NFT certificates)

Global State (3 slots):
  next_cert_id      uint64   Auto-increment certificate counter (starts at 1)
  total_gbt_retired uint64   Cumulative microGBT burned via this contract
  gbt_asset_id      uint64   GBT ASA ID

Box Storage (one box per retirement certificate):
  Key   : b"cert_" + Itob(cert_id)   (13 bytes)
  Value : retiree(32) | amount_gbt(8) | kg_co2(8) | building_id(32)
          | timestamp(8) | ipfs_cid(46)
          ─── total 134 bytes ───

IPFS CID convention: 46-byte CIDv1 base32 (b… prefix), zero-padded if shorter.

Operations (Txn.application_args[0]):
  b"create"              – deploy-time init (creator only)
  b"retire_and_certify"  – burn GBT, mint certificate, emit log event
  b"get_certificate"     – readonly box read (simulate)
  b"get_my_certificates" – scan boxes for sender (simulate; off-chain use)

Burning GBT: send GBT to the zero address via inner AssetTransfer.
  ZeroAddress = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"
  On Algorand the canonical "burn" address is the zero 32-byte address.
"""

from pyteal import *  # noqa: F401,F403

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
KEY_NEXT_CERT_ID      = Bytes("next_cert_id")
KEY_TOTAL_GBT_RETIRED = Bytes("total_gbt_retired")
KEY_GBT_ASSET_ID      = Bytes("gbt_asset_id")

CERT_BOX_PREFIX = Bytes("cert_")   # 5-byte prefix

# Box value layout
RETIREE_OFFSET    = Int(0)
RETIREE_LEN       = Int(32)
AMOUNT_OFFSET     = Int(32)
AMOUNT_LEN        = Int(8)
KG_CO2_OFFSET     = Int(40)
KG_CO2_LEN        = Int(8)
BLDG_ID_OFFSET    = Int(48)
BLDG_ID_LEN       = Int(32)
TIMESTAMP_OFFSET  = Int(80)
TIMESTAMP_LEN     = Int(8)
IPFS_CID_OFFSET   = Int(88)
IPFS_CID_LEN      = Int(46)

CERT_BOX_VALUE_LEN = Int(134)  # 32+8+8+32+8+46

# Algorand zero address (32 zero bytes) – used as burn target for GBT
ZERO_ADDRESS = Bytes("base16", "0000000000000000000000000000000000000000000000000000000000000000")

# CO₂ conversion: microGBT * 1_000_000 / 1_000_000_000_000 = kg_co2
# Simpler: kg_co2 = microGBT / 1_000_000  (since 1 GBT = 1 kg CO₂, 1 microGBT = 1e-6 kg)
CO2_DIVISOR = Int(1_000_000)


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
def cert_box_key(cert_id: Expr) -> Expr:
    """Return 13-byte box key for a certificate."""
    return Concat(CERT_BOX_PREFIX, Itob(cert_id))


def pad_to(data: Expr, target_len: int) -> Expr:
    """Right-pad `data` with zero bytes to reach `target_len` bytes."""
    pad_len = target_len - 1   # worst case; we use Substring for exact cut
    # Build zero-padded version by concatenating a zero-filled suffix
    zeros = Bytes("base16", "00" * target_len)
    return Substring(
        Concat(data, zeros),
        Int(0),
        Int(target_len),
    )


# ---------------------------------------------------------------------------
# Op 0 – create
# ---------------------------------------------------------------------------
def op_create() -> Expr:
    """
    args[1] = 8-byte GBT ASA ID
    """
    asset_id = Btoi(Txn.application_args[1])

    return Seq(
        Assert(Txn.sender() == Global.creator_address()),
        App.globalPut(KEY_GBT_ASSET_ID,      asset_id),
        App.globalPut(KEY_NEXT_CERT_ID,       Int(1)),
        App.globalPut(KEY_TOTAL_GBT_RETIRED,  Int(0)),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 1 – retire_and_certify
# ---------------------------------------------------------------------------
def op_retire_and_certify() -> Expr:
    """
    Burn caller's GBT and issue a tamper-proof retirement certificate.

    args[1] = 8-byte amount_micro_gbt to retire
    args[2] = building_id (≤ 32 bytes, will be right-padded)
    args[3] = IPFS CID   (≤ 46 bytes, will be right-padded)

    Group:
      Txn[0] : ApplicationCall (this txn)
      Txn[1] : AssetTransfer  GBT from retiree → contract  (amount == args[1])
                The contract then burns it by sending to ZERO_ADDRESS.

    Events emitted (via Log):
      Log 0 : "retire:" + Itob(cert_id) + Itob(amount_gbt)
    """
    amount_gbt  = Btoi(Txn.application_args[1])
    building_id_raw = Txn.application_args[2]
    ipfs_cid_raw    = Txn.application_args[3]

    asset_id    = App.globalGet(KEY_GBT_ASSET_ID)
    cert_id     = App.globalGet(KEY_NEXT_CERT_ID)
    box_key     = cert_box_key(cert_id)

    # kg CO₂ = microGBT / 1_000_000  (integer division; OK for certificate)
    kg_co2 = amount_gbt / CO2_DIVISOR

    # Pad fields to fixed widths
    building_id_padded = pad_to(building_id_raw, 32)
    ipfs_cid_padded    = pad_to(ipfs_cid_raw, 46)

    # Compose 134-byte box value
    box_value = Concat(
        Txn.sender(),                # retiree    (32)
        Itob(amount_gbt),            # amount_gbt  (8)
        Itob(kg_co2),                # kg_co2      (8)
        building_id_padded,          # building_id (32)
        Itob(Global.latest_timestamp()),  # timestamp  (8)
        ipfs_cid_padded,             # ipfs_cid   (46)
    )

    xfer_txn_idx = Int(1)

    return Seq(
        Assert(Global.group_size() >= Int(2)),
        Assert(amount_gbt > Int(0)),
        Assert(Len(building_id_raw) <= Int(32)),
        Assert(Len(ipfs_cid_raw)    <= Int(46)),

        # Verify the grouped GBT transfer from retiree to contract
        Assert(Gtxn[xfer_txn_idx].type_enum()      == TxnType.AssetTransfer),
        Assert(Gtxn[xfer_txn_idx].xfer_asset()     == asset_id),
        Assert(Gtxn[xfer_txn_idx].asset_receiver() == Global.current_application_address()),
        Assert(Gtxn[xfer_txn_idx].asset_amount()   == amount_gbt),
        Assert(Gtxn[xfer_txn_idx].sender()         == Txn.sender()),

        # Burn GBT: inner transfer from contract to zero address
        InnerTxnBuilder.Execute({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.xfer_asset:     asset_id,
            TxnField.asset_receiver: ZERO_ADDRESS,
            TxnField.asset_amount:   amount_gbt,
            TxnField.fee:            Int(0),
        }),

        # Create certificate box (exact 134 bytes)
        Assert(Len(box_value) == CERT_BOX_VALUE_LEN),
        Pop(Box.create(box_key, CERT_BOX_VALUE_LEN)),
        Box.put(box_key, box_value),

        # Update global state
        App.globalPut(KEY_NEXT_CERT_ID, cert_id + Int(1)),
        App.globalPut(
            KEY_TOTAL_GBT_RETIRED,
            App.globalGet(KEY_TOTAL_GBT_RETIRED) + amount_gbt,
        ),

        # Emit structured log event
        Log(
            Concat(
                Bytes("retire:"),
                Itob(cert_id),
                Itob(amount_gbt),
            )
        ),

        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 2 – get_certificate (readonly simulate)
# ---------------------------------------------------------------------------
def op_get_certificate() -> Expr:
    """
    args[1] = 8-byte cert_id
    Logs the raw 134-byte certificate box value.
    """
    cert_id = Btoi(Txn.application_args[1])
    box_key = cert_box_key(cert_id)

    sv_val = ScratchVar(TealType.bytes)

    return Seq(
        Assert(Box.length(box_key).hasValue()),
        sv_val.store(Box.get(box_key).value()),
        Log(sv_val.load()),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 3 – get_my_certificates (readonly simulate)
# ---------------------------------------------------------------------------
def op_get_my_certificates() -> Expr:
    """
    Iterates certificate IDs 1 … (next_cert_id - 1) and logs any cert
    whose retiree field matches Txn.sender().

    This is O(n) and is intended for off-chain simulation calls only.
    The AVM loop limit is handled via a fixed iteration count (up to 255
    iterations per call due to opcode budget).

    args[1] = (optional) 8-byte start_id for pagination (default 1)
    args[2] = (optional) 8-byte max_results to return   (default 32)

    Logs one Itob(cert_id) per matching certificate.
    """
    has_start     = Txn.application_args.length() >= Int(2)
    has_max       = Txn.application_args.length() >= Int(3)

    start_id   = If(has_start, Btoi(Txn.application_args[1]), Int(1))
    max_results = If(has_max,   Btoi(Txn.application_args[2]), Int(32))

    next_id     = App.globalGet(KEY_NEXT_CERT_ID)

    # Iteration variables
    sv_i         = ScratchVar(TealType.uint64)
    sv_found     = ScratchVar(TealType.uint64)
    sv_end       = ScratchVar(TealType.uint64)
    sv_key       = ScratchVar(TealType.bytes)
    sv_retiree   = ScratchVar(TealType.bytes)
    sv_box_exists = ScratchVar(TealType.uint64)

    # We use a While loop; max 255 to stay within opcode budget
    max_iter = Int(255)

    return Seq(
        Assert(max_results > Int(0)),
        Assert(max_results <= Int(64)),

        sv_end.store(
            If(next_id - Int(1) < start_id + max_iter - Int(1),
               next_id - Int(1),
               start_id + max_iter - Int(1))
        ),
        sv_i    .store(start_id),
        sv_found.store(Int(0)),

        While(
            And(sv_i.load() <= sv_end.load(), sv_found.load() < max_results)
        ).Do(
            Seq(
                sv_key.store(cert_box_key(sv_i.load())),
                # Check box existence via Box.length
                sv_box_exists.store(
                    If(Box.length(sv_key.load()).hasValue(), Int(1), Int(0))
                ),
                If(sv_box_exists.load() == Int(1)).Then(
                    Seq(
                        sv_retiree.store(
                            Box.extract(sv_key.load(), RETIREE_OFFSET, RETIREE_LEN)
                        ),
                        If(sv_retiree.load() == Txn.sender()).Then(
                            Seq(
                                Log(Itob(sv_i.load())),
                                sv_found.store(sv_found.load() + Int(1)),
                            )
                        ),
                    )
                ),
                sv_i.store(sv_i.load() + Int(1)),
            )
        ),

        Approve(),
    )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
def approval_program() -> Expr:
    op = Txn.application_args[0]

    return Cond(
        [Txn.application_id() == Int(0),      Approve()],
        [op == Bytes("create"),               op_create()],
        [op == Bytes("retire_and_certify"),    op_retire_and_certify()],
        [op == Bytes("get_certificate"),       op_get_certificate()],
        [op == Bytes("get_my_certificates"),   op_get_my_certificates()],
    )


def clear_program() -> Expr:
    return Approve()


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

    with open(os.path.join(out_dir, "retirement_ledger_approval.teal"), "w") as f:
        f.write(get_approval_program())

    with open(os.path.join(out_dir, "retirement_ledger_clear.teal"), "w") as f:
        f.write(get_clear_program())

    print("RetirementLedger TEAL written to", out_dir)
