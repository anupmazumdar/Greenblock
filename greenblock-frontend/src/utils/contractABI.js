/**
 * Contract ABIs and addresses for GreenBlock blockchain integration.
 *
 * Addresses are loaded from:
 *   1. localStorage override (GREENBLOCK_CONTRACT_ADDRESSES) — for dev
 *   2. VITE_CONTRACT_* env vars — for production deploys
 *   3. These hardcoded Amoy testnet defaults — for demo
 *
 * After running `npx hardhat run scripts/deploy.js --network polygonAmoy`,
 * copy the addresses from deployments/polygonAmoy.json into .env:
 *   VITE_CONTRACT_GREEN_TOKEN=0x...
 *   VITE_CONTRACT_CREDIT_REGISTRY=0x...
 *   VITE_CONTRACT_MARKETPLACE=0x...
 *   VITE_CONTRACT_RETIREMENT_LEDGER=0x...
 */

function getAddresses() {
  try {
    const override = localStorage.getItem('GREENBLOCK_CONTRACT_ADDRESSES')
    if (override) return JSON.parse(override)
  } catch { /* ignore */ }

  return {
    GreenToken: import.meta.env.VITE_CONTRACT_GREEN_TOKEN || '',
    CreditRegistry: import.meta.env.VITE_CONTRACT_CREDIT_REGISTRY || '',
    Marketplace: import.meta.env.VITE_CONTRACT_MARKETPLACE || '',
    RetirementLedger: import.meta.env.VITE_CONTRACT_RETIREMENT_LEDGER || '',
  }
}

export const CONTRACT_ADDRESSES = getAddresses()

export const SUPPORTED_CHAIN_IDS = {
  80002: 'Polygon Amoy Testnet',
  137: 'Polygon Mainnet',
  31337: 'Hardhat Local',
}

export const GREEN_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function retire(uint256 amount, string reason) returns (uint256 retirementId)",
  "function getRetirement(uint256 retirementId) view returns (tuple(address owner, uint256 amountGbt, string reason, uint256 timestamp))",
  "function totalRetirements() view returns (uint256)",
  "function totalRetiredKg() view returns (uint256)",
  "event CreditsMinted(address indexed building, uint256 amountGbt, uint256 timestamp)",
  "event CreditsRetired(address indexed owner, uint256 amountGbt, string reason, uint256 retirementId)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

export const CREDIT_REGISTRY_ABI = [
  "function registerBuilding(string buildingId, string location, uint256 baselineKwhMonth)",
  "function deactivateBuilding()",
  "function claimCredits(uint256 kwhSaved, uint256 nonce, bytes signature)",
  "function getBuildingStats(address owner) view returns (tuple(string buildingId, string location, uint256 baselineKwhMonth, uint256 registeredAt, bool active), uint256 kwhSaved, uint256 gbtEarned, uint256 currentBalance)",
  "function previewCredits(uint256 kwhSaved) pure returns (uint256 gbtWei)",
  "function buildings(address) view returns (string buildingId, string location, uint256 baselineKwhMonth, uint256 registeredAt, bool active)",
  "function GBT_WEI_PER_KWH() view returns (uint256)",
  "event BuildingRegistered(address indexed owner, string buildingId, string location)",
  "event CreditsIssued(address indexed building, uint256 kwhSaved, uint256 gbtMinted, bytes32 claimHash)",
]

export const MARKETPLACE_ABI = [
  "function listCredits(uint256 amountGbt, uint256 pricePerGbt) returns (uint256 listingId)",
  "function cancelListing(uint256 listingId)",
  "function buyCredits(uint256 listingId, uint256 amountGbt) payable",
  "function getActiveListings(uint256 offset, uint256 limit) view returns (tuple(uint256 id, address seller, uint256 amountGbt, uint256 amountRemaining, uint256 pricePerGbt, bool active, uint256 listedAt)[], uint256 total)",
  "function quotePrice(uint256 listingId, uint256 amountGbt) view returns (uint256 totalMatic, uint256 fee, uint256 sellerReceives)",
  "function listings(uint256) view returns (uint256 id, address seller, uint256 amountGbt, uint256 amountRemaining, uint256 pricePerGbt, bool active, uint256 listedAt)",
  "function feeBps() view returns (uint256)",
  "event Listed(uint256 indexed listingId, address indexed seller, uint256 amountGbt, uint256 pricePerGbt)",
  "event Purchased(uint256 indexed listingId, address indexed buyer, uint256 amountGbt, uint256 maticPaid)",
  "event ListingCancelled(uint256 indexed listingId, address indexed seller)",
]

export const RETIREMENT_LEDGER_ABI = [
  "function retireAndCertify(uint256 amountGbt, string buildingId, string beneficiary, string ipfsMetadataUri) returns (uint256 certId)",
  "function getCertificate(uint256 certId) view returns (tuple(uint256 id, address retiree, uint256 amountGbt, uint256 kgCo2, string buildingId, string beneficiary, string methodology, uint256 timestamp, string ipfsMetadataUri))",
  "function getMyCertificates(address owner) view returns (uint256[])",
  "function totalCo2OffsetTonnes() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event CertificateIssued(uint256 indexed certId, address indexed retiree, uint256 kgCo2, string buildingId, string beneficiary)",
]
