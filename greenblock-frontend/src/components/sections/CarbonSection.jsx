/**
 * CarbonSection Component
 * Displays carbon savings, air quality, and logging functionality
 */
import { useEffect, useState } from 'react'
import { getCarbonSavings, getAirQuality } from '../../utils/api'

const UNITS = ['kg', 'g', 'tonnes', 'litres', 'units', 'pcs']

const MATERIAL_PRESETS = [
  'Aluminium', 'Cardboard', 'Glass', 'Plastic', 'Steel',
  'Paper', 'Wood', 'Copper', 'Rubber', 'Textile',
]

export default function CarbonSection() {
  const [carbonSavings, setCarbonSavings] = useState(null)
  const [airQuality, setAirQuality] = useState(null)
  const [materials, setMaterials] = useState([
    { name: 'Aluminium', amount: 2.5, unit: 'kg' },
    { name: 'Cardboard', amount: 8.3, unit: 'kg' },
    { name: 'Glass', amount: 1.2, unit: 'kg' },
  ])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', unit: 'kg' })
  const [formError, setFormError] = useState('')
  const [editIdx, setEditIdx] = useState(null)

  function openAdd() {
    setForm({ name: '', amount: '', unit: 'kg' })
    setFormError('')
    setEditIdx(null)
    setShowForm(true)
  }

  function openEdit(idx) {
    const m = materials[idx]
    setForm({ name: m.name, amount: String(m.amount), unit: m.unit })
    setFormError('')
    setEditIdx(idx)
    setShowForm(true)
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  function submitForm() {
    const name = form.name.trim()
    const amount = parseFloat(form.amount)
    if (!name) { setFormError('Material name is required.'); return }
    if (!form.amount || isNaN(amount) || amount <= 0) { setFormError('Enter a valid quantity > 0.'); return }

    if (editIdx !== null) {
      setMaterials(prev => prev.map((m, i) => i === editIdx ? { name, amount, unit: form.unit } : m))
    } else {
      setMaterials(prev => [...prev, { name, amount, unit: form.unit }])
    }
    setShowForm(false)
    setForm({ name: '', amount: '', unit: 'kg' })
    setEditIdx(null)
  }

  function removeMaterial(idx) {
    setMaterials(prev => prev.filter((_, i) => i !== idx))
    if (editIdx === idx) setShowForm(false)
  }

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
        {/* Material cards */}
        {materials.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '14px'
          }}>
            {materials.map((m, i) => (
              <div key={i} style={{
                background: '#0a150a',
                border: '1px solid #1e2e1e',
                borderRadius: '4px',
                padding: '12px',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Edit / Remove */}
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <button
                    onClick={() => openEdit(i)}
                    title="Edit"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#6b7e6b', fontSize: '10px', padding: '0 2px'
                    }}
                  >✎</button>
                  <button
                    onClick={() => removeMaterial(i)}
                    title="Remove"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#6b7e6b', fontSize: '10px', padding: '0 2px'
                    }}
                  >✕</button>
                </div>
                <div style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '6px', marginTop: '8px' }}>
                  {m.name}
                </div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '20px',
                  fontWeight: 700, color: '#22d3ee'
                }}>
                  {m.amount}
                </div>
                <div style={{ fontSize: '9px', color: '#6b7e6b', marginTop: '4px' }}>
                  {m.unit}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '20px 0',
            fontFamily: 'monospace', fontSize: '10px', color: '#6b7e6b',
            marginBottom: '14px'
          }}>
            No materials logged yet.
          </div>
        )}

        {/* Inline input form */}
        {showForm && (
          <div style={{
            background: '#0a150a',
            border: '1px solid #1e2e1e',
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: '8.5px', fontWeight: 600,
              letterSpacing: '0.18em', color: '#22d3ee',
              textTransform: 'uppercase', marginBottom: '12px'
            }}>
              {editIdx !== null ? 'Edit Material' : 'Log New Material'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px', gap: '8px', marginBottom: '10px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '8px', color: '#6b7e6b', marginBottom: '4px', letterSpacing: '0.1em' }}>
                  MATERIAL NAME
                </label>
                <input
                  list="material-presets"
                  value={form.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Aluminium"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#111c11', border: '1px solid #1e2e1e',
                    borderRadius: '3px', padding: '7px 10px',
                    fontFamily: 'monospace', fontSize: '11px', color: '#e2ffe2',
                    outline: 'none'
                  }}
                />
                <datalist id="material-presets">
                  {MATERIAL_PRESETS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '8px', color: '#6b7e6b', marginBottom: '4px', letterSpacing: '0.1em' }}>
                  QUANTITY
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.amount}
                  onChange={e => handleFormChange('amount', e.target.value)}
                  placeholder="0.0"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#111c11', border: '1px solid #1e2e1e',
                    borderRadius: '3px', padding: '7px 10px',
                    fontFamily: 'monospace', fontSize: '11px', color: '#e2ffe2',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Unit */}
              <div>
                <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '8px', color: '#6b7e6b', marginBottom: '4px', letterSpacing: '0.1em' }}>
                  UNIT
                </label>
                <select
                  value={form.unit}
                  onChange={e => handleFormChange('unit', e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#111c11', border: '1px solid #1e2e1e',
                    borderRadius: '3px', padding: '7px 8px',
                    fontFamily: 'monospace', fontSize: '11px', color: '#e2ffe2',
                    outline: 'none', cursor: 'pointer'
                  }}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {formError && (
              <div style={{
                fontFamily: 'monospace', fontSize: '9px', color: '#f87171',
                marginBottom: '10px', letterSpacing: '0.05em'
              }}>
                ⚠ {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={submitForm}
                style={{
                  flex: 1, padding: '8px',
                  background: '#22d3ee', color: '#0a0f0a',
                  border: 'none', borderRadius: '3px',
                  fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {editIdx !== null ? '✓ Update' : '✓ Save'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '8px 14px',
                  background: 'none', color: '#6b7e6b',
                  border: '1px solid #1e2e1e', borderRadius: '3px',
                  fontFamily: 'monospace', fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add button */}
        {!showForm && (
          <button
            onClick={openAdd}
            style={{
              width: '100%', padding: '10px',
              background: '#22d3ee', color: '#0a0f0a',
              border: 'none', borderRadius: '4px',
              fontFamily: 'monospace', fontSize: '10px', fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.18s'
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            + Log Material
          </button>
        )}
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
