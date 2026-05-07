import { useState } from 'react'

const S = {
  card: { background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '10px', padding: '20px' },
  label: { fontSize: '10px', letterSpacing: '0.14em', color: '#6b7e6b', textTransform: 'uppercase', marginBottom: '4px' },
  value: { fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', color: '#4ade80' },
  btn: (color = '#4ade80') => ({
    background: 'transparent', border: `1px solid ${color}`, color, borderRadius: '6px',
    padding: '8px 16px', fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer',
    fontFamily: 'monospace', textTransform: 'uppercase',
  }),
  btnSolid: (color = '#4ade80') => ({
    background: color, border: 'none', color: '#050f05', borderRadius: '6px',
    padding: '8px 16px', fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer',
    fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase',
  }),
  input: {
    background: '#0a0f0a', border: '1px solid #1e2e1e', color: '#c8d8c8', borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', fontFamily: 'monospace',
  },
  row: { display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' },
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color, borderRadius: '4px',
    padding: '2px 8px', fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'monospace',
  }),
}

export default function CarbonWallet({
  web3,
  credits,
  onEstimate,
  estimate,
  estimateLoading,
}) {
  const { account, chainId, networkName, isCorrectNetwork, maticBalance, connecting, connect, disconnect, switchToPolygon, isMetaMaskAvailable } = web3
  const { gbtBalance, buildingInfo, txPending, registerBuilding, claimCredits, retireAndCertify, myCertificates } = credits

  const [regForm, setRegForm] = useState({ buildingId: '', location: '', baseline: '' })
  const [claimForm, setClaimForm] = useState({ kwhSaved: '' })
  const [retireForm, setRetireForm] = useState({ amount: '', beneficiary: '' })
  const [activePanel, setActivePanel] = useState(null)
  const [txHash, setTxHash] = useState(null)

  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null

  async function handleRegister(e) {
    e.preventDefault()
    const hash = await registerBuilding(regForm.buildingId, regForm.location, parseInt(regForm.baseline))
    setTxHash(hash)
    setActivePanel(null)
  }

  async function handleClaim(e) {
    e.preventDefault()
    const kwhSaved = parseInt(claimForm.kwhSaved)
    if (!kwhSaved) return
    // Fetch oracle signature from backend
    let sig = null, nonce = null
    try {
      const res = await fetch('/api/blockchain/sign-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: account, kwh_saved: kwhSaved, building_id: buildingInfo?.buildingId || 'DEMO' }),
      })
      const data = await res.json()
      sig = data.signature
      nonce = data.nonce
    } catch { /* backend not reachable */ }
    if (!sig) {
      alert('Oracle signing not available. Set ORACLE_PRIVATE_KEY in backend .env')
      return
    }
    const hash = await claimCredits(kwhSaved, nonce, sig)
    setTxHash(hash)
    setActivePanel(null)
  }

  async function handleRetire(e) {
    e.preventDefault()
    const hash = await retireAndCertify(
      parseFloat(retireForm.amount),
      buildingInfo?.buildingId || 'GREENBLOCK_B01',
      retireForm.beneficiary,
      ''
    )
    setTxHash(hash.txHash)
    setActivePanel(null)
  }

  if (!isMetaMaskAvailable) {
    return (
      <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🦊</div>
        <div style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: '13px', marginBottom: '8px' }}>MetaMask Not Detected</div>
        <div style={{ color: '#6b7e6b', fontSize: '12px', maxWidth: '320px', margin: '0 auto' }}>
          Install the MetaMask browser extension to connect your wallet and interact with GreenBlock carbon credit contracts on Polygon.
        </div>
        <a href="https://metamask.io" target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', marginTop: '16px', ...S.btn('#f59e0b') }}>
          Install MetaMask
        </a>
      </div>
    )
  }

  if (!account) {
    return (
      <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔗</div>
        <div style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
          Connect Wallet
        </div>
        <div style={{ color: '#6b7e6b', fontSize: '12px', marginBottom: '20px' }}>
          Connect MetaMask to earn, trade, and retire GBT carbon credits on Polygon.
        </div>
        <button style={S.btnSolid('#4ade80')} onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Wallet Header */}
      <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={S.label}>Connected Wallet</div>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#c8d8c8' }}>{shortAddr}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <span style={S.badge(isCorrectNetwork ? '#4ade80' : '#f97316')}>
              {networkName || 'Unknown Network'}
            </span>
            {maticBalance && <span style={S.badge('#22d3ee')}>{maticBalance} POL</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isCorrectNetwork && (
            <button style={S.btn('#f59e0b')} onClick={() => switchToPolygon(false)}>
              Switch to Amoy
            </button>
          )}
          <button style={S.btn('#6b7e6b')} onClick={disconnect}>Disconnect</button>
        </div>
      </div>

      {/* GBT Balance + Building Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={S.card}>
          <div style={S.label}>GBT Balance</div>
          <div style={S.value}>{gbtBalance ?? '—'}</div>
          <div style={{ fontSize: '10px', color: '#6b7e6b', marginTop: '4px' }}>GreenBlock Tokens</div>
          <div style={{ fontSize: '10px', color: '#6b7e6b' }}>1 GBT = 1 kg CO₂ avoided</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>CO₂ Avoided</div>
          <div style={{ ...S.value, color: '#22d3ee' }}>{gbtBalance ?? '—'} kg</div>
          <div style={{ fontSize: '10px', color: '#6b7e6b', marginTop: '4px' }}>
            ≈ {gbtBalance ? (gbtBalance / 1000).toFixed(4) : '—'} CCC equivalent
          </div>
          <div style={{ fontSize: '10px', color: '#6b7e6b' }}>India CCTS 2023 standard</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Building</div>
          {buildingInfo ? (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#c8d8c8', fontWeight: 700 }}>
                {buildingInfo.buildingId}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7e6b', marginTop: '4px' }}>{buildingInfo.location}</div>
              <div style={{ fontSize: '10px', color: '#6b7e6b' }}>Baseline: {buildingInfo.baselineKwhMonth} kWh/mo</div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#6b7e6b', marginTop: '8px' }}>Not registered</div>
          )}
        </div>
        <div style={S.card}>
          <div style={S.label}>Certificates</div>
          <div style={{ ...S.value, color: '#f59e0b' }}>{myCertificates.length}</div>
          <div style={{ fontSize: '10px', color: '#6b7e6b', marginTop: '4px' }}>NFT retirement certs</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={S.card}>
        <div style={S.label}>Actions</div>
        <div style={{ ...S.row, marginTop: '12px' }}>
          {!buildingInfo && (
            <button style={S.btnSolid('#4ade80')} onClick={() => setActivePanel(p => p === 'register' ? null : 'register')}>
              Register Building
            </button>
          )}
          {buildingInfo && (
            <button style={S.btnSolid('#22d3ee')} onClick={() => setActivePanel(p => p === 'claim' ? null : 'claim')} disabled={txPending}>
              Claim Credits
            </button>
          )}
          {gbtBalance > 0 && (
            <button style={S.btnSolid('#f59e0b')} onClick={() => setActivePanel(p => p === 'retire' ? null : 'retire')} disabled={txPending}>
              Retire & Certify
            </button>
          )}
          {txPending && <span style={{ color: '#6b7e6b', fontSize: '11px', fontFamily: 'monospace' }}>Transaction pending...</span>}
        </div>

        {/* Register Form */}
        {activePanel === 'register' && (
          <form onSubmit={handleRegister} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <div style={S.label}>Building ID</div>
            <input style={S.input} placeholder="e.g. GREENBLOCK_B01" value={regForm.buildingId}
              onChange={e => setRegForm(f => ({ ...f, buildingId: e.target.value }))} required />
            <div style={S.label}>Location</div>
            <input style={S.input} placeholder="e.g. Dhanbad, Jharkhand" value={regForm.location}
              onChange={e => setRegForm(f => ({ ...f, location: e.target.value }))} required />
            <div style={S.label}>Baseline kWh/Month</div>
            <input style={S.input} type="number" placeholder="e.g. 1200" value={regForm.baseline}
              onChange={e => setRegForm(f => ({ ...f, baseline: e.target.value }))} required />
            <button type="submit" style={S.btnSolid('#4ade80')}>Register on Polygon</button>
          </form>
        )}

        {/* Claim Credits Form */}
        {activePanel === 'claim' && (
          <form onSubmit={handleClaim} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <div style={S.label}>kWh Saved This Period</div>
            <input style={S.input} type="number" placeholder="e.g. 462" value={claimForm.kwhSaved}
              onChange={e => setClaimForm({ kwhSaved: e.target.value })} required />
            {claimForm.kwhSaved && (
              <div style={{ ...S.badge('#22d3ee'), display: 'inline-block', fontSize: '11px' }}>
                ≈ {(parseFloat(claimForm.kwhSaved) * 0.82).toFixed(2)} GBT will be minted
              </div>
            )}
            <button type="submit" style={S.btnSolid('#22d3ee')}>Sign & Claim via Oracle</button>
          </form>
        )}

        {/* Retire Form */}
        {activePanel === 'retire' && (
          <form onSubmit={handleRetire} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <div style={S.label}>GBT to Retire (kg CO₂)</div>
            <input style={S.input} type="number" step="0.001" placeholder={`Max: ${gbtBalance}`}
              value={retireForm.amount} onChange={e => setRetireForm(f => ({ ...f, amount: e.target.value }))} required />
            <div style={S.label}>Beneficiary (CSR / Organisation)</div>
            <input style={S.input} placeholder="e.g. ABC Corp CSR 2024-25" value={retireForm.beneficiary}
              onChange={e => setRetireForm(f => ({ ...f, beneficiary: e.target.value }))} required />
            <button type="submit" style={S.btnSolid('#f59e0b')}>Retire & Mint NFT Certificate</button>
          </form>
        )}
      </div>

      {/* TX Hash */}
      {txHash && (
        <div style={{ ...S.card, borderColor: '#4ade8044' }}>
          <div style={S.label}>Transaction Confirmed</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4ade80', wordBreak: 'break-all' }}>
            {txHash}
          </div>
          <a
            href={`https://amoy.polygonscan.com/tx/${txHash}`}
            target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', marginTop: '8px', ...S.btn('#4ade80'), fontSize: '10px' }}
          >
            View on Polygonscan
          </a>
        </div>
      )}

      {/* My Certificates */}
      {myCertificates.length > 0 && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: '12px' }}>My Retirement Certificates (NFTs)</div>
          {myCertificates.map(cert => (
            <div key={cert.id} style={{ background: '#0a0f0a', borderRadius: '6px', padding: '12px', marginBottom: '8px', borderLeft: '3px solid #f59e0b' }}>
              <div style={S.row}>
                <span style={S.badge('#f59e0b')}>CERT #{cert.id}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c8d8c8' }}>{cert.kgCo2} kg CO₂</span>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7e6b', marginTop: '6px' }}>
                {cert.buildingId} · {cert.beneficiary} · {cert.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
