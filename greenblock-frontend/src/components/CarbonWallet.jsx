import { useState } from 'react'

const S = {
  card: {
    background: 'var(--card, #0C1C0E)',
    border: '1px solid var(--wire, rgba(0,255,140,0.1))',
    borderRadius: '10px',
    padding: '20px',
  },
  label: {
    fontSize: '10px', letterSpacing: '0.14em',
    color: 'var(--text-dim, rgba(220,242,225,0.38))',
    textTransform: 'uppercase', marginBottom: '4px',
  },
  value: {
    fontSize: '22px', fontWeight: 700,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--phosphor, #00FF8C)',
  },
  btn: (color = 'var(--phosphor, #00FF8C)') => ({
    background: 'transparent', border: `1px solid ${color}`, color,
    borderRadius: '6px', padding: '8px 16px', fontSize: '11px',
    letterSpacing: '0.1em', cursor: 'pointer',
    fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase',
  }),
  btnSolid: (color = 'var(--phosphor, #00FF8C)') => ({
    background: color, border: 'none', color: 'var(--void, #020705)',
    borderRadius: '6px', padding: '8px 16px', fontSize: '11px',
    letterSpacing: '0.1em', cursor: 'pointer',
    fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, textTransform: 'uppercase',
  }),
  input: {
    background: 'var(--deep, #050D07)',
    border: '1px solid var(--wire, rgba(0,255,140,0.1))',
    color: 'var(--text-mid, rgba(220,242,225,0.65))',
    borderRadius: '6px', padding: '8px 12px', fontSize: '13px',
    width: '100%', boxSizing: 'border-box',
    fontFamily: 'var(--font-mono, monospace)',
  },
  row: { display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' },
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color,
    borderRadius: '4px', padding: '2px 8px', fontSize: '10px',
    letterSpacing: '0.1em', fontFamily: 'var(--font-mono, monospace)',
  }),
}

const TX_LABELS = { register: 'Registering Building', claim: 'Claiming Credits', retire: 'Retiring & Minting NFT' }

