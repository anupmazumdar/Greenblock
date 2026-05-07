// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GreenToken.sol";

/**
 * RetirementLedger — issues ERC-721 NFT certificates when GBT tokens are retired.
 *
 * When a building owner wants to claim their carbon offset (e.g. for CSR reporting,
 * CCTS compliance evidence, or Verra methodology submission), they call
 * retireAndCertify(). This burns GBT and mints an NFT with:
 *   - Amount retired (kg CO₂)
 *   - Building name + location
 *   - Beneficiary organisation (who gets credit for the offset)
 *   - Timestamp
 *   - Unique certificate number
 *
 * The NFT metadata URI points to a JSON blob (stored on IPFS or the FastAPI backend)
 * containing the full MRV data for auditor verification.
 */
contract RetirementLedger is ERC721, ERC721URIStorage, Ownable {

    GreenToken public immutable greenToken;

    uint256 private _certCounter;

    struct Certificate {
        uint256 id;
        address retiree;
        uint256 amountGbt;       // GBT burned (wei)
        uint256 kgCo2;           // human-readable kg CO₂ (amountGbt / 1e18)
        string buildingId;
        string beneficiary;      // e.g. "ABC Corp CSR 2024-25"
        string methodology;      // e.g. "GreenBlock IoT-MRV v1.0 / CEA Grid Factor 0.82"
        uint256 timestamp;
        string ipfsMetadataUri;  // points to full MRV JSON
    }

    mapping(uint256 => Certificate) public certificates;
    // Track all cert IDs per address
    mapping(address => uint256[]) public addressCertificates;

    // Cumulative CO₂ offset via this ledger (tonnes)
    uint256 public totalCo2OffsetTonnes;

    event CertificateIssued(
        uint256 indexed certId,
        address indexed retiree,
        uint256 kgCo2,
        string buildingId,
        string beneficiary
    );

    constructor(address _greenToken) ERC721("GreenBlock Retirement Certificate", "GBRC") Ownable(msg.sender) {
        greenToken = GreenToken(_greenToken);
    }

    /**
     * Retire GBT tokens and receive an NFT retirement certificate.
     *
     * @param amountGbt        GBT to retire (wei, e.g. 82e18 = 82 kg CO₂)
     * @param buildingId       Human-readable building identifier
     * @param beneficiary      Who receives credit for the offset
     * @param ipfsMetadataUri  IPFS CID or API URL for full MRV JSON
     */
    function retireAndCertify(
        uint256 amountGbt,
        string calldata buildingId,
        string calldata beneficiary,
        string calldata ipfsMetadataUri
    ) external returns (uint256 certId) {
        require(amountGbt >= 1e18, "Minimum 1 GBT (1 kg CO2)");
        require(bytes(buildingId).length > 0, "buildingId required");
        require(bytes(beneficiary).length > 0, "beneficiary required");

        // Burn GBT from caller
        greenToken.transferFrom(msg.sender, address(0x000000000000000000000000000000000000dEaD), amountGbt);

        certId = ++_certCounter;
        uint256 kgCo2 = amountGbt / 1e18;

        totalCo2OffsetTonnes += kgCo2 / 1000;

        certificates[certId] = Certificate({
            id: certId,
            retiree: msg.sender,
            amountGbt: amountGbt,
            kgCo2: kgCo2,
            buildingId: buildingId,
            beneficiary: beneficiary,
            methodology: "GreenBlock IoT-MRV v1.0 | India CEA Grid Factor 0.82 kg CO2/kWh",
            timestamp: block.timestamp,
            ipfsMetadataUri: ipfsMetadataUri
        });

        addressCertificates[msg.sender].push(certId);

        _safeMint(msg.sender, certId);
        _setTokenURI(certId, ipfsMetadataUri);

        emit CertificateIssued(certId, msg.sender, kgCo2, buildingId, beneficiary);
    }

    function getCertificate(uint256 certId) external view returns (Certificate memory) {
        return certificates[certId];
    }

    function getMyCertificates(address owner) external view returns (uint256[] memory) {
        return addressCertificates[owner];
    }

    // ─── ERC-721 overrides ─────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
