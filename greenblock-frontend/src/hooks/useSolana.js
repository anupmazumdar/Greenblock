import { useState, useCallback } from 'react'
import { signCreditClaim } from '../utils/api'

const SOLANA_RPC   = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const PROGRAM_ID   = import.meta.env.VITE_SOLANA_CREDIT_REGISTRY_PROGRAM_ID || ''
const GBT_MINT_STR = import.meta.env.VITE_SOLANA_GBT_MINT || ''

function encodeU64LE(value) {
  const buf = new ArrayBuffer(8)
  new DataView(buf).setBigUint64(0, BigInt(value), true)
  return new Uint8Array(buf)
}

async function anchorDiscriminator(ixName) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`global:${ixName}`))
  return new Uint8Array(hash).slice(0, 8)
}

export function useSolana() {
  const [account, setAccount] = useState(null)
  const [gbtBalance, setGbtBalance] = useState(null)
  const [solBalance, setSolBalance] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [error, setError] = useState(null)

  const isPhantomAvailable = typeof window !== 'undefined' && Boolean(window.solana?.isPhantom)
  const contractsDeployed  = Boolean(PROGRAM_ID && GBT_MINT_STR)

  const fetchBalance = useCallback(async (pubkeyStr) => {
    if (!pubkeyStr) return
    try {
      const { Connection, PublicKey } = await import('@solana/web3.js')
      const conn = new Connection(SOLANA_RPC, 'confirmed')
      const pk   = new PublicKey(pubkeyStr)
      const lamports = await conn.getBalance(pk)
      setSolBalance((lamports / 1e9).toFixed(4))

      if (GBT_MINT_STR) {
        const mint = new PublicKey(GBT_MINT_STR)
        const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pk, { mint })
        const amount = tokenAccounts.value[0]
          ?.account.data.parsed.info.tokenAmount.uiAmountString ?? '0'
        setGbtBalance(amount)
      }
    } catch { /* RPC may be unavailable */ }
  }, [])

  const connect = useCallback(async () => {
    if (!isPhantomAvailable) {
      setError('Phantom wallet not found. Install the Phantom browser extension.')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const resp = await window.solana.connect()
      const addr = resp.publicKey.toString()
      setAccount(addr)
      await fetchBalance(addr)
    } catch (err) {
      if (err.code !== 4001) setError(err.message || 'Failed to connect Phantom')
    } finally {
      setConnecting(false)
    }
  }, [isPhantomAvailable, fetchBalance])

  const disconnect = useCallback(async () => {
    try { await window.solana?.disconnect() } catch { /* ignore */ }
    setAccount(null)
    setGbtBalance(null)
    setSolBalance(null)
    setError(null)
  }, [])

  const claimCredits = useCallback(async (kwhSaved) => {
    if (!account || !contractsDeployed) throw new Error('Wallet not connected or contracts not deployed')
    setTxPending(true)
    setError(null)
    try {
      const { data } = await signCreditClaim({ address: account, kwh_saved: kwhSaved, chain: 'solana' })

      const { Connection, PublicKey, Transaction, Ed25519Program, TransactionInstruction, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram } = await import('@solana/web3.js')
      const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } = await import('@solana/spl-token')
      const conn = new Connection(SOLANA_RPC, 'confirmed')

      const ownerPk     = new PublicKey(account)
      const programPk   = new PublicKey(PROGRAM_ID)
      const mintPk      = new PublicKey(GBT_MINT_STR)
      const oraclePk    = new PublicKey(data.oracle_address)

      // Message the oracle signed: b"greenblock" + owner_bytes(32) + kwh_bytes(8 BE) + nonce_bytes(8 BE)
      const kwhBE   = new ArrayBuffer(8)
      const nonceBE = new ArrayBuffer(8)
      new DataView(kwhBE).setBigUint64(0, BigInt(kwhSaved), false)
      new DataView(nonceBE).setBigUint64(0, BigInt(data.nonce), false)

      const message = new Uint8Array([
        ...new TextEncoder().encode('greenblock'),
        ...ownerPk.toBytes(),
        ...new Uint8Array(kwhBE),
        ...new Uint8Array(nonceBE),
      ])

      const sigBytes = Uint8Array.from(
        data.oracle_signature.match(/.{1,2}/g).map(b => parseInt(b, 16))
      )

      // Ed25519 verification instruction (must be first)
      const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
        publicKey: oraclePk.toBytes(),
        message,
        signature: sigBytes,
      })

      // Derive PDAs
      const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from('registry')], programPk)
      const [buildingPda] = PublicKey.findProgramAddressSync([Buffer.from('building'), ownerPk.toBytes()], programPk)
      const buildingTokenAcc = getAssociatedTokenAddressSync(mintPk, ownerPk)

      // Anchor instruction: claim_credits(kwh_saved: u64, nonce: u64)
      const discriminator = await anchorDiscriminator('claim_credits')
      const ixData = new Uint8Array([
        ...discriminator,
        ...encodeU64LE(kwhSaved),
        ...encodeU64LE(data.nonce),
      ])

      const claimIx = new TransactionInstruction({
        programId: programPk,
        keys: [
          { pubkey: buildingPda,            isSigner: false, isWritable: false },
          { pubkey: registryPda,            isSigner: false, isWritable: true  },
          { pubkey: mintPk,                 isSigner: false, isWritable: true  },
          { pubkey: buildingTokenAcc,       isSigner: false, isWritable: true  },
          { pubkey: ownerPk,                isSigner: true,  isWritable: true  },
          { pubkey: TOKEN_PROGRAM_ID,       isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(ixData),
      })

      const { blockhash } = await conn.getLatestBlockhash()
      const tx = new Transaction({ feePayer: ownerPk, recentBlockhash: blockhash })
      tx.add(ed25519Ix, claimIx)

      const signed = await window.solana.signTransaction(tx)
      const txId   = await conn.sendRawTransaction(signed.serialize())
      await conn.confirmTransaction(txId, 'confirmed')
      await fetchBalance(account)
      return txId
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [account, contractsDeployed, fetchBalance])

  return {
    account,
    gbtBalance,
    solBalance,
    connecting,
    txPending,
    error,
    isPhantomAvailable,
    contractsDeployed,
    connect,
    disconnect,
    claimCredits,
    refresh: () => fetchBalance(account),
  }
}
