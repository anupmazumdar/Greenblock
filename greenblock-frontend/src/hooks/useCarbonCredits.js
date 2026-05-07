import { useState, useEffect, useCallback } from 'react'
import {
  CONTRACT_ADDRESSES,
  GREEN_TOKEN_ABI,
  CREDIT_REGISTRY_ABI,
  MARKETPLACE_ABI,
  RETIREMENT_LEDGER_ABI,
} from '../utils/contractABI'

async function getContract(address, abi, signer) {
  const { Contract } = await import('ethers')
  return new Contract(address, abi, signer)
}

async function getReadContract(address, abi, provider) {
  const { Contract } = await import('ethers')
  return new Contract(address, abi, provider)
}

export function useCarbonCredits(signer, provider, account) {
  const [gbtBalance, setGbtBalance] = useState(null)
  const [buildingInfo, setBuildingInfo] = useState(null)
  const [listings, setListings] = useState([])
  const [myCertificates, setMyCertificates] = useState([])
  const [totalRetired, setTotalRetired] = useState(null)
  const [loading, setLoading] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [error, setError] = useState(null)

  const contractsDeployed = Boolean(
    CONTRACT_ADDRESSES.GreenToken &&
    CONTRACT_ADDRESSES.CreditRegistry &&
    CONTRACT_ADDRESSES.Marketplace &&
    CONTRACT_ADDRESSES.RetirementLedger
  )

  const formatGbt = useCallback(async (wei) => {
    const { formatEther } = await import('ethers')
    return parseFloat(formatEther(wei)).toFixed(3)
  }, [])

  // ─── Read: GBT balance ──────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!provider || !account || !contractsDeployed) return
    try {
      const token = await getReadContract(CONTRACT_ADDRESSES.GreenToken, GREEN_TOKEN_ABI, provider)
      const raw = await token.balanceOf(account)
      setGbtBalance(await formatGbt(raw))
    } catch { /* ignore when contract not deployed */ }
  }, [provider, account, contractsDeployed, formatGbt])

  // ─── Read: Building registration info ──────────────────────────────────
  const fetchBuildingInfo = useCallback(async () => {
    if (!provider || !account || !contractsDeployed) return
    try {
      const registry = await getReadContract(CONTRACT_ADDRESSES.CreditRegistry, CREDIT_REGISTRY_ABI, provider)
      const [building] = await registry.getBuildingStats(account)
      if (building.active) {
        setBuildingInfo({
          buildingId: building.buildingId,
          location: building.location,
          baselineKwhMonth: building.baselineKwhMonth.toString(),
          registeredAt: new Date(Number(building.registeredAt) * 1000).toLocaleDateString('en-IN'),
        })
      } else {
        setBuildingInfo(null)
      }
    } catch { /* not registered yet */ }
  }, [provider, account, contractsDeployed])

  // ─── Read: Active marketplace listings ─────────────────────────────────
  const fetchListings = useCallback(async () => {
    if (!provider || !contractsDeployed) return
    try {
      const market = await getReadContract(CONTRACT_ADDRESSES.Marketplace, MARKETPLACE_ABI, provider)
      const [results] = await market.getActiveListings(0, 20)
      const { formatEther, formatUnits } = await import('ethers')
      setListings(results.map(l => ({
        id: l.id.toString(),
        seller: l.seller,
        amountGbt: parseFloat(formatEther(l.amountGbt)).toFixed(3),
        amountRemaining: parseFloat(formatEther(l.amountRemaining)).toFixed(3),
        pricePerGbt: parseFloat(formatUnits(l.pricePerGbt, 'ether')).toFixed(6),
        listedAt: new Date(Number(l.listedAt) * 1000).toLocaleDateString('en-IN'),
      })))
    } catch { /* ignore */ }
  }, [provider, contractsDeployed])

  // ─── Read: My retirement certificates ──────────────────────────────────
  const fetchCertificates = useCallback(async () => {
    if (!provider || !account || !contractsDeployed) return
    try {
      const ledger = await getReadContract(CONTRACT_ADDRESSES.RetirementLedger, RETIREMENT_LEDGER_ABI, provider)
      const ids = await ledger.getMyCertificates(account)
      const certs = await Promise.all(
        ids.map(async (id) => {
          const c = await ledger.getCertificate(id)
          return {
            id: id.toString(),
            kgCo2: c.kgCo2.toString(),
            buildingId: c.buildingId,
            beneficiary: c.beneficiary,
            timestamp: new Date(Number(c.timestamp) * 1000).toLocaleDateString('en-IN'),
            ipfsUri: c.ipfsMetadataUri,
          }
        })
      )
      setMyCertificates(certs)
    } catch { /* ignore */ }
  }, [provider, account, contractsDeployed])

  // ─── Read: Total CO₂ retired globally ──────────────────────────────────
  const fetchTotalRetired = useCallback(async () => {
    if (!provider || !contractsDeployed) return
    try {
      const token = await getReadContract(CONTRACT_ADDRESSES.GreenToken, GREEN_TOKEN_ABI, provider)
      const kg = await token.totalRetiredKg()
      setTotalRetired(kg.toString())
    } catch { /* ignore */ }
  }, [provider, contractsDeployed])

  // ─── Write: Register building ───────────────────────────────────────────
  const registerBuilding = useCallback(async (buildingId, location, baselineKwh) => {
    if (!signer || !contractsDeployed) throw new Error('Wallet not connected or contracts not deployed')
    setTxPending(true)
    setError(null)
    try {
      const registry = await getContract(CONTRACT_ADDRESSES.CreditRegistry, CREDIT_REGISTRY_ABI, signer)
      const tx = await registry.registerBuilding(buildingId, location, baselineKwh)
      await tx.wait()
      await fetchBuildingInfo()
      return tx.hash
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [signer, contractsDeployed, fetchBuildingInfo])

  // ─── Write: Claim credits (oracle-signed) ──────────────────────────────
  const claimCredits = useCallback(async (kwhSaved, nonce, signature) => {
    if (!signer || !contractsDeployed) throw new Error('Wallet not connected or contracts not deployed')
    setTxPending(true)
    setError(null)
    try {
      const registry = await getContract(CONTRACT_ADDRESSES.CreditRegistry, CREDIT_REGISTRY_ABI, signer)
      const tx = await registry.claimCredits(kwhSaved, nonce, signature)
      await tx.wait()
      await fetchBalance()
      return tx.hash
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [signer, contractsDeployed, fetchBalance])

  // ─── Write: List credits for sale ──────────────────────────────────────
  const listCredits = useCallback(async (amountGbt, pricePerGbt) => {
    if (!signer || !contractsDeployed) throw new Error('Wallet not connected')
    setTxPending(true)
    setError(null)
    try {
      const { parseEther } = await import('ethers')
      const token = await getContract(CONTRACT_ADDRESSES.GreenToken, GREEN_TOKEN_ABI, signer)
      const market = await getContract(CONTRACT_ADDRESSES.Marketplace, MARKETPLACE_ABI, signer)

      const amtWei = parseEther(String(amountGbt))
      const priceWei = parseEther(String(pricePerGbt))

      const approveTx = await token.approve(CONTRACT_ADDRESSES.Marketplace, amtWei)
      await approveTx.wait()

      const listTx = await market.listCredits(amtWei, priceWei)
      await listTx.wait()
      await fetchListings()
      await fetchBalance()
      return listTx.hash
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [signer, contractsDeployed, fetchListings, fetchBalance])

  // ─── Write: Buy credits ─────────────────────────────────────────────────
  const buyCredits = useCallback(async (listingId, amountGbt, totalMaticEther) => {
    if (!signer || !contractsDeployed) throw new Error('Wallet not connected')
    setTxPending(true)
    setError(null)
    try {
      const { parseEther } = await import('ethers')
      const market = await getContract(CONTRACT_ADDRESSES.Marketplace, MARKETPLACE_ABI, signer)
      const amtWei = parseEther(String(amountGbt))
      const tx = await market.buyCredits(listingId, amtWei, { value: parseEther(String(totalMaticEther)) })
      await tx.wait()
      await fetchListings()
      await fetchBalance()
      return tx.hash
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [signer, contractsDeployed, fetchListings, fetchBalance])

  // ─── Write: Retire and certify ──────────────────────────────────────────
  const retireAndCertify = useCallback(async (amountGbt, buildingId, beneficiary, metadataUri) => {
    if (!signer || !contractsDeployed) throw new Error('Wallet not connected')
    setTxPending(true)
    setError(null)
    try {
      const { parseEther } = await import('ethers')
      const token = await getContract(CONTRACT_ADDRESSES.GreenToken, GREEN_TOKEN_ABI, signer)
      const ledger = await getContract(CONTRACT_ADDRESSES.RetirementLedger, RETIREMENT_LEDGER_ABI, signer)

      const amtWei = parseEther(String(amountGbt))
      const approveTx = await token.approve(CONTRACT_ADDRESSES.RetirementLedger, amtWei)
      await approveTx.wait()

      const tx = await ledger.retireAndCertify(amtWei, buildingId, beneficiary, metadataUri || '')
      const receipt = await tx.wait()
      await fetchBalance()
      await fetchCertificates()
      await fetchTotalRetired()
      return { txHash: tx.hash, receipt }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setTxPending(false)
    }
  }, [signer, contractsDeployed, fetchBalance, fetchCertificates, fetchTotalRetired])

  // ─── Auto-refresh on connect ────────────────────────────────────────────
  useEffect(() => {
    if (!account || !provider) return
    setLoading(true)
    Promise.all([
      fetchBalance(),
      fetchBuildingInfo(),
      fetchListings(),
      fetchCertificates(),
      fetchTotalRetired(),
    ]).finally(() => setLoading(false))
  }, [account, provider, fetchBalance, fetchBuildingInfo, fetchListings, fetchCertificates, fetchTotalRetired])

  return {
    gbtBalance,
    buildingInfo,
    listings,
    myCertificates,
    totalRetired,
    loading,
    txPending,
    error,
    contractsDeployed,
    registerBuilding,
    claimCredits,
    listCredits,
    buyCredits,
    retireAndCertify,
    refresh: () => Promise.all([fetchBalance(), fetchBuildingInfo(), fetchListings(), fetchCertificates(), fetchTotalRetired()]),
  }
}
