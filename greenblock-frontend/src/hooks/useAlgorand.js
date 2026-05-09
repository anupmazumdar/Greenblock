import { useState, useEffect, useRef, useCallback } from 'react'
import { signCreditClaim } from '../utils/api'

const ALGOD_SERVER = import.meta.env.VITE_ALGORAND_NODE_URL || 'https://testnet-api.algonode.cloud'

function getAlgoAppIds() {
  return {
    creditRegistry: Number(import.meta.env.VITE_ALGORAND_CREDIT_REGISTRY_APP_ID) || 0,
    marketplace:    Number(import.meta.env.VITE_ALGORAND_MARKETPLACE_APP_ID)    || 0,
    retirementLedger: Number(import.meta.env.VITE_ALGORAND_RETIREMENT_LEDGER_APP_ID) || 0,
    gbtAssetId:     Number(import.meta.env.VITE_ALGORAND_GBT_ASSET_ID)          || 0,
  }
}

export function useAlgorand() {
  const [account, setAccount] = useState(null)
  const [gbtBalance, setGbtBalance] = useState(null)
  const [algoBalance, setAlgoBalance] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [error, setError] = useState(null)
  const peraRef = useRef(null)

  const appIds = getAlgoAppIds()
  const contractsDeployed = Boolean(appIds.creditRegistry && appIds.gbtAssetId)

  const fetchBalance = useCallback(async (addr) => {
    if (!addr) return
    try {
      const { Algodv2 } = await import('algosdk')
      const client = new Algodv2('', ALGOD_SERVER, '')
      const info = await client.accountInformation(addr).do()
      setAlgoBalance((info.amount / 1e6).toFixed(4))
      if (appIds.gbtAssetId) {
        const holding = info.assets?.find(a => a['asset-id'] === appIds.gbtAssetId)
        setGbtBalance(holding ? (holding.amount / 1e6).toFixed(3) : '0.000')
      }
    } catch { /* node may be unavailable */ }
  }, [appIds.gbtAssetId])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const { PeraWalletConnect } = await import('@perawallet/connect')
      if (!peraRef.current) {
        peraRef.current = new PeraWalletConnect()
      }
      const accounts = await peraRef.current.connect()
      if (accounts.length > 0) {
        setAccount(accounts[0])
        await fetchBalance(accounts[0])
      }
    } catch (err) {
      if (err?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        setError(err.message || 'Failed to connect Pera Wallet')
      }
    } finally {
      setConnecting(false)
    }
  }, [fetchBalance])

  const disconnect = useCallback(async () => {
    try {
      await peraRef.current?.disconnect()
    } catch { /* ignore */ }
    setAccount(null)
    setGbtBalance(null)
    setAlgoBalance(null)
    setError(null)
  }, [])

  const claimCredits = useCallback(async (kwhSaved) => {
    if (!account || !contractsDeployed) throw new Error('Wallet not connected or contracts not deployed')
    setTxPending(true)
    setError(null)
    try {
      const { data } = await signCreditClaim({ address: account, kwh_saved: kwhSaved, chain: 'algorand' })

      const { Algodv2, makeApplicationNoOpTxnFromObject, ABIMethod, ABIType, waitForConfirmation, decodeAddress } = await import('algosdk')
      const client = new Algodv2('', ALGOD_SERVER, '')
      const params = await client.getTransactionParams().do()

      const sigBytes  = Uint8Array.from(atob(data.oracle_signature).split('').map(c => c.charCodeAt(0)))
      const pkBytes   = decodeAddress(data.oracle_address).publicKey
      const byteArrType = ABIType.from('byte[]')
      const uint64Type  = ABIType.from('uint64')
      const selector    = ABIMethod.fromSignature(
        'claim_credits(byte[],byte[],uint64,uint64,uint64)void'
      ).getSelector()

      const txn = makeApplicationNoOpTxnFromObject({
        from:          account,
        appIndex:      appIds.creditRegistry,
        appArgs: [
          selector,
          byteArrType.encode(sigBytes),
          byteArrType.encode(pkBytes),
          uint64Type.encode(BigInt(kwhSaved)),
          uint64Type.encode(BigInt(data.nonce)),
          uint64Type.encode(BigInt(data.gbt_amount)),
        ],
        foreignAssets:  [appIds.gbtAssetId],
        suggestedParams: params,
      })

      const signedTxns = await peraRef.current.signTransaction([[{ txn, signers: [account] }]])
      const { txId }   = await client.sendRawTransaction(signedTxns).do()
      await waitForConfirmation(client, txId, 4)
      await fetchBalance(account)
      return txId
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [account, contractsDeployed, appIds, fetchBalance])

  // Restore session on mount
  useEffect(() => {
    async function tryReconnect() {
      try {
        const { PeraWalletConnect } = await import('@perawallet/connect')
        if (!peraRef.current) peraRef.current = new PeraWalletConnect()
        const accounts = await peraRef.current.reconnectSession()
        if (accounts?.length > 0) {
          setAccount(accounts[0])
          fetchBalance(accounts[0])
        }
      } catch { /* no prior session */ }
    }
    tryReconnect()
  }, [fetchBalance])

  return {
    account,
    gbtBalance,
    algoBalance,
    connecting,
    txPending,
    error,
    contractsDeployed,
    connect,
    disconnect,
    claimCredits,
    refresh: () => fetchBalance(account),
  }
}
