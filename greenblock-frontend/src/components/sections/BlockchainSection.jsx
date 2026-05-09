import { useState } from 'react'
import { useWeb3 } from '../../hooks/useWeb3'
import { useCarbonCredits } from '../../hooks/useCarbonCredits'
import { useAlgorand } from '../../hooks/useAlgorand'
import { useSolana } from '../../hooks/useSolana'
import { useRealtimeSensors } from '../../hooks/useRealtimeSensors'
import ChainSelector from '../ChainSelector'
import CarbonWallet from '../CarbonWallet'
import CreditMarketplace from '../CreditMarketplace'
import MRVReport from '../MRVReport'

const POLYGON_PANELS = [
  { id: 'wallet', label: 'Carbon Wallet', color: '#4ade80', icon: '◈' },
  { id: 'market', label: 'Marketplace',   color: '#22d3ee', icon: '⇄' },
  { id: 'mrv',   label: 'MRV Report',    color: '#f59e0b', icon: '≡' },
]

const S = {
  panelBtn: (active, color) => ({
    background: active ? `${color}18` : 'transparent',
    border: `1px solid ${active ? color : 'var(--wire, rgba(0,255,140,0.1))'}`,
    color: active ? color : 'var(--text-dim, rgba(220,242,225,0.38))',
    borderRadius: '6px', padding: '8px 16px', fontSize: '11px',
    letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)',
    textTransform: 'uppercase', display: 'flex', alignItems: 'center',
    gap: '6px', transition: 'all 0.15s ease',
  }),
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color,
    borderRadius: '4px', padding: '2px 8px', fontSize: '10px',
    letterSpacing: '0.1em', fontFamily: 'var(--font-mono, monospace)', display: 'inline-block',
  }),
  card: {
    background: 'var(--deep, #050D07)', border: '1px solid var(--wire, rgba(0,255,140,0.1))',
    borderRadius: '10px', padding: '20px',
  },
  row: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  connectBtn: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color,
    borderRadius: '6px', padding: '10px 20px', fontSize: '12px',
    fontFamily: 'var(--font-mono, monospace)', cursor: 'pointer', letterSpacing: '0.08em',
    fontWeight: 700, transition: 'all 0.15s ease',
  }),
  input: {
    background: 'var(--surface, #091509)', border: '1px solid var(--wire, rgba(0,255,140,0.1))',
    color: 'var(--text-mid, rgba(220,242,225,0.65))',
    borderRadius: '6px', padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)',
    fontSize: '12px', width: '160px', outline: 'none',
  },
  error: {
    background: '#1a0a0a', border: '1px solid #f9731644', borderRadius: '8px',
    padding: '10px 16px', color: '#f97316', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px',
    marginBottom: '12px',
  },
  stat: { background: 'var(--deep, #050D07)', padding: '12px 16px' },
}

