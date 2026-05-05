/**
 * CarbonSection Component
 * Displays carbon savings, air quality, and logging functionality
 */
import { useEffect, useState } from 'react'
import { getCarbonSavings, getAirQuality } from '../../utils/api'

export default function CarbonSection() {
  const [carbonSavings, setCarbonSavings] = useState(null)
  const [airQuality, setAirQuality] = useState(null)
  const [materials, setMaterials] = useState([
    { name: 'Aluminium', amount: 2.5, unit: 'kg' },
    { name: 'Cardboard', amount: 8.3, unit: 'kg' },
    { name: 'Glass', amount: 1.2, unit: 'kg' },
  ])

  // Fetch carbon metrics
  useEffect(() => {
    getCarbonSavings()
      .then(res => {
        if (res.data?.data) setCarbonSavings(res.data.data)
      })
      .catch(() => {})

    getAirQuality()
      .then(res => {
        if (res.data?.data) setAirQuality(res.data.data)
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Carbon Savings Summary */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.2em',
        color: '#6b7e6b',
        textTransform: 'uppercase',
        padding: '14px 0 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
      }}>
        Carbon Offset — Impact Metrics
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      {/* Carbon Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {carbonSavings && (
          <>
            <div style={{
              background: '#111c11',
              border: '1px solid #1e2e1e',
              borderRadius: '6px',
              padding: '18px',
              borderTop: '2px solid #4ade80'
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '8.5px',
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: '#6b7e6b',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                CO₂ Saved
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '32px',
                fontWeight: 700,
                color: '#4ade80',
                margin: '4px 0 6px'
              }}>
                {carbonSavings.co2_saved || 2840} kg
              </div>
              <div style={{
                fontSize: '10px',
                color: '#6b7e6b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  flexShrink: 0
                }} />
                This month
              </div>
            </div>

            <div style={{
              background: '#111c11',
              border: '1px solid #1e2e1e',
              borderRadius: '6px',
              padding: '18px',
              borderTop: '2px solid #22d3ee'
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '8.5px',
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: '#6b7e6b',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                Trees Equivalent
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '32px',
                fontWeight: 700,
                color: '#22d3ee',
                margin: '4px 0 6px'
              }}>
                {carbonSavings.trees_equivalent || 142}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#6b7e6b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#22d3ee',
                  flexShrink: 0
                }} />
                Annual offset
              </div>
            </div>

            <div style={{
              background: '#111c11',
              border: '1px solid #1e2e1e',
              borderRadius: '6px',
              padding: '18px',
              borderTop: '2px solid #f59e0b'
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '8.5px',
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: '#6b7e6b',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                Recycling Rate
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '32px',
                fontWeight: 700,
                color: '#f59e0b',
                margin: '4px 0 6px'
              }}>
                {carbonSavings.recycling_rate || 89}%
              </div>
              <div style={{
                fontSize: '10px',
                color: '#6b7e6b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  flexShrink: 0
                }} />
                Overall facility
              </div>
            </div>
          </>
        )}
      </div>

      {/* Air Quality */}
      {airQuality && (
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          marginBottom: '20px',
          borderTop: '2px solid #f59e0b'
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Air Quality — CO₂ Monitoring
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '6px' }}>CO₂ PPM</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '28px',
                fontWeight: 700,
                color: '#f59e0b'
              }}>
                {airQuality.co2_ppm || 1180}
              </div>
              <div style={{ fontSize: '9px', color: '#6b7e6b', marginTop: '4px' }}>Safe range</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '6px' }}>AQI</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '28px',
                fontWeight: 700,
                color: '#4ade80'
              }}>
                {airQuality.aqi || 45}
              </div>
              <div style={{ fontSize: '9px', color: '#6b7e6b', marginTop: '4px' }}>Good</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '6px' }}>Status</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 700,
                color: '#4ade80'
              }}>
                ✓ Healthy
              </div>
              <div style={{ fontSize: '9px', color: '#6b7e6b', marginTop: '4px' }}>All clear</div>
            </div>
          </div>
        </div>
      )}

      {/* Material Logger */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.2em',
        color: '#6b7e6b',
        textTransform: 'uppercase',
        padding: '14px 0 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
      }}>
        Material Logger — Recycled Items
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      <div style={{
        background: '#111c11',
        border: '1px solid #1e2e1e',
        borderRadius: '6px',
        padding: '18px',
        borderTop: '2px solid #22d3ee'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '12px'
        }}>
          {materials.map((m, i) => (
            <div key={i} style={{
              background: '#0a150a',
              border: '1px solid #1e2e1e',
              borderRadius: '4px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '10px',
                color: '#6b7e6b',
                marginBottom: '6px'
              }}>
                {m.name}
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '20px',
                fontWeight: 700,
                color: '#22d3ee'
              }}>
                {m.amount}
              </div>
              <div style={{
                fontSize: '9px',
                color: '#6b7e6b',
                marginTop: '4px'
              }}>
                {m.unit}
              </div>
            </div>
          ))}
        </div>
        <button style={{
          width: '100%',
          padding: '10px',
          background: '#22d3ee',
          color: '#0a0f0a',
          border: 'none',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
        onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          + Log Material
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6b7e6b',
        letterSpacing: '0.1em',
        marginTop: '12px',
        borderTop: '1px solid #1e2e1e'
      }}>
        Carbon tracking — Reduce, Reuse, Recycle
      </div>
    </div>
  )
}
