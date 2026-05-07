import { useState, useEffect, useCallback } from 'react'
import { SUPPORTED_CHAIN_IDS } from '../utils/contractABI'

const POLYGON_AMOY = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
}

const POLYGON_MAINNET = {
  chainId: '0x89', // 137 in hex
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
}

export function useWeb3() {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [maticBalance, setMaticBalance] = useState(null)

  const isMetaMaskAvailable = typeof window !== 'undefined' && Boolean(window.ethereum)

  const networkName = chainId ? (SUPPORTED_CHAIN_IDS[chainId] || `Chain ${chainId}`) : null
  const isCorrectNetwork = chainId === 80002 || chainId === 137 || chainId === 31337

  async function _initEthers(ethereum) {
    const { BrowserProvider } = await import('ethers')
    const p = new BrowserProvider(ethereum)
    const s = await p.getSigner()
    return { provider: p, signer: s }
  }

  const refreshBalance = useCallback(async (p, addr) => {
    if (!p || !addr) return
    try {
      const { formatEther } = await import('ethers')
      const bal = await p.getBalance(addr)
      setMaticBalance(parseFloat(formatEther(bal)).toFixed(4))
    } catch { /* ignore */ }
  }, [])

  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable) {
      setError('MetaMask not detected. Install MetaMask to use blockchain features.')
      return
    }
    setError(null)
    setConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const chainHex = await window.ethereum.request({ method: 'eth_chainId' })
      const id = parseInt(chainHex, 16)

      const { provider: p, signer: s } = await _initEthers(window.ethereum)

      setAccount(accounts[0])
      setChainId(id)
      setProvider(p)
      setSigner(s)
      await refreshBalance(p, accounts[0])
    } catch (err) {
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }, [isMetaMaskAvailable, refreshBalance])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setMaticBalance(null)
    setError(null)
  }, [])

  const switchToPolygon = useCallback(async (mainnet = false) => {
    if (!isMetaMaskAvailable) return
    const target = mainnet ? POLYGON_MAINNET : POLYGON_AMOY
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: target.chainId }],
      })
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [target],
        })
      } else {
        setError(switchErr.message)
      }
    }
  }, [isMetaMaskAvailable])

  // Listen for account / chain changes
  useEffect(() => {
    if (!isMetaMaskAvailable) return

    const onAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
        if (provider) await refreshBalance(provider, accounts[0])
      }
    }

    const onChainChanged = async (chainHex) => {
      const id = parseInt(chainHex, 16)
      setChainId(id)
      if (account) {
        const { provider: p, signer: s } = await _initEthers(window.ethereum)
        setProvider(p)
        setSigner(s)
        await refreshBalance(p, account)
      }
    }

    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged', onChainChanged)
    }
  }, [isMetaMaskAvailable, account, provider, disconnect, refreshBalance])

  return {
    account,
    chainId,
    networkName,
    isCorrectNetwork,
    provider,
    signer,
    maticBalance,
    connecting,
    error,
    isMetaMaskAvailable,
    connect,
    disconnect,
    switchToPolygon,
  }
}
