/**
 * EnergySection Component
 * Displays sensor data, charts, and energy metrics for the GreenBlock Energy dashboard
 */
import { useEffect, useState } from 'react'
import { getEnergyScore, getGridDependency } from '../../utils/api'

export default function EnergySection() {
  const [tempData, setTempData] = useState([])
  const [solarData, setSolarData] = useState([])
  const [energyScore, setEnergyScore] = useState(null)
  const [gridDependency, setGridDependency] = useState(null)

  // Initialize chart data
  useEffect(() => {
    if (tempData.length === 0) {
      const t = Array.from({ length: 120 }, (_, i) => 25.8 + Math.sin(i * 0.1) * 0.5 - i * 0.005)
      const s = Array.from({ length: 120 }, (_, i) => 155 + Math.sin((i / 120) * Math.PI) * 48)
      setTempData(t)
      setSolarData(s)
    }
  }, [tempData])

  // Fetch energy metrics
  useEffect(() => {
    getEnergyScore()
      .then(res => {
        if (res.data?.data) setEnergyScore(res.data.data)
      })
      .catch(() => {})

    getGridDependency()
      .then(res => {
        if (res.data?.data) setGridDependency(res.data.data)
      })
      .catch(() => {})
  }, [])

  const generateTempChart = () => {
    if (tempData.length === 0) return ''
    const W = 1200, H = 200, padL = 36, padR = 20, padT = 14, padB = 28
    const cW = W - padL - padR, cH = H - padT - padB
    const mn = Math.min(...tempData), mx = Math.max(...tempData)
    const lo = mn - 0.4, hi = mx + 0.4
    const xStep = cW / (tempData.length - 1)
    const toY = v => padT + cH - ((v - lo) / (hi - lo)) * cH
    const toX = i => padL + i * xStep
    const points = tempData.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: '200px' }}>
        <defs>
          <linearGradient id="fill-temp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={toX(tempData.length - 1)} cy={toY(tempData[tempData.length - 1])} r="4" fill="#22d3ee" stroke="#0f1a0f" strokeWidth="2" />
      </svg>
    )
  }

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Sensor Summary */}
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
        gap: '10px'
      }}>
        Sensor Summary — Live Readings
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      {/* 4 stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {[
          { label: 'Temperature', value: '24.5 °C', color: '#22d3ee', trend: '▲ 0.3 since last hour' },
          { label: 'Humidity', value: '62 %', color: '#4ade80', trend: 'Moderate — comfortable' },
          { label: 'Solar Voltage', value: '4.2 V', color: '#f59e0b', trend: 'Stable output' },
          { label: 'Solar Power', value: '180 mW', color: '#f59e0b', trend: '▶ Peak window active' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#111c11',
            border: '1px solid #1e2e1e',
            borderRadius: '6px',
            padding: '18px',
            position: 'relative',
            overflow: 'hidden',
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
              fontSize: '36px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              margin: '4px 0 6px',
              color: card.color
            }}>
              {card.value}
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
                background: card.color,
                flexShrink: 0
              }} />
              {card.trend}
            </div>
            <div style={{
              marginTop: '14px',
              height: '3px',
              background: '#1a2e1a',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${card.color}44, ${card.color})`,
                width: '60%',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
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
        gap: '10px'
      }}>
        Sensor History — Last 2 Hours
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>
      <div style={{
        background: '#111c11',
        border: '1px solid #1e2e1e',
        borderRadius: '6px',
        padding: '16px 18px 10px',
        marginBottom: '12px',
        borderTop: '2px solid #22d3ee'
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          color: '#94a394',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          Temperature <span style={{ color: '#6b7e6b', fontWeight: 400 }}>— Last 2 Hours</span>
        </div>
        <div style={{ height: '200px' }}>
          {generateTempChart()}
        </div>
      </div>

      {/* Energy Score & Grid Dependency Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '12px'
      }}>
        {energyScore && (
          <div style={{
            background: '#111c11',
            border: '1px solid #1e2e1e',
            borderRadius: '6px',
            padding: '16px',
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
              Energy Score
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '32px',
              fontWeight: 700,
              color: '#f59e0b',
              marginBottom: '8px'
            }}>
              {energyScore.score || 'A'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a394' }}>
              {energyScore.trend || 'Efficiency excellent'}
            </div>
          </div>
        )}
        {gridDependency && (
          <div style={{
            background: '#111c11',
            border: '1px solid #1e2e1e',
            borderRadius: '6px',
            padding: '16px',
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
              Grid Dependency
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '32px',
              fontWeight: 700,
              color: '#22d3ee',
              marginBottom: '8px'
            }}>
              {gridDependency.percentage || 25}%
            </div>
            <div style={{ fontSize: '11px', color: '#94a394' }}>
              Solar powered • Low grid usage
            </div>
          </div>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6b7e6b',
        letterSpacing: '0.1em',
        borderTop: '1px solid #1e2e1e'
      }}>
        Source: Demo mode — Connect hardware for live sensor data
      </div>
    </div>
  )
}
