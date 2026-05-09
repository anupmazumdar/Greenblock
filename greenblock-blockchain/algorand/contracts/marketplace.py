"""
Marketplace – GreenBlock Carbon Credit Trading
PyTeal 0.24.x Smart Contract

Global State (4 slots):
  fee_bps          uint64  Fee in basis points (100 = 1 %)
  total_listings   uint64  Count of listings ever created
  total_volume_gbt uint64  Cumulative microGBT traded
  gbt_asset_id     uint64  GBT ASA ID

Box Storage (one box per listing):
  Key   : b"lst_" + Itob(listing_id)   (12 bytes)
  Value : seller(32) | amount(8) | price_per_gbt_microalgo(8) | active(1)
          ─── total 49 bytes ───

Operations (Txn.application_args[0]):
  b"create"         – deploy-time init (creator only)
  b"list_credits"   – deposit GBT, create listing box
  b"buy_credits"    – pay ALGO, receive GBT (fee deducted)
  b"cancel_listing" – return GBT to seller, deactivate listing
  b"get_listing"    – readonly box read (simulate only)

Fee mechanics:
  buyer pays: amount * price_per_gbt_microalgo  microAlgo total
  fee       : total_price * fee_bps / 10_000
  seller gets: total_price - fee   (sent to seller)
  fee goes to: Global.creator_address()
"""

from pyteal import *  # noqa: F401,F403

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
KEY_FEE_BPS          = Bytes("fee_bps")
KEY_TOTAL_LISTINGS   = Bytes("total_listings")
KEY_TOTAL_VOLUME_GBT = Bytes("total_volume_gbt")
KEY_GBT_ASSET_ID     = Bytes("gbt_asset_id")

BOX_PREFIX           = Bytes("lst_")   # 4-byte prefix for listing boxes

# Box layout offsets (bytes)
SELLER_OFFSET        = Int(0)
SELLER_LEN           = Int(32)
AMOUNT_OFFSET        = Int(32)
AMOUNT_LEN           = Int(8)
PRICE_OFFSET         = Int(40)
PRICE_LEN            = Int(8)
ACTIVE_OFFSET        = Int(48)
BOX_VALUE_LEN        = Int(49)  # 32 + 8 + 8 + 1

DEFAULT_FEE_BPS      = Int(100)   # 1 %
BPS_DENOM            = Int(10_000)

# Minimum ALGO balance a box costs (box creation MBR ≈ 0.0025 ALGO + per-byte)
# The caller is expected to attach enough balance; we don't enforce exact MBR here
# because it varies by network version.  The standard AVM box MBR is:
#   2_500 + 400 * (box_key_len + box_value_len)  microAlgo
BOX_MBR = Int(2_500 + 400 * (12 + 49))  # ≈ 26_900 microAlgo


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
def listing_box_key(listing_id: Expr) -> Expr:
    """Return the 12-byte box key for a given listing_id uint64."""
    return Concat(BOX_PREFIX, Itob(listing_id))


def read_box_field(box_key: Expr, offset: Expr, length: Expr) -> Expr:
    """Extract a field from a listing box using Box.extract."""
    return Box.extract(box_key, offset, length)


def listing_is_active(box_key: Expr) -> Expr:
    return Btoi(read_box_field(box_key, ACTIVE_OFFSET, Int(1))) == Int(1)