function ChainWallet({ hook, color, symbol, symbol2, symbol2Label, connectLabel, setupCmds }) {
  const [kwhInput, setKwhInput] = useState('')
  const [txResult, setTxResult] = useState(null)

  const handleClaim = async () => {
    const kwh = Number(kwhInput)
    if (!kwh || kwh <= 0) return
    setTxResult(null)
    try {
      const txId = await hook.claimCredits(kwh)
      setTxResult({ ok: true, txId })
    } catch (err) {
      setTxResult({ ok: false, msg: err.message })
    }
  }

  if (!hook.account) {
    return (
      <div style={S.card}>
        {hook.connecting ? (
          <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: color,
                  animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ color, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
              Connecting…
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '4px' }}>
              Approve the connection in your wallet.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: '1.6' }}>
              Connect your wallet to claim carbon credits on this chain.
            </div>
            {hook.error && <div style={S.error}>{hook.error}</div>}
            <button style={S.connectBtn(color)} onClick={hook.connect}>
              {connectLabel}
            </button>
          </>
        )}
        {!hook.connecting && !hook.contractsDeployed && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '10px', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '8px' }}>
              SETUP: Deploy Contracts First
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '2', fontFamily: 'var(--font-mono)' }}>
              {setupCmds.map((cmd, i) => (
                <div key={i} style={{ color: cmd.startsWith('#') ? 'var(--text-dim)' : 'var(--text-mid)' }}>
                  {cmd.startsWith('#') ? '' : '$ '}{cmd}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={S.card}>
      {hook.error && <div style={S.error}>{hook.error}</div>}

      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1px', background: 'var(--wire)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
        {[
          { label: symbol2Label, value: hook.algoBalance ?? hook.solBalance ?? '—', sub: symbol2 },
          { label: 'GBT Balance', value: hook.gbtBalance ?? '—', sub: '1 GBT = 1 kg CO₂' },
          { label: 'Address', value: `${hook.account.slice(0, 8)}…`, sub: symbol + ' wallet' },
          { label: 'Contracts', value: hook.contractsDeployed ? 'LIVE' : 'DEMO', sub: hook.contractsDeployed ? 'Deployed' : 'Set env vars' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={S.stat}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-mid)', fontWeight: 700, marginTop: '2px' }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Claim Credits */}
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '10px' }}>
          CLAIM CREDITS (oracle-signed)
        </div>
        <div style={S.row}>
          <input
            style={S.input}
            type="number" min="1" placeholder="kWh saved"
            value={kwhInput} onChange={e => setKwhInput(e.target.value)}
          />
          <button
            style={S.connectBtn(color)}
            onClick={handleClaim}
            disabled={hook.txPending || !hook.contractsDeployed}
          >
            {hook.txPending ? 'Sending…' : 'Claim GBT'}
          </button>
          <button style={{ ...S.connectBtn('var(--text-dim)'), fontSize: '10px' }} onClick={hook.disconnect}>
            Disconnect
          </button>
        </div>

        {txResult && (
          <div style={{
            marginTop: '12px', padding: '10px 14px', borderRadius: '6px',
            background: txResult.ok ? 'var(--surface)' : '#1a0a0a',
            border: `1px solid ${txResult.ok ? 'var(--wire-mid)' : '#f9731644'}`,
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: txResult.ok ? 'var(--phosphor)' : '#f97316',
          }}>
            {txResult.ok
              ? `✓ Tx: ${txResult.txId.slice(0, 20)}…`
              : `Error: ${txResult.msg}`}
          </div>
        )}
      </div>
    </div>
  )
}

function SensorStrip({ sensors }) {
  if (!sensors.sensorData && !sensors.connected) return null

  const d = sensors.sensorData
  return (
    <div style={{
      background: 'var(--void)', border: '1px solid var(--wire)', borderRadius: '8px',
      padding: '10px 16px', marginTop: '16px',
      display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: sensors.connected ? 'var(--phosphor)' : '#f97316',
          boxShadow: sensors.connected ? '0 0 6px var(--phosphor)' : 'none',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: sensors.connected ? 'var(--phosphor)' : '#f97316' }}>
          {sensors.connected ? 'RPi4 LIVE' : 'RPi4 OFFLINE'}
        </span>
      </div>

      {d && [
        d.temp   != null && { label: 'Temp', value: `${d.temp.toFixed(1)}°C` },
        d.humidity != null && { label: 'RH', value: `${d.humidity.toFixed(0)}%` },
        d.power  != null && { label: 'Power', value: `${d.power.toFixed(1)}W` },
        d.co2    != null && { label: 'CO₂', value: `${d.co2} ppm` },
        d.kwh_saved != null && { label: 'kWh saved', value: d.kwh_saved.toFixed(3) },
      ].filter(Boolean).map(({ label, value }) => (
        <div key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
          <span style={{ color: 'var(--text-dim)' }}>{label} </span>
          <span style={{ color: 'var(--text-mid)', fontWeight: 700 }}>{value}</span>
        </div>
      ))}

      {sensors.lastUpdated && (
        <div style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {sensors.lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

export default function BlockchainSection() {
  const [chain, setChain] = useState('polygon')
  const [panel, setPanel] = useState('wallet')

  const web3    = useWeb3()
  const credits = useCarbonCredits(web3.signer, web3.provider, web3.account)
  const algo    = useAlgorand()
  const solana  = useSolana()
  const sensors = useRealtimeSensors()

  const activePanel = POLYGON_PANELS.find(p => p.id === panel)

  const wallets = {
    polygon:  { account: web3.account,  gbtBalance: credits.gbtBalance  },
    algorand: { account: algo.account,  gbtBalance: algo.gbtBalance     },
    solana:   { account: solana.account, gbtBalance: solana.gbtBalance   },
  }

  return (
    <div>
      {/* Section Header */}
      <div style={{
        background: 'var(--deep)', border: '1px solid var(--wire)', borderRadius: '10px',
        padding: '20px 24px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'linear-gradient(135deg, var(--phosphor), #9945ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'var(--void)',
              }}>⛓</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-mid)', letterSpacing: '0.08em' }}>
                CARBON CREDIT BLOCKCHAIN
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '600px', lineHeight: '1.6' }}>
              GBT (GreenBlock Token) — IoT-verified carbon credits on Polygon, Algorand, and Solana.
              Oracle-signed claims from RPi4 sensor data. Tradeable peer-to-peer. Retirable as certificates.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={S.badge('#a855f7')}>Polygon PoS</span>
            <span style={S.badge('#00b4d8')}>Algorand AVM</span>
            <span style={S.badge('#9945ff')}>Solana SVM</span>
            <span style={S.badge('var(--phosphor)')}>CCTS 2023</span>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1px', background: 'var(--wire)', borderRadius: '8px', overflow: 'hidden', marginTop: '16px',
        }}>
          {[
            { label: 'Token',           value: 'GBT',    sub: '1 GBT = 1 kg CO₂'   },
            { label: 'Emission Factor', value: '0.82',   sub: 'kg CO₂/kWh (CEA)'    },
            { label: 'Polygon',         value: 'ERC-20', sub: '18 decimals'          },
            { label: 'Algorand',        value: 'ASA',    sub: '6 decimals (ARC-20)'  },
            { label: 'Solana',          value: 'SPL',    sub: '9 decimals'           },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: 'var(--deep)', padding: '12px 16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-mid)', fontWeight: 700, marginTop: '2px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chain selector */}
      <ChainSelector active={chain} onChange={setChain} wallets={wallets} />

      {/* ── Polygon panel ────────────────────────────────────────── */}
      {chain === 'polygon' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {POLYGON_PANELS.map(p => (
              <button key={p.id} style={S.panelBtn(panel === p.id, p.color)} onClick={() => setPanel(p.id)}>
                <span>{p.icon}</span>{p.label}
              </button>
            ))}
            {web3.account && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--phosphor)', boxShadow: '0 0 4px var(--phosphor)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--phosphor)' }}>
                  {web3.account.slice(0, 6)}…{web3.account.slice(-4)}
                </span>
                {credits.gbtBalance !== null && (
                  <span style={S.badge('var(--phosphor)')}>{credits.gbtBalance} GBT</span>
                )}
              </div>
            )}
          </div>

          {web3.error   && <div style={S.error}>{web3.error}</div>}
          {credits.error && <div style={S.error}>Contract error: {credits.error}</div>}

          {panel === 'wallet' && <CarbonWallet web3={web3} credits={credits} />}
          {panel === 'market' && <CreditMarketplace credits={credits} account={web3.account} />}
          {panel === 'mrv'    && <MRVReport />}

          {!credits.contractsDeployed && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--wire)', borderRadius: '10px', padding: '20px', marginTop: '20px' }}>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '12px' }}>
                SETUP: Deploy Smart Contracts
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '2', fontFamily: 'var(--font-mono)' }}>
                {['cd greenblock-blockchain', 'npm install', 'cp .env.example .env', 'npx hardhat compile',
                  'npx hardhat run scripts/deploy.js --network polygonAmoy',
                  '# Copy addresses to frontend .env:',
                  '# VITE_CONTRACT_GREEN_TOKEN=0x...', '# VITE_CONTRACT_CREDIT_REGISTRY=0x...',
                ].map((cmd, i) => (
                  <div key={i} style={{ color: cmd.startsWith('#') ? 'var(--text-dim)' : 'var(--text-mid)' }}>
                    {cmd.startsWith('#') ? '' : '$ '}{cmd}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Algorand panel ───────────────────────────────────────── */}
      {chain === 'algorand' && (
        <ChainWallet
          hook={algo}
          color="#00b4d8"
          symbol="ALGO"
          symbol2="ALGO"
          symbol2Label="ALGO Balance"
          connectLabel="Connect Pera Wallet"
          setupCmds={[
            'cd greenblock-blockchain/algorand',
            'pip install -r requirements.txt',
            'cp .env.example .env  # add DEPLOYER_MNEMONIC',
            'python deploy.py',
            '# Set in frontend .env:',
            '# VITE_ALGORAND_CREDIT_REGISTRY_APP_ID=...',
            '# VITE_ALGORAND_GBT_ASSET_ID=...',
          ]}
        />
      )}

      {/* ── Solana panel ─────────────────────────────────────────── */}
      {chain === 'solana' && (
        <ChainWallet
          hook={solana}
          color="#9945ff"
          symbol="SOL"
          symbol2="SOL"
          symbol2Label="SOL Balance"
          connectLabel="Connect Phantom"
          setupCmds={[
            'cd greenblock-blockchain/solana',
            'anchor build',
            'ORACLE_PUBKEY_HEX=<hex> ts-node scripts/deploy.ts',
            '# Set in frontend .env:',
            '# VITE_SOLANA_CREDIT_REGISTRY_PROGRAM_ID=...',
            '# VITE_SOLANA_GBT_MINT=...',
          ]}
        />
      )}

      {/* RPi4 sensor strip */}
      <SensorStrip sensors={sensors} />
    </div>
  )
}
