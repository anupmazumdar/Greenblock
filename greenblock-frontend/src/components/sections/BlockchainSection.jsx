import { useState } from 'react'
import { useWeb3 } from '../../hooks/useWeb3'
import { useCarbonCredits } from '../../hooks/useCarbonCredits'
import CarbonWallet from '../CarbonWallet'
import CreditMarketplace from '../CreditMarketplace'
import MRVReport from '../MRVReport'

const PANELS = [
  { id: 'wallet', label: 'Carbon Wallet', color: '#4ade80', icon: '◈' },
  { id: 'market', label: 'Marketplace', color: '#22d3ee', icon: '⇄' },
  { id: 'mrv', label: 'MRV Report', color: '#f59e0b', icon: '≡' },
]

const S = {
  panelBtn: (active, color) => ({
    background: active ? `${color}18` : 'transparent',
    border: `1px solid ${active ? color : '#1e2e1e'}`,
    color: active ? color : '#6b7e6b',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '11px',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  }),
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color,
    borderRadius: '4px', padding: '2px 8px', fontSize: '10px',
    letterSpacing: '0.1em', fontFamily: 'monospace', display: 'inline-block',
  }),
}

export default function BlockchainSection() {
  const [panel, setPanel] = useState('wallet')
  const web3 = useWeb3()
  const credits = useCarbonCredits(web3.signer, web3.provider, web3.account)

  const activePanel = PANELS.find(p => p.id === panel)

  return (
    <div>
      {/* Section Header */}
      <div style={{
        background: '#0a0f0a', border: '1px solid #1e2e1e', borderRadius: '10px',
        padding: '20px 24px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#050f05',
              }}>⛓</div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#c8d8c8', letterSpacing: '0.08em' }}>
                CARBON CREDIT BLOCKCHAIN
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#6b7e6b', maxWidth: '600px', lineHeight: '1.6' }}>
              GBT (GreenBlock Token) — verified carbon credits from IoT-monitored energy savings.
              Minted on Polygon via oracle-signed claims. Tradeable peer-to-peer. Retirable as NFT certificates.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={S.badge('#4ade80')}>CCTS 2023</span>
            <span style={S.badge('#22d3ee')}>Polygon PoS</span>
            <span style={S.badge('#f59e0b')}>ERC-20 GBT</span>
            <span style={S.badge('#c084fc')}>ERC-721 Certs</span>
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1px', background: '#1e2e1e', borderRadius: '8px',
          overflow: 'hidden', marginTop: '16px',
        }}>
          {[
            { label: 'Token', value: 'GBT', sub: '1 GBT = 1 kg CO₂' },
            { label: 'Network', value: 'Polygon', sub: 'Amoy Testnet' },
            { label: 'Emission Factor', value: '0.82', sub: 'kg CO₂/kWh (CEA)' },
            { label: 'CCTS Unit', value: '1000 GBT', sub: '= 1 tonne CO₂' },
            { label: 'Status', value: credits.contractsDeployed ? 'LIVE' : 'DEMO', sub: credits.contractsDeployed ? 'Contracts deployed' : 'Deploy contracts' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: '#0a0f0a', padding: '12px 16px' }}>
              <div style={{ fontSize: '10px', color: '#6b7e6b', letterSpacing: '0.1em' }}>{label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#c8d8c8', fontWeight: 700, marginTop: '2px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#4a5e4a', marginTop: '2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-panel Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {PANELS.map(p => (
          <button
            key={p.id}
            style={S.panelBtn(panel === p.id, p.color)}
            onClick={() => setPanel(p.id)}
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
        {web3.account && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 4px #4ade80' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4ade80' }}>
              {web3.account.slice(0, 6)}...{web3.account.slice(-4)}
            </span>
            {credits.gbtBalance !== null && (
              <span style={S.badge('#4ade80')}>{credits.gbtBalance} GBT</span>
            )}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {web3.error && (
        <div style={{
          background: '#1a0a0a', border: '1px solid #f9731644', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '12px',
          color: '#f97316', fontFamily: 'monospace', fontSize: '11px',
        }}>
          {web3.error}
        </div>
      )}
      {credits.error && (
        <div style={{
          background: '#1a0a0a', border: '1px solid #f9731644', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '12px',
          color: '#f97316', fontFamily: 'monospace', fontSize: '11px',
        }}>
          Contract error: {credits.error}
        </div>
      )}

      {/* Active Panel */}
      {panel === 'wallet' && <CarbonWallet web3={web3} credits={credits} />}
      {panel === 'market' && <CreditMarketplace credits={credits} account={web3.account} />}
      {panel === 'mrv' && <MRVReport />}

      {/* Deploy Instructions (shown when contracts not deployed) */}
      {!credits.contractsDeployed && (
        <div style={{
          background: '#0f1a0f', border: '1px solid #1e2e1e', borderRadius: '10px',
          padding: '20px', marginTop: '20px',
        }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 700, marginBottom: '12px' }}>
            SETUP: Deploy Smart Contracts
          </div>
          <div style={{ fontSize: '11px', color: '#6b7e6b', lineHeight: '2', fontFamily: 'monospace' }}>
            {[
              'cd greenblock-blockchain',
              'npm install',
              'cp .env.example .env  # add your DEPLOYER_PRIVATE_KEY',
              'npx hardhat compile',
              'npx hardhat run scripts/deploy.js --network polygonAmoy',
              '# Copy addresses from deployments/polygonAmoy.json to frontend .env',
              '# VITE_CONTRACT_GREEN_TOKEN=0x...',
              '# VITE_CONTRACT_CREDIT_REGISTRY=0x...',
              '# VITE_CONTRACT_MARKETPLACE=0x...',
              '# VITE_CONTRACT_RETIREMENT_LEDGER=0x...',
            ].map((cmd, i) => (
              <div key={i} style={{ color: cmd.startsWith('#') ? '#4a5e4a' : '#c8d8c8' }}>
                {cmd.startsWith('#') ? '' : '$ '}{cmd}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
