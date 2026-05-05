/**
 * ControlCenterSection Component
 * AgriBlock Control Center with all monitoring and control cards
 */
import { useEffect, useMemo, useState } from 'react'
import {
  getAgriRecommendation,
  getAgriIrrigationStatus,
  getAgriDiseaseRisk,
  getAgriTankLevel,
  setAgriCrop,
  getSensors
} from '../../utils/api'

const DUMMY = {
  recommendation: { crop: 'wheat', risk: 'medium', recommendation: 'Humidity high. Evening me neem spray recommended.' },
  irrigation: { pump: 'OFF', reason: 'Rain detected ya humidity enough hai.' },
  disease: { risk: 'high', condition: 'Humidity 80%+ and temperature fungal band me.', remedy: 'Neem oil 5ml + 1L paani + 2 drops liquid soap' },
  tank: { distance_cm: 42, status: 'ok' },
  climate: { temp: 27.4, humidity: 74, co2_raw: 390, rain: 0, solar_mw: 640, pir: 0 }
}

export default function ControlCenterSection() {
  const [loading, setLoading] = useState(true)
  const [cropInput, setCropInput] = useState('wheat')
  const [savingCrop, setSavingCrop] = useState(false)

  const [recommendation, setRecommendation] = useState(DUMMY.recommendation)
  const [irrigation, setIrrigation] = useState(DUMMY.irrigation)
  const [disease, setDisease] = useState(DUMMY.disease)
  const [tank, setTank] = useState(DUMMY.tank)
  const [climate, setClimate] = useState(DUMMY.climate)

  const loadAll = async () => {
    const results = await Promise.allSettled([
      getAgriRecommendation(),
      getAgriIrrigationStatus(),
      getAgriDiseaseRisk(),
      getAgriTankLevel(),
      getSensors()
    ])

    const r0 = results[0].status === 'fulfilled' ? results[0].value.data : DUMMY.recommendation
    const r1 = results[1].status === 'fulfilled' ? results[1].value.data : DUMMY.irrigation
    const r2 = results[2].status === 'fulfilled' ? results[2].value.data : DUMMY.disease
    const r3 = results[3].status === 'fulfilled' ? results[3].value.data : DUMMY.tank
    const r4 = results[4].status === 'fulfilled' ? results[4].value.data : DUMMY.climate

    setRecommendation({
      crop: r0.crop || DUMMY.recommendation.crop,
      risk: r0.risk || DUMMY.recommendation.risk,
      recommendation: r0.recommendation || DUMMY.recommendation.recommendation
    })
    setIrrigation({
      pump: r1.pump || DUMMY.irrigation.pump,
      reason: r1.reason || DUMMY.irrigation.reason
    })
    setDisease({
      risk: r2.risk || DUMMY.disease.risk,
      condition: r2.condition || DUMMY.disease.condition,
      remedy: r2.remedy || DUMMY.disease.remedy
    })
    setTank({
      distance_cm: Number.isFinite(Number(r3.distance_cm)) ? Number(r3.distance_cm) : DUMMY.tank.distance_cm,
      status: r3.status || DUMMY.tank.status
    })
    setClimate({
      temp: Number.isFinite(Number(r4.temp)) ? Number(r4.temp) : DUMMY.climate.temp,
      humidity: Number.isFinite(Number(r4.humidity)) ? Number(r4.humidity) : DUMMY.climate.humidity,
      co2_raw: Number.isFinite(Number(r4.co2_raw)) ? Number(r4.co2_raw) : DUMMY.climate.co2_raw,
      rain: Number.isFinite(Number(r4.rain)) ? Number(r4.rain) : DUMMY.climate.rain,
      solar_mw: Number.isFinite(Number(r4.solar_mw)) ? Number(r4.solar_mw) : DUMMY.climate.solar_mw,
      pir: Number.isFinite(Number(r4.pir)) ? Number(r4.pir) : DUMMY.climate.pir
    })

    setCropInput(r0.crop || DUMMY.recommendation.crop)
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const timer = setInterval(loadAll, 10000)
    return () => clearInterval(timer)
  }, [])

  const estimatedCo2Ppm = useMemo(() => {
    return Math.max(420, 400 + Math.round(Number(climate.co2_raw || 0) * 2))
  }, [climate.co2_raw])

  const intrusionRisk = useMemo(() => {
    const hour = new Date().getHours()
    const isNight = hour >= 20 || hour <= 6
    return isNight && Number(climate.pir) === 1
  }, [climate.pir])

  const tankState = useMemo(() => {
    if (tank.distance_cm > 80) return 'LOW'
    if (tank.distance_cm > 55) return 'MEDIUM'
    return 'GOOD'
  }, [tank.distance_cm])

  const ventilationText = estimatedCo2Ppm > 1200
    ? 'CO2 high. Exhaust / vent ON suggested.'
    : 'CO2 safe range. Ventilation normal.'

  const solarWindowText = Number(climate.solar_mw) > 500
    ? 'Solar peak active. Pump ko solar window me run karo.'
    : 'Solar low hai. Pump schedule optimize karo.'

  const saveCrop = async () => {
    if (!cropInput.trim()) return
    setSavingCrop(true)
    try {
      const res = await setAgriCrop(cropInput.trim())
      setRecommendation((prev) => ({ ...prev, crop: res.data.crop || cropInput.trim() }))
    } catch {
      setRecommendation((prev) => ({ ...prev, crop: cropInput.trim().toLowerCase() }))
    } finally {
      setSavingCrop(false)
    }
  }

  const getStatusColor = (status) => {
    if (status === 'high') return '#f97316'
    if (status === 'medium') return '#f59e0b'
    return '#4ade80'
  }

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
        Control Center — Live Modules
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      {/* 9 Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Card 1: Greenhouse Climate */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: '2px solid #22d3ee'
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Greenhouse Climate
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 700,
            color: '#f59e0b',
            marginBottom: '8px'
          }}>
            {Number(climate.temp).toFixed(1)}°C
          </div>
          <div style={{
            fontSize: '11px',
            color: '#c8d8c8',
            lineHeight: '1.6',
            marginBottom: '8px'
          }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#6b7e6b' }}>Humidity:</span> <strong style={{ color: '#22d3ee' }}>{Number(climate.humidity).toFixed(0)}%</strong>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#6b7e6b' }}>Rain:</span> <strong style={{ color: climate.rain === 1 ? '#f97316' : '#4ade80' }}>
                {Number(climate.rain) === 1 ? 'Detected' : 'No Rain'}
              </strong>
            </div>
          </div>
          <div style={{
            fontSize: '10px',
            color: '#94a394',
            fontStyle: 'italic',
            borderTop: '1px solid #1e2e1e',
            paddingTop: '8px'
          }}>
            {solarWindowText}
          </div>
        </div>

        {/* Card 2: Smart Irrigation */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: `2px solid ${String(irrigation.pump || 'OFF').toUpperCase() === 'ON' ? '#4ade80' : '#f97316'}`
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Smart Irrigation
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '28px',
            fontWeight: 700,
            color: String(irrigation.pump || 'OFF').toUpperCase() === 'ON' ? '#4ade80' : '#f97316',
            marginBottom: '8px'
          }}>
            {String(irrigation.pump || 'OFF').toUpperCase()}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#c8d8c8',
            marginBottom: '8px'
          }}>
            {irrigation.reason}
          </div>
          <button style={{
            marginTop: '12px',
            width: '100%',
            padding: '8px',
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
            Toggle Pump
          </button>
        </div>

        {/* Card 3: Disease Risk */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: `2px solid ${getStatusColor(disease.risk)}`
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Disease Risk
          </div>
          <div style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '4px',
            background: `${getStatusColor(disease.risk)}22`,
            color: getStatusColor(disease.risk),
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            {String(disease.risk || 'medium').toUpperCase()}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#c8d8c8',
            lineHeight: '1.6'
          }}>
            {disease.condition}
          </div>
        </div>

        {/* Card 4: Organic Spray Guide */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: '2px solid #f59e0b'
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Organic Spray Guide
          </div>
          <div style={{
            fontSize: '11px',
            color: '#c8d8c8',
            lineHeight: '1.6',
            marginBottom: '8px'
          }}>
            {disease.remedy}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#f59e0b',
            paddingTop: '8px',
            borderTop: '1px solid #1e2e1e'
          }}>
            <strong>Best spray time:</strong> Shaam 5-7 baje
          </div>
        </div>

        {/* Card 5: CO2 / Ventilation */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: '2px solid #4ade80'
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            CO₂ / Ventilation
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '32px',
            fontWeight: 700,
            color: '#4ade80',
            marginBottom: '8px'
          }}>
            {estimatedCo2Ppm}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#6b7e6b',
            marginBottom: '8px'
          }}>
            ppm
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94a394',
            borderTop: '1px solid #1e2e1e',
            paddingTop: '8px'
          }}>
            {ventilationText}
          </div>
        </div>

        {/* Card 6: Intrusion Alert */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: `2px solid ${intrusionRisk ? '#f97316' : '#4ade80'}`
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Intrusion Alert
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 700,
            color: intrusionRisk ? '#f97316' : '#4ade80',
            marginBottom: '8px'
          }}>
            {intrusionRisk ? '⚠ ALERT' : '✓ Safe'}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#c8d8c8',
            marginBottom: '8px'
          }}>
            {intrusionRisk ? 'Night Motion Detected' : 'No Intrusion'}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#6b7e6b',
            paddingTop: '8px',
            borderTop: '1px solid #1e2e1e'
          }}>
            PIR: {Number(climate.pir) === 1 ? 'Motion' : 'Idle'}
          </div>
        </div>

        {/* Card 7: Water Tank Level */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: `2px solid ${tankState === 'LOW' ? '#f97316' : tankState === 'MEDIUM' ? '#f59e0b' : '#4ade80'}`
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Water Tank Level
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '32px',
            fontWeight: 700,
            color: '#22d3ee',
            marginBottom: '8px'
          }}>
            {tank.distance_cm}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#6b7e6b',
            marginBottom: '8px'
          }}>
            cm
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: tankState === 'LOW' ? '#f97316' : tankState === 'MEDIUM' ? '#f59e0b' : '#4ade80',
            paddingTop: '8px',
            borderTop: '1px solid #1e2e1e'
          }}>
            Status: {tankState}
          </div>
        </div>

        {/* Card 8: Active Crop */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: '2px solid #22d3ee',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            Active Crop
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 700,
            color: '#22d3ee',
            marginBottom: '12px'
          }}>
            {recommendation.crop}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '8px'
            }}>
              <input
                value={cropInput}
                onChange={(e) => setCropInput(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #1e2e1e',
                  background: '#0a150a',
                  color: '#c8d8c8',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  outline: 'none'
                }}
                placeholder='e.g. wheat'
              />
              <button
                onClick={saveCrop}
                disabled={savingCrop}
                style={{
                  padding: '8px 12px',
                  background: savingCrop ? '#6b7e6b' : '#4ade80',
                  color: '#0a0f0a',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: savingCrop ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => !savingCrop && (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={e => !savingCrop && (e.currentTarget.style.opacity = '1')}
              >
                {savingCrop ? '...' : 'Set'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 9: AI Recommendation */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          minHeight: '200px',
          position: 'relative',
          borderTop: `2px solid ${getStatusColor(recommendation.risk)}`
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#6b7e6b',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            AI Recommendation
          </div>
          <div style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '4px',
            background: `${getStatusColor(recommendation.risk)}22`,
            color: getStatusColor(recommendation.risk),
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            Risk: {String(recommendation.risk || 'medium').toUpperCase()}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#c8d8c8',
            lineHeight: '1.6'
          }}>
            {recommendation.recommendation}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6b7e6b'
        }}>
          Loading Agri data...
        </div>
      )}

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
        AgriBlock Control Center — Real-time farm monitoring & control
      </div>
    </div>
  )
}
