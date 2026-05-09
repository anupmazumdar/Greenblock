/**
 * GreenBlock — Solana Devnet deployment script
 *
 * Steps:
 *  1. Connect to Devnet
 *  2. Load deployer keypair from DEPLOYER_KEYPAIR_PATH or ~/.config/solana/id.json
 *  3. Request airdrop if balance < 2 SOL
 *  4. Build + deploy the program (anchor build must be run first)
 *  5. Initialize Registry (creates GBT mint + registry PDA)
 *  6. Initialize RetirementLedger
 *  7. Save deployment info to solana_deployments/devnet.json
 *
 * Usage:
 *   anchor build
 *   ORACLE_PUBKEY_HEX=<32-byte-hex> ts-node scripts/deploy.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import {
  Keypair, Connection, PublicKey, LAMPORTS_PER_SOL,
  SystemProgram, SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const DEVNET_RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const IDL_PATH   = path.resolve(__dirname, "../target/idl/greenblock.json");
const OUT_DIR    = path.resolve(__dirname, "../solana_deployments");

async function main() {
  const connection = new Connection(DEVNET_RPC, "confirmed");

  // Load deployer keypair
  const keypairPath = process.env.DEPLOYER_KEYPAIR_PATH
    ?? path.join(process.env.HOME ?? "~", ".config/solana/id.json");
  const deployer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);

  // Oracle public key (32-byte hex from env)
  const oraclePubHex = process.env.ORACLE_PUBKEY_HEX;
  if (!oraclePubHex || oraclePubHex.length !== 64) {
    throw new Error("Set ORACLE_PUBKEY_HEX env var (32-byte hex = 64 chars)");
  }
  const oraclePubkey = Array.from(Buffer.from(oraclePubHex, "hex")) as number[];

  // Airdrop if needed
  let balance = await connection.getBalance(deployer.publicKey);
  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.log("Requesting airdrop…");
    const sig = await connection.requestAirdrop(deployer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    balance = await connection.getBalance(deployer.publicKey);
    console.log(`Balance after airdrop: ${balance / LAMPORTS_PER_SOL} SOL`);
  }

  // Load IDL + create provider
  if (!fs.existsSync(IDL_PATH)) {
    throw new Error(`IDL not found at ${IDL_PATH} — run 'anchor build' first`);
  }
  const idl      = JSON.parse(fs.readFileSync(IDL_PATH, "utf8"));
  const provider = new AnchorProvider(
    connection,
    new anchor.Wallet(deployer),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const programId = new PublicKey(idl.metadata.address);
  const program   = new Program(idl, programId, provider) as any;

  console.log(`Program ID: ${programId.toBase58()}`);

  // Derive PDAs
  const [registryPda]  = PublicKey.findProgramAddressSync([Buffer.from("registry")], programId);
  const [ledgerPda]    = PublicKey.findProgramAddressSync([Buffer.from("ledger")],   programId);
  const gbtMintKp      = Keypair.generate();

  // Initialize Registry
  console.log("Initializing CreditRegistry…");
  const txReg = await program.methods
    .initializeRegistry(oraclePubkey)
    .accounts({
      registry:      registryPda,
      gbtMint:       gbtMintKp.publicKey,
      payer:         deployer.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram:  TOKEN_PROGRAM_ID,
      rent:          SYSVAR_RENT_PUBKEY,
    })
    .signers([deployer, gbtMintKp])
    .rpc();
  console.log(`Registry init tx: ${txReg}`);

  // Initialize Retirement Ledger
  console.log("Initializing RetirementLedger…");
  const txLed = await program.methods
    .initializeLedger()
    .accounts({
      ledger:        ledgerPda,
      gbtMint:       gbtMintKp.publicKey,
      payer:         deployer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([deployer])
    .rpc();
  console.log(`Ledger init tx: ${txLed}`);

  // Save deployment manifest
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {
    network:         "devnet",
    rpc:             DEVNET_RPC,
    deployed_at:     new Date().toISOString(),
    program_id:      programId.toBase58(),
    gbt_mint:        gbtMintKp.publicKey.toBase58(),
    registry_pda:    registryPda.toBase58(),
    ledger_pda:      ledgerPda.toBase58(),
    oracle_pubkey:   oraclePubHex,
    deployer:        deployer.publicKey.toBase58(),
  };

  const outPath = path.join(OUT_DIR, "devnet.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`\nDeployment saved to ${outPath}`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
