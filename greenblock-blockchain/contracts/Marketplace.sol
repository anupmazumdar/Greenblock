// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GreenToken.sol";

/**
 * GreenBlock Marketplace — peer-to-peer GBT carbon credit trading.
 *
 * Sellers list GBT at a MATIC/POL price per token (wei).
 * Buyers send MATIC, receive GBT atomically via smart contract.
 * Platform fee: 1% of each trade (configurable, max 5%).
 *
 * This maps to India's CCTS voluntary offset mechanism where non-obligated
 * entities can buy credits from buildings that have verified emission savings.
 */
contract Marketplace is ReentrancyGuard, Ownable {

    GreenToken public immutable greenToken;

    // Platform fee in basis points (100 = 1%)
    uint256 public feeBps = 100;
    uint256 public constant MAX_FEE_BPS = 500; // 5% cap

    uint256 private _listingCounter;

    struct Listing {
        uint256 id;
        address seller;
        uint256 amountGbt;       // total GBT listed (wei)
        uint256 amountRemaining; // GBT still available
        uint256 pricePerGbt;     // MATIC wei per GBT wei
        bool active;
        uint256 listedAt;
    }

    mapping(uint256 => Listing) public listings;

    // Track all listing IDs per seller
    mapping(address => uint256[]) public sellerListings;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 amountGbt,
        uint256 pricePerGbt
    );
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amountGbt,
        uint256 maticPaid
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _greenToken) Ownable(msg.sender) {
        greenToken = GreenToken(_greenToken);
    }

    // ─── Seller Actions ────────────────────────────────────────────────────

    /**
     * List GBT tokens for sale.
     * @param amountGbt     Amount to sell (GBT in wei, e.g. 1e18 = 1 GBT = 1 kg CO₂)
     * @param pricePerGbt   Price in MATIC wei per GBT wei
     */
    function listCredits(uint256 amountGbt, uint256 pricePerGbt) external returns (uint256 listingId) {
        require(amountGbt > 0, "Amount must be positive");
        require(pricePerGbt > 0, "Price must be positive");

        // Pull tokens from seller into escrow (this contract)
        greenToken.transferFrom(msg.sender, address(this), amountGbt);

        listingId = ++_listingCounter;

        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            amountGbt: amountGbt,
            amountRemaining: amountGbt,
            pricePerGbt: pricePerGbt,
            active: true,
            listedAt: block.timestamp
        });

        sellerListings[msg.sender].push(listingId);

        emit Listed(listingId, msg.sender, amountGbt, pricePerGbt);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not your listing");
        require(listing.active, "Already inactive");

        listing.active = false;

        // Return unsold tokens to seller
        if (listing.amountRemaining > 0) {
            greenToken.transfer(msg.sender, listing.amountRemaining);
        }

        emit ListingCancelled(listingId, msg.sender);
    }

    // ─── Buyer Actions ─────────────────────────────────────────────────────

    /**
     * Buy GBT from a listing. Send exact MATIC value.
     * @param listingId   The listing to purchase from
     * @param amountGbt   How many GBT (wei) to buy
     */
    function buyCredits(uint256 listingId, uint256 amountGbt) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(amountGbt > 0 && amountGbt <= listing.amountRemaining, "Invalid amount");

        uint256 totalCost = amountGbt * listing.pricePerGbt / 1e18;
        require(msg.value >= totalCost, "Insufficient MATIC sent");

        listing.amountRemaining -= amountGbt;
        if (listing.amountRemaining == 0) {
            listing.active = false;
        }

        // Calculate fee and seller proceeds
        uint256 fee = (totalCost * feeBps) / 10_000;
        uint256 sellerProceeds = totalCost - fee;

        // Transfer GBT to buyer
        greenToken.transfer(msg.sender, amountGbt);

        // Pay seller
        (bool sent, ) = listing.seller.call{ value: sellerProceeds }("");
        require(sent, "Seller payment failed");

        // Refund excess MATIC
        if (msg.value > totalCost) {
            (bool refunded, ) = msg.sender.call{ value: msg.value - totalCost }("");
            require(refunded, "Refund failed");
        }

        emit Purchased(listingId, msg.sender, amountGbt, totalCost);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        feeBps = newFeeBps;
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        (bool sent, ) = owner().call{ value: balance }("");
        require(sent, "Withdrawal failed");
        emit FeesWithdrawn(owner(), balance);
    }

    // ─── View Helpers ──────────────────────────────────────────────────────

    function getActiveListings(uint256 offset, uint256 limit)
        external
        view
        returns (Listing[] memory results, uint256 total)
    {
        // Count active
        uint256 count = 0;
        for (uint256 i = 1; i <= _listingCounter; i++) {
            if (listings[i].active) count++;
        }
        total = count;

        uint256 end = offset + limit > count ? count : offset + limit;
        results = new Listing[](end > offset ? end - offset : 0);

        uint256 idx = 0;
        uint256 skipped = 0;
        for (uint256 i = 1; i <= _listingCounter && idx < results.length; i++) {
            if (!listings[i].active) continue;
            if (skipped < offset) { skipped++; continue; }
            results[idx++] = listings[i];
        }
    }

    function quotePrice(uint256 listingId, uint256 amountGbt)
        external
        view
        returns (uint256 totalMatic, uint256 fee, uint256 sellerReceives)
    {
        Listing memory listing = listings[listingId];
        totalMatic = amountGbt * listing.pricePerGbt / 1e18;
        fee = (totalMatic * feeBps) / 10_000;
        sellerReceives = totalMatic - fee;
    }
}
