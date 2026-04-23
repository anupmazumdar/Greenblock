import { useEffect, useState } from 'react'
import { getWeather, getAgriRecommendation, getAgriIrrigationStatus, getAgriDiseaseRisk, getAgriTankLevel, getSensors } from '../utils/api'

export default function UnifiedDashboard({ mode = 'greenblock' }) {
  const [tab, setTab] = useState(mode === 'agriblock' ? 'agri' : 'green')
  const [weather, setWeather] = useState(null)
  const [tick, setTick] = useState(0)
  const [tempData, setTempData] = useState([])
  const [solarData, setSolarData] = useState([])
  const [agriData, setAgriData] = useState(null)

  // Fetch weather
  useEffect(() => {
    getWeather()
      .then(res => {
        if (res.data?.status === 'ok') setWeather(res.data.data)
      })
      .catch(() => {})
  }, [])

  // Fetch AgriBlock data
  useEffect(() => {
    Promise.all([
      getAgriRecommendation().catch(() => null),
      getAgriIrrigationStatus().catch(() => null),
      getAgriDiseaseRisk().catch(() => null),
      getAgriTankLevel().catch(() => null),
      getSensors().catch(() => null),
    ]).then(([rec, irr, dis, tank, sens]) => {
      setAgriData({ recommendation: rec?.data?.data, irrigation: irr?.data?.data, disease: dis?.data?.data, tank: tank?.data?.data, sensors: sens?.data?.data })
    })
  }, [])

  // Initialize chart data
  useEffect(() => {
    if (tempData.length === 0) {
      const t = Array.from({ length: 120 }, (_, i) => 25.8 + Math.sin(i * 0.1) * 0.5 - i * 0.005)
      const s = Array.from({ length: 120 }, (_, i) => 155 + Math.sin((i / 120) * Math.PI) * 48)
      setTempData(t)
      setSolarData(s)
    }
  }, [])

  // Live ticker
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 2000)
    return () => clearInterval(iv)
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

  const switchTab = (t) => setTab(t)

  return (
    <div style={{
      background: '#0a0f0a', color: '#c8d8c8', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', minHeight: '100vh',
      '--bg': '#0a0f0a', '--surface': '#0f1a0f', '--card': '#111c11', '--border': '#1e2e1e',
      '--green': '#4ade80', '--cyan': '#22d3ee', '--amber': '#f59e0b', '--red': '#f97316', '--text-dim': '#6b7e6b',
    }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '52px',
        background: '#080d08', borderBottom: '1px solid #1e2e1e', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #f59e0b, #78350f)',
            boxShadow: '0 0 10px #f59e0b55'
          }} />
          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em' }}>
            {tab === 'green' ? 'GREENBLOCK' : 'AGRIBLOCK'}
            <div style={{ fontSize: '9px', fontWeight: 400, color: '#6b7e6b', letterSpacing: '0.18em', marginTop: '1px' }}>
              {tab === 'green' ? 'ENERGY & ENVIRONMENT' : 'CONTROL CENTER'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#6b7e6b', letterSpacing: '0.06em' }}>
          GreenBlock / <b style={{ color: '#94a394' }}>Dashboard</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '0.1em' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: tab === 'green' ? '#f97316' : '#4ade80',
            boxShadow: `0 0 6px ${tab === 'green' ? '#f97316' : '#4ade80'}`
          }} />
          <span style={{ color: tab === 'green' ? '#f97316' : '#4ade80', fontFamily: 'monospace', fontSize: '10px' }}>
            ● {tab === 'green' ? 'DEMO MODE OFFLINE' : 'ONLINE'}
          </span>
        </div>
      </nav>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e2e1e', padding: '0 24px', background: '#090e09' }}>
        {['green', 'agri'].map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{
              padding: '10px 20px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase', background: 'none', border: 'none',
              color: tab === t ? (t === 'green' ? '#4ade80' : '#22d3ee') : '#6b7e6b',
              cursor: 'pointer', borderBottom: tab === t ? `2px solid ${t === 'green' ? '#4ade80' : '#22d3ee'}` : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.2s, border-color 0.2s'
            }}
          >
            {t === 'green' ? 'GreenBlock' : 'AgriBlock'}
          </button>
        ))}
      </div>

      {/* PAGE: GREEN */}
      {tab === 'green' && (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', color: '#6b7e6b', textTransform: 'uppercase', padding: '14px 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Sensor Summary — Live Readings
            <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
          </div>

          {/* 4 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Temperature', value: '24.5 °C', color: '#22d3ee', trend: '▲ 0.3 since last hour' },
              { label: 'Humidity', value: '62 %', color: '#4ade80', trend: 'Moderate — comfortable' },
              { label: 'Solar Voltage', value: '4.2 V', color: '#f59e0b', trend: 'Stable output' },
              { label: 'Solar Power', value: '180 mW', color: '#f59e0b', trend: '▶ Peak window active' },
            ].map((card, i) => (
              <div key={i} style={{
                background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '18px',
                position: 'relative', overflow: 'hidden',
                borderTop: `2px solid ${card.color}`
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.2em', color: '#6b7e6b', textTransform: 'uppercase', marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '36px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', margin: '4px 0 6px', color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '10px', color: '#6b7e6b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: card.color, flexShrink: 0 }} /> {card.trend}
                </div>
                <div style={{ marginTop: '14px', height: '3px', background: '#1a2e1a', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, ${card.color}44, ${card.color})`, width: '60%', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', color: '#6b7e6b', textTransform: 'uppercase', padding: '14px 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Sensor History — Last 2 Hours
            <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
          </div>
          <div style={{ background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '16px 18px 10px', marginBottom: '12px', borderTop: '2px solid #22d3ee' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', color: '#94a394', textTransform: 'uppercase', marginBottom: '12px' }}>
              Temperature <span style={{ color: '#6b7e6b', fontWeight: 400 }}>— Last 2 Hours</span>
            </div>
            <div style={{ height: '200px' }}>
              {generateTempChart()}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '12px', fontFamily: 'monospace', fontSize: '9px', color: '#6b7e6b', letterSpacing: '0.1em', borderTop: '1px solid #1e2e1e' }}>
            Source: Demo mode — Connect hardware for live sensor data
          </div>
        </div>
      )}

      {/* PAGE: AGRI with Desi Jugaad Toolkit */}
      {tab === 'agri' && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Desi Jugaad Toolkit Section */}
          <div style={{ background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '18px', marginBottom: '20px', borderTop: '2px solid #f59e0b' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#c8d8c8', marginBottom: '12px' }}>🔧 Desi Jugaad Toolkit</h2>
            <p style={{ fontSize: '12px', color: '#94a394', marginBottom: '12px' }}>
              Practical farming solutions using locally available materials. Step-by-step guidance powered by AI.
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px'
            }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{
                  background: step === 2 ? '#22d3ee22' : '#1a2e1a', border: `1px solid ${step === 2 ? '#22d3ee' : '#1e2e1e'}`,
                  borderRadius: '6px', padding: '8px', textAlign: 'center',
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 600,
                  color: step === 2 ? '#22d3ee' : '#94a394'
                }}>
                  Step {step} {step === 2 ? '• Active' : step === 1 ? '• Done' : ''}
                </div>
              ))}
            </div>
            <div style={{ background: '#0a150a', border: '1px solid #22d3ee', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee', marginBottom: '8px' }}>Step 1: Goal Selection</h3>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a394', marginBottom: '6px' }}>Kya banana chahte hain?</label>
              <select style={{
                width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #1e2e1e',
                background: '#0f1a0f', color: '#c8d8c8', fontSize: '11px', fontFamily: 'monospace'
              }}>
                <option>Compost Bin</option>
                <option>Drip Irrigation</option>
                <option>Pesticide Spray</option>
                <option>Plant Support</option>
              </select>
              <button style={{
                marginTop: '8px', width: '100%', padding: '8px', borderRadius: '4px',
                background: '#22d3ee', color: '#0a0f0a', fontWeight: 600, fontSize: '11px', border: 'none', cursor: 'pointer'
              }}>
                AI se Materials Puchho 🤖
              </button>
            </div>
            <div style={{ background: '#0a150a', border: '1px solid #22d3ee', borderRadius: '6px', padding: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee', marginBottom: '8px' }}>Step 3: Final Jugaad Recipe</h3>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#c8d8c8', lineHeight: '1.6' }}>
                <strong>Compost Bin — Jugaad Style</strong>
                <div style={{ marginTop: '8px', color: '#94a394' }}>
                  Materials: Old drum, burlap sack, bamboo sticks<br />
                  Layer 1: Dry leaves (12 inches)<br />
                  Layer 2: Cow dung (6 inches)<br />
                  Layer 3: Kitchen waste (6 inches)<br />
                  Repeat layers. Mist with water daily.
                </div>
              </div>
            </div>
          </div>

          {/* Weather Card */}
          {weather && (
            <div style={{ background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '18px', marginBottom: '20px', borderTop: '2px solid #22d3ee' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#c8d8c8', marginBottom: '12px' }}>🌤️ Outdoor Weather — Jaipur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#0a150a', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '6px' }}>Temperature</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{weather.outdoor_temp || 28}°C</p>
                </div>
                <div style={{ background: '#0a150a', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#6b7e6b', marginBottom: '6px' }}>Humidity</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: '#22d3ee' }}>{weather.outdoor_humidity || 65}%</p>
                </div>
              </div>
              <div style={{ background: '#0a150a', padding: '12px', borderRadius: '4px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#6b7e6b' }}>Condition</span>
                <span style={{ fontWeight: 600, color: '#c8d8c8' }}>{weather.description || 'Partly cloudy'}</span>
              </div>
              <div style={{ background: '#0a150a', padding: '12px', borderRadius: '4px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#6b7e6b' }}>6hr Forecast</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>{weather.forecast_next_6hr || 26}°C</span>
              </div>
            </div>
          )}

          {/* Control Center Grid */}
          <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', color: '#6b7e6b', textTransform: 'uppercase', padding: '14px 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Control Center — Live Modules
            <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { title: 'Greenhouse Climate', temp: '27.4 °C', humidity: '74 %', color: '#22d3ee' },
              { title: 'Smart Irrigation', status: 'OFF', reason: 'Rain detected', color: '#4ade80' },
              { title: 'Disease Risk', level: 'HIGH', condition: 'Humidity ≥ 80%', color: '#f97316' },
            ].map((card, i) => (
              <div key={i} style={{
                background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '18px',
                minHeight: '180px', position: 'relative', borderTop: `2px solid ${card.color}`
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.2em', color: '#6b7e6b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {card.title}
                </div>
                {card.temp && (
                  <>
                    <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: card.color, margin: '4px 0 6px' }}>
                      {card.temp}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7e6b' }}>Humidity: <strong style={{ color: '#22d3ee' }}>{card.humidity}</strong></div>
                  </>
                )}
                {card.status && (
                  <>
                    <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: card.status === 'OFF' ? '#f97316' : '#4ade80', margin: '4px 0 6px' }}>
                      {card.status}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7e6b' }}>{card.reason}</div>
                  </>
                )}
                {card.level && (
                  <>
                    <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: '#f97316', margin: '4px 0 6px' }}>
                      {card.level}
                    </div>
                    <div style={{ fontSize: '10px', color: '#f59e0b' }}>{card.condition}</div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '12px', fontFamily: 'monospace', fontSize: '9px', color: '#6b7e6b', letterSpacing: '0.1em', marginTop: '20px', borderTop: '1px solid #1e2e1e' }}>
            GreenBlock / AgriBlock — Demo Mode — Connect IoT hardware for live data
          </div>
        </div>
      )}
    </div>
  )
}