export default function CarbonWallet({ web3, credits, onEstimate, estimate, estimateLoading }) {
  const { account, chainId, networkName, isCorrectNetwork, maticBalance, connecting, connect, disconnect, switchToPolygon, isMetaMaskAvailable } = web3
  const { gbtBalance, buildingInfo, txPending, registerBuilding, claimCredits, retireAndCertify, myCertificates } = credits

  const [regForm, setRegForm] = useState({ buildingId: '', location: '', baseline: '' })
  const [claimForm, setClaimForm] = useState({ kwhSaved: '' })
  const [retireForm, setRetireForm] = useState({ amount: '', beneficiary: '' })
  const [activePanel, setActivePanel] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)
  const [activeTxAction, setActiveTxAction] = useState(null)

  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null

  async function handleRegister(e) {
    e.preventDefault()
    setTxError(null)
    setActiveTxAction('register')
    try {
      const hash = await registerBuilding(regForm.buildingId, regForm.location, parseInt(regForm.baseline))
      setTxHash(hash)
      setActivePanel(null)
    } catch (err) {
      setTxError(err?.message || 'Transaction failed')
    } finally {
      setActiveTxAction(null)
    }
  }

  async function handleClaim(e) {
    e.preventDefault()
    const kwhSaved = parseInt(claimForm.kwhSaved)
    if (!kwhSaved) return
    setTxError(null)
    setActiveTxAction('claim')
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
      setTxError('Oracle signing unavailable. Set ORACLE_PRIVATE_KEY in backend .env')
      setActiveTxAction(null)
      return
    }
    try {
      const hash = await claimCredits(kwhSaved, nonce, sig)
      setTxHash(hash)
      setActivePanel(null)
    } catch (err) {
      setTxError(err?.message || 'Transaction failed')
    } finally {
      setActiveTxAction(null)
    }
  }

  async function handleRetire(e) {
    e.preventDefault()
    setTxError(null)
    setActiveTxAction('retire')
    try {
      const hash = await retireAndCertify(
        parseFloat(retireForm.amount),
        buildingInfo?.buildingId || 'GREENBLOCK_B01',
        retireForm.beneficiary,
        ''
      )
      setTxHash(hash.txHash)
      setActivePanel(null)
    } catch (err) {
      setTxError(err?.message || 'Transaction failed')
    } finally {
      setActiveTxAction(null)
    }
  }

  /* ── Install prompt ── */
  if (!isMetaMaskAvailable) {
    return (
      <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 12px' }} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#f59e0b18" />
          <path d="M20 10l10 18H10L20 10z" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M20 17v6M20 26v1" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div style={{ color: '#f59e0b', fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', marginBottom: '8px' }}>
          MetaMask Not Detected
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '12px', maxWidth: '320px', margin: '0 auto' }}>
          Install the MetaMask browser extension to connect your wallet and interact with GreenBlock carbon credit contracts on Polygon.
        </div>
        <a href="https://metamask.io" target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', marginTop: '16px', ...S.btn('#f59e0b') }}>
          Install MetaMask
        </a>
      </div>
    )
  }

  /* ── Connect / Connecting ── */
  if (!account) {
    return (
      <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
        {connecting ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--phosphor, #00FF8C)',
                  opacity: 0.9,
                  animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginBottom: '8px' }}>
              Connecting to MetaMask…
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
              Check your MetaMask extension for the approval prompt.
            </div>
          </>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--phosphor,#00FF8C)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }} aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div style={{ color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
              Connect Wallet
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '20px' }}>
              Connect MetaMask to earn, trade, and retire GBT carbon credits on Polygon.
            </div>
            <button style={S.btnSolid('var(--phosphor, #00FF8C)')} onClick={connect}>
              Connect MetaMask
            </button>
          </>
        )}
      </div>
    )
  }

  /* ── Wrong network banner ── */
  const wrongNetworkBanner = account && !isCorrectNetwork && (
    <div style={{
      background: '#f59e0b0f', border: '1px solid #f59e0b66',
      borderRadius: '10px', padding: '16px 20px', marginBottom: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <div style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
            Wrong Network
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
            Connected to {networkName || 'unknown'}. GreenBlock requires Polygon Amoy.
          </div>
        </div>
      </div>
      <button style={S.btnSolid('#f59e0b')} onClick={() => switchToPolygon(false)}>
        Switch to Amoy
      </button>
    </div>
  )

  /* ── TX pending card ── */
  const txPendingCard = txPending && (
    <div style={{
      background: 'var(--phosphor-ghost)', border: '1px solid var(--wire-mid)',
      borderRadius: '10px', padding: '16px 20px', marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--phosphor)',
            animation: `pulse-dot 1s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
      <div>
        <div style={{ color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
          {TX_LABELS[activeTxAction] || 'Transaction in Progress'}
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
          Waiting for blockchain confirmation…
        </div>
      </div>
    </div>
  )

  /* ── TX error card ── */
  const txErrorCard = txError && (
    <div style={{
      background: '#f9731608', border: '1px solid #f9731644',
      borderRadius: '10px', padding: '14px 18px', marginBottom: '16px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
    }}>
      <div>
        <div style={{ color: '#f97316', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
          Transaction Failed
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.5', maxWidth: '480px' }}>
          {txError}
        </div>
      </div>
      <button onClick={() => setTxError(null)} style={{ ...S.btn('#f97316'), padding: '4px 10px', fontSize: '10px', flexShrink: 0 }}>
        Dismiss
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {wrongNetworkBanner}
      {txPendingCard}
      {txErrorCard}

      {/* Wallet Header */}
      <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={S.label}>Connected Wallet</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-mid)' }}>{shortAddr}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <span style={S.badge(isCorrectNetwork ? 'var(--phosphor, #00FF8C)' : '#f97316')}>
              {networkName || 'Unknown Network'}
            </span>
            {maticBalance && <span style={S.badge('#22d3ee')}>{maticBalance} POL</span>}
          </div>
        </div>
        <button style={S.btn('var(--text-dim)')} onClick={disconnect}>Disconnect</button>
      </div>

      {/* GBT Balance + Building Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={S.card}>
          <div style={S.label}>GBT Balance</div>
          <div style={S.value}>{gbtBalance ?? '—'}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>GreenBlock Tokens</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>1 GBT = 1 kg CO₂ avoided</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>CO₂ Avoided</div>
          <div style={{ ...S.value, color: '#22d3ee' }}>{gbtBalance ?? '—'} kg</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
            ≈ {gbtBalance ? (gbtBalance / 1000).toFixed(4) : '—'} CCC equivalent
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>India CCTS 2023 standard</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Building</div>
          {buildingInfo ? (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-mid)', fontWeight: 700 }}>
                {buildingInfo.buildingId}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{buildingInfo.location}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Baseline: {buildingInfo.baselineKwhMonth} kWh/mo</div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>Not registered</div>
          )}
        </div>
        <div style={S.card}>
          <div style={S.label}>Certificates</div>
          <div style={{ ...S.value, color: '#f59e0b' }}>{myCertificates.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>NFT retirement certs</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={S.card}>
        <div style={S.label}>Actions</div>
        <div style={{ ...S.row, marginTop: '12px' }}>
          {!buildingInfo && (
            <button style={S.btnSolid('var(--phosphor, #00FF8C)')} onClick={() => setActivePanel(p => p === 'register' ? null : 'register')} disabled={txPending}>
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
            <button type="submit" style={S.btnSolid('var(--phosphor, #00FF8C)')} disabled={txPending}>
              Register on Polygon
            </button>
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
            <button type="submit" style={S.btnSolid('#22d3ee')} disabled={txPending}>
              Sign & Claim via Oracle
            </button>
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
            <button type="submit" style={S.btnSolid('#f59e0b')} disabled={txPending}>
              Retire & Mint NFT Certificate
            </button>
          </form>
        )}
      </div>

      {/* TX Confirmed */}
      {txHash && (
        <div style={{ ...S.card, borderColor: 'var(--wire-mid)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--phosphor)" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div style={{ ...S.label, marginBottom: 0 }}>Transaction Confirmed</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--phosphor)', wordBreak: 'break-all' }}>
            {txHash}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer"
              style={{ ...S.btn('var(--phosphor)'), fontSize: '10px' }}>
              View on Polygonscan
            </a>
            <button style={{ ...S.btn('var(--text-dim)'), fontSize: '10px' }} onClick={() => setTxHash(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* My Certificates */}
      {myCertificates.length > 0 && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: '12px' }}>My Retirement Certificates (NFTs)</div>
          {myCertificates.map(cert => (
            <div key={cert.id} style={{
              background: 'var(--deep)', borderRadius: '6px', padding: '12px',
              marginBottom: '8px', borderLeft: '3px solid #f59e0b',
            }}>
              <div style={S.row}>
                <span style={S.badge('#f59e0b')}>CERT #{cert.id}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-mid)' }}>{cert.kgCo2} kg CO₂</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                {cert.buildingId} · {cert.beneficiary} · {cert.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
