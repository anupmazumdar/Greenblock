const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const oracleSignerAddress = process.env.ORACLE_SIGNER_ADDRESS || deployer.address;

  console.log(`\nDeploying GreenBlock contracts on: ${network.name}`);
  console.log(`Deployer:      ${deployer.address}`);
  console.log(`Oracle signer: ${oracleSignerAddress}`);
  console.log(`Balance:       ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC\n`);

  // 1. Deploy GreenToken
  const GreenToken = await ethers.getContractFactory("GreenToken");
  const greenToken = await GreenToken.deploy();
  await greenToken.waitForDeployment();
  console.log(`GreenToken       deployed: ${await greenToken.getAddress()}`);

  // 2. Deploy CreditRegistry (needs GreenToken address + oracle signer)
  const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
  const creditRegistry = await CreditRegistry.deploy(
    await greenToken.getAddress(),
    oracleSignerAddress
  );
  await creditRegistry.waitForDeployment();
  console.log(`CreditRegistry   deployed: ${await creditRegistry.getAddress()}`);

  // 3. Grant MINTER_ROLE on GreenToken to CreditRegistry
  const MINTER_ROLE = await greenToken.MINTER_ROLE();
  await greenToken.grantRole(MINTER_ROLE, await creditRegistry.getAddress());
  console.log(`MINTER_ROLE granted to CreditRegistry`);

  // 4. Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(await greenToken.getAddress());
  await marketplace.waitForDeployment();
  console.log(`Marketplace      deployed: ${await marketplace.getAddress()}`);

  // 5. Deploy RetirementLedger
  const RetirementLedger = await ethers.getContractFactory("RetirementLedger");
  const retirementLedger = await RetirementLedger.deploy(await greenToken.getAddress());
  await retirementLedger.waitForDeployment();
  console.log(`RetirementLedger deployed: ${await retirementLedger.getAddress()}`);

  // 6. Write deployment addresses to JSON (consumed by frontend + backend)
  const deployment = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    oracleSigner: oracleSignerAddress,
    contracts: {
      GreenToken: await greenToken.getAddress(),
      CreditRegistry: await creditRegistry.getAddress(),
      Marketplace: await marketplace.getAddress(),
      RetirementLedger: await retirementLedger.getAddress(),
    },
  };

  const outDir = path.join(__dirname, "../deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment saved: ${outPath}`);

  // 7. Also copy ABIs to a shared folder for the frontend
  await exportAbis();

  console.log("\nAll contracts deployed successfully.");
  return deployment;
}

async function exportAbis() {
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const abiOutDir = path.join(__dirname, "../../greenblock-frontend/src/utils/abis");
  fs.mkdirSync(abiOutDir, { recursive: true });

  const contracts = ["GreenToken", "CreditRegistry", "Marketplace", "RetirementLedger"];

  for (const name of contracts) {
    const artifactPath = path.join(artifactsDir, `${name}.sol`, `${name}.json`);
    if (!fs.existsSync(artifactPath)) {
      console.warn(`  ABI not found for ${name} (run 'npx hardhat compile' first)`);
      continue;
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiPath = path.join(abiOutDir, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`  ABI exported: ${name}.json`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
