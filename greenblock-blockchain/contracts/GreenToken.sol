// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * GreenBlock Token (GBT) — fungible ERC-20 carbon credit token.
 *
 * Unit:    1 GBT (1e18 wei) = 1 kg CO₂ avoided
 * Scale:   1 tonne CO₂ = 1,000 GBT = 1 CCC equivalent (India CCTS)
 * Source:  Tokens are minted ONLY by CreditRegistry after oracle verification.
 *
 * India grid emission factor used by oracle: 0.82 kg CO₂ per kWh (CEA 2023)
 * So saving 100 kWh → 82 GBT minted.
 */
contract GreenToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Total CO₂ offset ever retired (kg), for MRV reporting
    uint256 public totalRetiredKg;

    event CreditsMinted(address indexed building, uint256 amountGbt, uint256 timestamp);
    event CreditsRetired(address indexed owner, uint256 amountGbt, string reason, uint256 retirementId);

    // Incrementing retirement ID for certificate lookup
    uint256 private _retirementCounter;

    struct RetirementRecord {
        address owner;
        uint256 amountGbt;
        string reason;
        uint256 timestamp;
    }

    mapping(uint256 => RetirementRecord) public retirements;

    constructor() ERC20("GreenBlock Token", "GBT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit CreditsMinted(to, amount, block.timestamp);
    }

    /**
     * Retire (burn) GBT tokens permanently to offset carbon emissions.
     * Emits a RetirementRecord that serves as an on-chain certificate.
     */
    function retire(uint256 amount, string calldata reason) external returns (uint256 retirementId) {
        _burn(msg.sender, amount);

        retirementId = ++_retirementCounter;
        totalRetiredKg += amount / 1e18; // convert wei-GBT to kg

        retirements[retirementId] = RetirementRecord({
            owner: msg.sender,
            amountGbt: amount,
            reason: reason,
            timestamp: block.timestamp
        });

        emit CreditsRetired(msg.sender, amount, reason, retirementId);
    }

    function getRetirement(uint256 retirementId) external view returns (RetirementRecord memory) {
        return retirements[retirementId];
    }

    function totalRetirements() external view returns (uint256) {
        return _retirementCounter;
    }
}