# ---------------------------------------------------------------------------
# Op 0 – create
# ---------------------------------------------------------------------------
def op_create() -> Expr:
    """
    args[1] = 8-byte GBT asset ID
    args[2] = (optional) 8-byte fee_bps override
    """
    asset_id    = Btoi(Txn.application_args[1])
    has_fee_arg = Txn.application_args.length() >= Int(3)
    fee_bps_val = If(has_fee_arg, Btoi(Txn.application_args[2]), DEFAULT_FEE_BPS)

    return Seq(
        Assert(Txn.sender() == Global.creator_address()),
        App.globalPut(KEY_GBT_ASSET_ID,     asset_id),
        App.globalPut(KEY_FEE_BPS,          fee_bps_val),
        App.globalPut(KEY_TOTAL_LISTINGS,   Int(0)),
        App.globalPut(KEY_TOTAL_VOLUME_GBT, Int(0)),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 1 – list_credits
# ---------------------------------------------------------------------------
def op_list_credits() -> Expr:
    """
    The seller groups this call with a GBT AssetTransfer into the contract.

    args[1] = 8-byte amount in microGBT to list
    args[2] = 8-byte price_per_gbt in microAlgo per microGBT unit

    The transaction group must include:
      Txn[0] : ApplicationCall (this txn)
      Txn[1] : AssetTransfer  GBT from seller → contract (amount == args[1])
    """
    amount        = Btoi(Txn.application_args[1])
    price_per_gbt = Btoi(Txn.application_args[2])

    listing_id    = App.globalGet(KEY_TOTAL_LISTINGS) + Int(1)
    box_key       = listing_box_key(listing_id)

    asset_id      = App.globalGet(KEY_GBT_ASSET_ID)

    # The paired asset-transfer transaction must be in the same group
    xfer_txn_idx  = Int(1)   # index of the GBT xfer in the group

    # Build the 49-byte box value
    box_value = Concat(
        Txn.sender(),                   # seller  (32)
        Txn.application_args[1],        # amount  ( 8)
        Txn.application_args[2],        # price   ( 8)
        Bytes("base16", "01"),          # active  ( 1)
    )

    return Seq(
        Assert(Global.group_size() >= Int(2)),
        Assert(amount > Int(0)),
        Assert(price_per_gbt > Int(0)),

        # Verify the paired GBT transfer
        Assert(Gtxn[xfer_txn_idx].type_enum()    == TxnType.AssetTransfer),
        Assert(Gtxn[xfer_txn_idx].xfer_asset()   == asset_id),
        Assert(Gtxn[xfer_txn_idx].asset_receiver() == Global.current_application_address()),
        Assert(Gtxn[xfer_txn_idx].asset_amount()  == amount),
        Assert(Gtxn[xfer_txn_idx].sender()        == Txn.sender()),

        # Verify box value length
        Assert(Len(box_value) == BOX_VALUE_LEN),

        # Create the listing box
        Pop(Box.create(box_key, BOX_VALUE_LEN)),
        Box.put(box_key, box_value),

        # Increment listing counter
        App.globalPut(KEY_TOTAL_LISTINGS, listing_id),

        # Log new listing ID for off-chain indexing
        Log(Itob(listing_id)),

        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 2 – buy_credits
# ---------------------------------------------------------------------------
def op_buy_credits() -> Expr:
    """
    Buyer pays ALGO; receives GBT; seller gets ALGO minus fee; creator gets fee.

    args[1] = 8-byte listing_id
    args[2] = 8-byte amount_to_buy in microGBT (≤ listing amount)

    Group:
      Txn[0] : ApplicationCall (this txn)
      Txn[1] : Payment  buyer → contract  (total_price microAlgo)
    """
    listing_id    = Btoi(Txn.application_args[1])
    buy_amount    = Btoi(Txn.application_args[2])

    box_key       = listing_box_key(listing_id)
    asset_id      = App.globalGet(KEY_GBT_ASSET_ID)
    fee_bps       = App.globalGet(KEY_FEE_BPS)

    # Scratchvars
    sv_seller      = ScratchVar(TealType.bytes)
    sv_listed_amt  = ScratchVar(TealType.uint64)
    sv_price       = ScratchVar(TealType.uint64)
    sv_total_price = ScratchVar(TealType.uint64)
    sv_fee         = ScratchVar(TealType.uint64)
    sv_seller_gets = ScratchVar(TealType.uint64)
    sv_remaining   = ScratchVar(TealType.uint64)

    payment_txn_idx = Int(1)

    return Seq(
        Assert(Global.group_size() >= Int(2)),
        Assert(buy_amount > Int(0)),

        # Verify listing box exists and is active
        Assert(Box.length(box_key).hasValue()),
        Assert(listing_is_active(box_key)),

        # Read fields from box
        sv_seller    .store(read_box_field(box_key, SELLER_OFFSET, SELLER_LEN)),
        sv_listed_amt.store(Btoi(read_box_field(box_key, AMOUNT_OFFSET, AMOUNT_LEN))),
        sv_price     .store(Btoi(read_box_field(box_key, PRICE_OFFSET,  PRICE_LEN))),

        Assert(buy_amount <= sv_listed_amt.load()),

        # Price calculations
        sv_total_price.store(buy_amount * sv_price.load()),
        sv_fee        .store(sv_total_price.load() * fee_bps / BPS_DENOM),
        sv_seller_gets.store(sv_total_price.load() - sv_fee.load()),

        # Verify payment amount in grouped payment txn
        Assert(Gtxn[payment_txn_idx].type_enum()   == TxnType.Payment),
        Assert(Gtxn[payment_txn_idx].receiver()    == Global.current_application_address()),
        Assert(Gtxn[payment_txn_idx].amount()      >= sv_total_price.load()),

        # Inner txn 1: send GBT to buyer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.xfer_asset:     asset_id,
            TxnField.asset_receiver: Txn.sender(),
            TxnField.asset_amount:   buy_amount,
            TxnField.fee:            Int(0),
        }),
        InnerTxnBuilder.Submit(),

        # Inner txn 2: send ALGO to seller
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver:  sv_seller.load(),
            TxnField.amount:    sv_seller_gets.load(),
            TxnField.fee:       Int(0),
        }),
        InnerTxnBuilder.Submit(),

        # Inner txn 3: send fee to creator (skip if fee == 0)
        If(sv_fee.load() > Int(0)).Then(
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.receiver:  Global.creator_address(),
                    TxnField.amount:    sv_fee.load(),
                    TxnField.fee:       Int(0),
                }),
                InnerTxnBuilder.Submit(),
            )
        ),

        # Update box: decrement amount or mark inactive
        sv_remaining.store(sv_listed_amt.load() - buy_amount),
        If(sv_remaining.load() == Int(0)).Then(
            # Mark inactive
            Box.replace(box_key, ACTIVE_OFFSET, Bytes("base16", "00"))
        ).Else(
            # Write updated amount back
            Box.replace(box_key, AMOUNT_OFFSET, Itob(sv_remaining.load()))
        ),

        # Update global volume
        App.globalPut(
            KEY_TOTAL_VOLUME_GBT,
            App.globalGet(KEY_TOTAL_VOLUME_GBT) + buy_amount,
        ),

        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 3 – cancel_listing
