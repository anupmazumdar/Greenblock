/**
 * HvacSection Component
 * Displays HVAC recommendations and control suggestions
 */
import { useEffect, useState } from 'react'
import { getHvacRecommendation, getSensors } from '../utils/api'

export default function HvacSection() {
  const [hvacRec, setHvacRec] = useState(null)
  const [sensors, setSensors] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch HVAC data
  useEffect(() => {
    Promise.all([
      getHvacRecommendation().catch(() => null),
      getSensors().catch(() => null)
    ]).then(([rec, sens]) => {
      if (rec?.data?.data) setHvacRec(rec.data.data)
      if (sens?.data?.data) setSensors(sens.data.data)
      setLoading(false)
    })
  }, [])

  // Default recommendations if API doesn't provide
  const defaultRecs = [
    {
      title: 'Temperature Regulation',
      current: sensors?.temp || 26.4,
      target: 24,
      status: 'optimal',
      action: 'AC Operating at 24°C. Optimal comfort range maintained.'
    },
    {
      title: 'Humidity Control',
      current: sensors?.humidity || 68,
      target: 50,
      status: 'warning',
      action: 'Humidity 68%. Dehumidification recommended to reach 50-60% target.'
    },
    {
      title: 'Air Circulation',
      current: 2200,
      target: 2400,
      status: 'caution',
      action: 'Current CFM: 2200. Increase fan speed for better air mixing.'
    },
    {
      title: 'Energy Efficiency',
      current: 72,
      target: 85,
      status: 'caution',
      action: 'SEER Rating 72. Programmable thermostat can improve by 3-5%.'
    }
  ]

  const recommendations = hvacRec || { recommendations: defaultRecs }

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
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
        HVAC System — Smart Control Recommendations
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      {/* Current Status Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {[
          { label: 'Indoor Temp', value: sensors?.temp || 26.4, unit: '°C', color: '#f59e0b' },
          { label: 'Humidity', value: sensors?.humidity || 68, unit: '%', color: '#22d3ee' },
          { label: 'Air Quality', value: sensors?.co2_raw || 450, unit: 'ppm', color: '#4ade80' },
          { label: 'Fan Speed', value: 75, unit: '%', color: '#f97316' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#111c11',
            border: '1px solid #1e2e1e',
            borderRadius: '6px',
            padding: '16px',
            borderTop: `2px solid ${card.color}`
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
              {card.label}
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '28px',
              fontWeight: 700,
              color: card.color,
              lineHeight: 1
            }}>
              {card.value}
              <span style={{ fontSize: '14px', marginLeft: '4px', fontWeight: 600 }}>{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {(recommendations.recommendations || defaultRecs).map((rec, i) => {
          const statusColor = rec.status === 'optimal' ? '#4ade80' : rec.status === 'warning' ? '#f97316' : '#f59e0b'
          return (
            <div key={i} style={{
              background: '#111c11',
              border: '1px solid #1e2e1e',
              borderRadius: '6px',
              padding: '18px',
              borderLeft: `3px solid ${statusColor}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: '#c8d8c8',
                  textTransform: 'uppercase'
                }}>
                  {rec.title}
                </div>
                <div style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '3px',
                  background: `${statusColor}22`,
                  color: statusColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {rec.status}
                </div>
              </div>

              {/* Current vs Target */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #1e2e1e'
              }}>
                <div>
                  <div style={{
                    fontSize: '9px',
                    color: '#6b7e6b',
                    marginBottom: '4px'
                  }}>
                    Current
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#94a394'
                  }}>
                    {rec.current}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '9px',
                    color: '#6b7e6b',
                    marginBottom: '4px'
                  }}>
                    Target
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: statusColor
                  }}>
                    {rec.target}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div style={{
                fontSize: '11px',
                color: '#c8d8c8',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: statusColor }}>→ Action:</strong> {rec.action}
              </div>
            </div>
          )
        })}
      </div>

      {/* Schedule & Settings */}
      <div style={{
        background: '#111c11',
        border: '1px solid #1e2e1e',
        borderRadius: '6px',
        padding: '18px',
        marginBottom: '20px',
        borderTop: '2px solid #22d3ee'
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
          Automated Schedule
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          {[
            { time: 'Morning (6AM)', mode: 'Cool to 22°C', status: '✓ Scheduled' },
            { time: 'Daytime (9AM-6PM)', mode: 'Maintain 24°C', status: '✓ Active' },
            { time: 'Evening (6PM-10PM)', mode: 'Gradual warmup to 26°C', status: '✓ Scheduled' },
          ].map((sch, i) => (
            <div key={i} style={{
              background: '#0a150a',
              border: '1px solid #1e2e1e',
              borderRadius: '4px',
              padding: '12px'
            }}>
              <div style={{
                fontSize: '10px',
                color: '#6b7e6b',
                marginBottom: '6px'
              }}>
                {sch.time}
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 600,
                color: '#c8d8c8',
                marginBottom: '6px'
              }}>
                {sch.mode}
              </div>
              <div style={{
                fontSize: '9px',
                color: '#4ade80'
              }}>
                {sch.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div style={{
        background: '#111c11',
        border: '1px solid #1e2e1e',
        borderRadius: '6px',
        padding: '18px',
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
          Quick Controls
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          <button style={{
            padding: '12px',
            background: '#22d3ee',
            color: '#0a0f0a',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Increase Cooling
          </button>
          <button style={{
            padding: '12px',
            background: '#f59e0b',
            color: '#0a0f0a',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Increase Dehumidify
          </button>
          <button style={{
            padding: '12px',
            background: '#4ade80',
            color: '#0a0f0a',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Eco Mode
          </button>
          <button style={{
            padding: '12px',
            background: '#6b7e6b',
            color: '#0a0f0a',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            System Status
          </button>
        </div>
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
        Smart HVAC Control — Optimize comfort & energy efficiency
      </div>
    </div>
  )
}
