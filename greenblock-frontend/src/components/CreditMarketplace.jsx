import { useState } from 'react'

const S = {
  card: { background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '10px', padding: '20px' },
  label: { fontSize: '10px', letterSpacing: '0.14em', color: '#6b7e6b', textTransform: 'uppercase', marginBottom: '6px' },
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color, borderRadius: '4px',
    padding: '2px 8px', fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'monospace',
  }),
  btn: (color = '#4ade80') => ({
    background: 'transparent', border: `1px solid ${color}`, color, borderRadius: '6px',
    padding: '7px 14px', fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'monospace',
  }),
  btnSolid: (color = '#4ade80') => ({
    background: color, border: 'none', color: '#050f05', borderRadius: '6px',
    padding: '7px 14px', fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer',
    fontFamily: 'monospace', fontWeight: 700,
  }),
  input: {
    background: '#0a0f0a', border: '1px solid #1e2e1e', color: '#c8d8c8', borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', fontFamily: 'monospace',
  },
}

export default function CreditMarketplace({ credits, account }) {
  const { listings, gbtBalance, txPending, listCredits, buyCredits } = credits

  const [listForm, setListForm] = useState({ amount: '', price: '' })
  const [buyForm, setBuyForm] = useState({})
  const [showList, setShowList] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)

  async function handleList(e) {
    e.preventDefault()
    setTxError(null)
    try {
      const hash = await listCredits(parseFloat(listForm.amount), parseFloat(listForm.price))
      setTxHash(hash)
      setShowList(false)
      setListForm({ amount: '', price: '' })
    } catch (err) {
      setTxError(err.message)
    }
  }

  async function handleBuy(listingId, amountGbt, pricePerGbt) {
    setTxError(null)
    try {
      const totalMatic = parseFloat(amountGbt) * parseFloat(pricePerGbt) * 1.01 // +1% fee buffer
      const hash = await buyCredits(listingId, amountGbt, totalMatic.toFixed(6))
      setTxHash(hash)
    } catch (err) {
      setTxError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div style={S.card}>
          <div style={S.label}>Active Listings</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', color: '#4ade80' }}>
            {listings.length}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Your Balance</div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#22d3ee' }}>
            {gbtBalance ?? '—'} GBT
          </div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Network</div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#c8d8c8', marginTop: '4px' }}>Polygon Amoy</div>
          <div style={{ fontSize: '10px', color: '#6b7e6b', marginTop: '2px' }}>Low-fee trading</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Platform Fee</div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>1%</div>
          <div style={{ fontSize: '10px', color: '#6b7e6b' }}>of each trade</div>
        </div>
      </div>

      {/* CCTS Context Banner */}
      <div style={{ ...S.card, borderColor: '#22d3ee44', background: '#0a1a1a' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <span style={S.badge('#22d3ee')}>INDIA CCTS 2023</span>
          <div style={{ fontSize: '11px', color: '#6b7e6b', lineHeight: '1.6' }}>
            GBT tokens represent verified CO₂ avoidance from IoT-monitored buildings.
            1,000 GBT = 1 tonne CO₂ = 1 CCC (Carbon Credit Certificate).
            When CCTS voluntary market launches (2025–26), GBT can bridge to BEE-issued CCCs for trading on IEX.
          </div>
        </div>
      </div>

      {/* Sell Panel */}
      {account && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={S.label}>Sell Your Credits</div>
            <button style={S.btn('#4ade80')} onClick={() => setShowList(v => !v)}>
              {showList ? 'Cancel' : '+ New Listing'}
            </button>
          </div>
          {showList && (
            <form onSubmit={handleList} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
              <div>
                <div style={S.label}>Amount (GBT)</div>
                <input style={S.input} type="number" step="0.001" placeholder={`Max: ${gbtBalance}`}
                  value={listForm.amount} onChange={e => setListForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div>
                <div style={S.label}>Price per GBT (POL)</div>
                <input style={S.input} type="number" step="0.000001" placeholder="e.g. 0.001"
                  value={listForm.price} onChange={e => setListForm(f => ({ ...f, price: e.target.value }))} required />
              </div>
              {listForm.amount && listForm.price && (
                <div style={{ fontSize: '11px', color: '#4ade80', fontFamily: 'monospace' }}>
                  Total: {(parseFloat(listForm.amount) * parseFloat(listForm.price)).toFixed(6)} POL
                  ({(parseFloat(listForm.amount) * parseFloat(listForm.price) * 200).toFixed(2)} INR est.)
                </div>
              )}
              <button type="submit" style={S.btnSolid('#4ade80')} disabled={txPending}>
                {txPending ? 'Processing...' : 'List on Marketplace'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Listings */}
      <div style={S.card}>
        <div style={S.label}>Live Listings</div>
        {listings.length === 0 ? (
          <div style={{ color: '#6b7e6b', fontSize: '12px', marginTop: '8px', fontFamily: 'monospace' }}>
            No active listings. Deploy contracts and list your first credits.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {listings.map(listing => (
              <div key={listing.id} style={{
                background: '#0a0f0a', borderRadius: '8px', padding: '14px',
                border: '1px solid #1e2e1e', display: 'flex', gap: '16px',
                justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={S.badge('#4ade80')}>#{listing.id}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c8d8c8' }}>
                      {listing.amountRemaining} GBT available
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7e6b' }}>
                    Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7e6b' }}>
                    Listed: {listing.listedAt}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#f59e0b', fontWeight: 700 }}>
                    {listing.pricePerGbt} POL
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '8px' }}>per GBT</div>
                  {account && listing.seller.toLowerCase() !== account.toLowerCase() && (
                    <button
                      style={S.btnSolid('#22d3ee')}
                      disabled={txPending}
                      onClick={() => handleBuy(listing.id, listing.amountRemaining, listing.pricePerGbt)}
                    >
                      Buy All
                    </button>
                  )}
                  {account && listing.seller.toLowerCase() === account.toLowerCase() && (
                    <span style={S.badge('#f59e0b')}>Your Listing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TX Feedback */}
      {txHash && (
        <div style={{ ...S.card, borderColor: '#4ade8044' }}>
          <div style={S.label}>Transaction Confirmed</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4ade80', wordBreak: 'break-all' }}>{txHash}</div>
          <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', marginTop: '8px', ...S.btn('#4ade80'), fontSize: '10px' }}>
            View on Polygonscan
          </a>
        </div>
      )}
      {txError && (
        <div style={{ ...S.card, borderColor: '#f9731644' }}>
          <div style={{ color: '#f97316', fontSize: '11px', fontFamily: 'monospace' }}>{txError}</div>
        </div>
      )}
    </div>
  )
}