# ---------------------------------------------------------------------------
def op_cancel_listing() -> Expr:
    """
    Seller cancels an active listing; GBT is returned.

    args[1] = 8-byte listing_id
    """
    listing_id   = Btoi(Txn.application_args[1])
    box_key      = listing_box_key(listing_id)
    asset_id     = App.globalGet(KEY_GBT_ASSET_ID)

    sv_seller = ScratchVar(TealType.bytes)
    sv_amount = ScratchVar(TealType.uint64)

    return Seq(
        Assert(Box.length(box_key).hasValue()),
        Assert(listing_is_active(box_key)),

        sv_seller.store(read_box_field(box_key, SELLER_OFFSET, SELLER_LEN)),
        sv_amount.store(Btoi(read_box_field(box_key, AMOUNT_OFFSET, AMOUNT_LEN))),

        # Only the original seller may cancel
        Assert(Txn.sender() == sv_seller.load()),

        # Return GBT to seller
        InnerTxnBuilder.Execute({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.xfer_asset:     asset_id,
            TxnField.asset_receiver: sv_seller.load(),
            TxnField.asset_amount:   sv_amount.load(),
            TxnField.fee:            Int(0),
        }),

        # Mark listing inactive
        Box.replace(box_key, ACTIVE_OFFSET, Bytes("base16", "00")),

        Approve(),
    )


# ---------------------------------------------------------------------------
# Op 4 – get_listing (simulate/readonly)
# ---------------------------------------------------------------------------
def op_get_listing() -> Expr:
    """
    args[1] = 8-byte listing_id
    Logs the raw 49-byte box value.
    """
    listing_id = Btoi(Txn.application_args[1])
    box_key    = listing_box_key(listing_id)

    sv_val = ScratchVar(TealType.bytes)

    return Seq(
        Assert(Box.length(box_key).hasValue()),
        sv_val.store(Box.get(box_key).value()),
        Log(sv_val.load()),
        Approve(),
    )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
def approval_program() -> Expr:
    op = Txn.application_args[0]

    return Cond(
        [Txn.application_id() == Int(0),   Approve()],   # allow deploy call
        [op == Bytes("create"),             op_create()],
        [op == Bytes("list_credits"),       op_list_credits()],
        [op == Bytes("buy_credits"),        op_buy_credits()],
        [op == Bytes("cancel_listing"),     op_cancel_listing()],
        [op == Bytes("get_listing"),        op_get_listing()],
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

    with open(os.path.join(out_dir, "marketplace_approval.teal"), "w") as f:
        f.write(get_approval_program())

    with open(os.path.join(out_dir, "marketplace_clear.teal"), "w") as f:
        f.write(get_clear_program())

    print("Marketplace TEAL written to", out_dir)
