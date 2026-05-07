// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./GreenToken.sol";

/**
 * CreditRegistry — building registration + oracle-verified credit issuance.
 *
 * Flow:
 *   1. Building owner calls registerBuilding() with their baseline kWh/month.
 *   2. GreenBlock FastAPI backend calculates energy savings from IoT sensors.
 *   3. Backend signs a credit claim: keccak256(walletAddress, kwhSaved, nonce).
 *   4. Building owner calls claimCredits() with the signed payload.
 *   5. Contract verifies oracle signature, mints GBT proportional to CO₂ avoided.
 *
 * India Grid Emission Factor: 0.82 kg CO₂ / kWh (CEA 2023 baseline)
 * GBT minted = kwhSaved × 820  (since 0.82 kg = 820 GBT-wei at 1 GBT = 1 kg)
 * — in 1e18 scale: gbtWei = kwhSaved × 820 × 1e15
 */
contract CreditRegistry is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    GreenToken public immutable greenToken;

    // Backend oracle wallet — signs off on IoT-verified energy savings
    address public oracleSigner;

    // India CEA 2023: 0.82 kg CO₂ per kWh → 820 g per kWh
    // GBT wei per kWh = 820 * 1e15 (since 1 GBT = 1 kg = 1e18 wei)
    uint256 public constant GBT_WEI_PER_KWH = 820 * 1e15;

    // Maximum kWh claimable per single oracle signature (anti-abuse)
    uint256 public constant MAX_KWH_PER_CLAIM = 50_000;

    struct Building {
        string buildingId;        // human-readable ID (e.g. "GREENBLOCK_B01")
        string location;          // city/state
        uint256 baselineKwhMonth; // historical monthly energy use
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Building) public buildings;
    // claimHash → used; prevents oracle signature replay attacks
    mapping(bytes32 => bool) public usedClaims;

    // Cumulative kWh saved per building for MRV reporting
    mapping(address => uint256) public totalKwhSaved;
    mapping(address => uint256) public totalGbtEarned;

    event BuildingRegistered(address indexed owner, string buildingId, string location);
    event BuildingDeactivated(address indexed owner, string buildingId);
    event CreditsIssued(
        address indexed building,
        uint256 kwhSaved,
        uint256 gbtMinted,
        bytes32 claimHash
    );
    event OracleSignerUpdated(address indexed oldSigner, address indexed newSigner);

    constructor(address _greenToken, address _oracleSigner) Ownable(msg.sender) {
        greenToken = GreenToken(_greenToken);
        oracleSigner = _oracleSigner;
    }

    // ─── Building Management ───────────────────────────────────────────────

    function registerBuilding(
        string calldata buildingId,
        string calldata location,
        uint256 baselineKwhMonth
    ) external {
        require(bytes(buildingId).length > 0, "buildingId required");
        require(baselineKwhMonth > 0, "Baseline must be positive");

        buildings[msg.sender] = Building({
            buildingId: buildingId,
            location: location,
            baselineKwhMonth: baselineKwhMonth,
            registeredAt: block.timestamp,
            active: true
        });

        emit BuildingRegistered(msg.sender, buildingId, location);
    }

    function deactivateBuilding() external {
        require(buildings[msg.sender].active, "Not registered");
        buildings[msg.sender].active = false;
        emit BuildingDeactivated(msg.sender, buildings[msg.sender].buildingId);
    }

    // ─── Credit Claiming (Oracle-Verified) ────────────────────────────────

    /**
     * @param kwhSaved   Energy saved vs baseline (integer kWh, no decimals)
     * @param nonce      Unique nonce from backend (unix timestamp of measurement)
     * @param signature  ECDSA signature: sign(keccak256(claimer, kwhSaved, nonce))
     */
    function claimCredits(
        uint256 kwhSaved,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(buildings[msg.sender].active, "Building not registered");
        require(kwhSaved > 0 && kwhSaved <= MAX_KWH_PER_CLAIM, "Invalid kWh amount");

        bytes32 claimHash = keccak256(abi.encodePacked(msg.sender, kwhSaved, nonce));
        require(!usedClaims[claimHash], "Claim already redeemed");

        // Verify oracle signed this exact claim
        address recovered = claimHash.toEthSignedMessageHash().recover(signature);
        require(recovered == oracleSigner, "Invalid oracle signature");

        usedClaims[claimHash] = true;

        uint256 gbtWei = kwhSaved * GBT_WEI_PER_KWH;

        totalKwhSaved[msg.sender] += kwhSaved;
        totalGbtEarned[msg.sender] += gbtWei;

        greenToken.mint(msg.sender, gbtWei);

        emit CreditsIssued(msg.sender, kwhSaved, gbtWei, claimHash);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    function updateOracleSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Zero address");
        emit OracleSignerUpdated(oracleSigner, newSigner);
        oracleSigner = newSigner;
    }

    // ─── View Helpers ──────────────────────────────────────────────────────

    function getBuildingStats(address owner) external view returns (
        Building memory building,
        uint256 kwhSaved,
        uint256 gbtEarned,
        uint256 currentBalance
    ) {
        return (
            buildings[owner],
            totalKwhSaved[owner],
            totalGbtEarned[owner],
            greenToken.balanceOf(owner)
        );
    }

    /**
     * Preview how many GBT a given kWh saving will earn (no state change).
     */
    function previewCredits(uint256 kwhSaved) external pure returns (uint256 gbtWei) {
        return kwhSaved * GBT_WEI_PER_KWH;
    }
}
