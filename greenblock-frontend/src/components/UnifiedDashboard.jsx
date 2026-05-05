import { useEffect, useState } from 'react'
import { getWeather } from '../utils/api'
import GreenBlockDashboard from './GreenBlockDashboard'
import AgriBlockDashboard from './AgriBlockDashboard'
import TabNavigation from './TabNavigation'

export default function UnifiedDashboard({ mode = 'greenblock' }) {
  const [tab, setTab] = useState(mode === 'agriblock' ? 'agri' : 'green')
  const [weather, setWeather] = useState(null)

  // Fetch weather for AgriBlock sidebar
  useEffect(() => {
    getWeather()
      .then(res => {
        if (res.data?.status === 'ok') setWeather(res.data.data)
      })
      .catch(() => {})
  }, [])

  const switchTab = (t) => setTab(t)

  const MAIN_TABS = [
    { id: 'green', label: 'GreenBlock', subtitle: 'Energy & Environment' },
    { id: 'agri', label: 'AgriBlock', subtitle: 'Control Center' }
  ]

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

      {/* MAIN TABS */}
      <TabNavigation
        tabs={MAIN_TABS}
        activeTab={tab}
        onTabChange={switchTab}
      />

      {/* PAGE: GREEN BLOCK */}
      {tab === 'green' && (
        <div style={{ padding: '24px' }}>
          <GreenBlockDashboard />
        </div>
      )}

      {/* PAGE: AGRI BLOCK */}
      {tab === 'agri' && (
        <div style={{ padding: '24px' }}>
          <AgriBlockDashboard />
        </div>
      )}
    </div>
  )
}
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
