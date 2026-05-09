const CHAINS = [
  { id: 'polygon',  label: 'Polygon',  symbol: 'POL',  color: '#a855f7', badge: 'EVM',  testnet: 'Amoy'    },
  { id: 'algorand', label: 'Algorand', symbol: 'ALGO', color: '#00b4d8', badge: 'AVM',  testnet: 'TestNet' },
  { id: 'solana',   label: 'Solana',   symbol: 'SOL',  color: '#9945ff', badge: 'SVM',  testnet: 'Devnet'  },
]

const S = {
  btn: (active, color) => ({
    background:   active ? `${color}18` : 'transparent',
    border:       `1px solid ${active ? color : '#1e2e1e'}`,
    color:        active ? color : '#6b7e6b',
    borderRadius: '6px',
    padding:      '7px 14px',
    fontSize:     '11px',
    letterSpacing: '0.08em',
    cursor:       'pointer',
    fontFamily:   'monospace',
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    transition:   'all 0.15s ease',
    minWidth:     '120px',
  }),
  dot: (connected, color) => ({
    width: '6px', height: '6px', borderRadius: '50%',
    background: connected ? color : '#1e2e1e',
    boxShadow:  connected ? `0 0 4px ${color}` : 'none',
    flexShrink: 0,
  }),
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color,
    borderRadius: '3px', padding: '1px 5px', fontSize: '9px',
    letterSpacing: '0.1em', fontFamily: 'monospace',
  }),
  addr: { fontFamily: 'monospace', fontSize: '10px', color: '#9ca39c' },
}

export default function ChainSelector({ active, onChange, wallets }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {CHAINS.map(chain => {
        const wallet = wallets?.[chain.id]
        const isActive = active === chain.id
        return (
          <button
            key={chain.id}
            style={S.btn(isActive, chain.color)}
            onClick={() => onChange(chain.id)}
          >
            <div style={S.dot(Boolean(wallet?.account), chain.color)} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontWeight: isActive ? 700 : 400 }}>{chain.label}</span>
                <span style={S.badge(chain.color)}>{chain.badge}</span>
              </div>
              {wallet?.account ? (
                <div style={S.addr}>
                  {chain.id === 'solana'
                    ? `${wallet.account.slice(0, 4)}…${wallet.account.slice(-4)}`
                    : `${wallet.account.slice(0, 6)}…${wallet.account.slice(-4)}`}
                  {wallet.gbtBalance != null && (
                    <span style={{ color: chain.color, marginLeft: '5px' }}>{wallet.gbtBalance} GBT</span>
                  )}
                </div>
              ) : (
                <div style={{ ...S.addr, color: '#4a5e4a' }}>{chain.testnet} · not connected</div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
