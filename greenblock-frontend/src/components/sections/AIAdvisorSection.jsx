/**
 * AIAdvisorSection Component
 * Farm Advisor - AI-powered farming recommendations based on sensor data
 */
import { useEffect, useState } from 'react'

const API_BASE_URL = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '')
const SENSORS_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api/agri/sensors` : '/api/agri/sensors'
const ADVISOR_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api/agri/farm_advisor` : '/api/agri/farm_advisor'

let lastAdvisorCallAt = 0

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const FALLBACK_SENSOR = {
  temperature: 28.5,
  humidity: 72,
  soil_moisture: 64,
  sensor_timestamp: new Date().toISOString()
}

const callAI = async (goal, context = '') => {
  const now = Date.now()
  if (lastAdvisorCallAt && now - lastAdvisorCallAt < 2000) {
    await wait(2000)
  }

  const response = await fetch(ADVISOR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, context })
  })

  lastAdvisorCallAt = Date.now()

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_429')
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.detail || `Farm Advisor request failed (${response.status})`)
  }
  if (!data?.result) {
    throw new Error('Farm Advisor response invalid')
  }
  return data.result
}

const requestWithFailover = async (endpoints, fallback = null) => {
  if (!endpoints || endpoints.length === 0) return fallback

  let lastError = null

  for (const [url, options] of endpoints) {
    try {
      const response = await fetch(url, options)
      if (!response.ok && response.status !== 404) throw new Error(`${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
    }
  }

  return fallback
}

export default function AIAdvisorSection() {
  const [sensor, setSensor] = useState(FALLBACK_SENSOR)
  const [sensorLoading, setSensorLoading] = useState(true)
  const [sensorError, setSensorError] = useState('')

  const [advisorLoading, setAdvisorLoading] = useState(false)
  const [advisorError, setAdvisorError] = useState('')
  const [advisorResponse, setAdvisorResponse] = useState('')

  // Fetch sensor data on mount
  useEffect(() => {
    const fetchSensors = async () => {
      setSensorLoading(true)
      setSensorError('')
      try {
        const result = await requestWithFailover(
          [
            [SENSORS_ENDPOINT, { method: 'GET' }],
            ['http://192.168.1.2:3002/api/agri/sensors', { method: 'GET' }],
            ['http://localhost:5000/api/agri/sensors', { method: 'GET' }]
          ],
          FALLBACK_SENSOR
        )
        setSensor(result || FALLBACK_SENSOR)
      } catch (error) {
        setSensorError('Sensor data load nahi ho paya')
        setSensor(FALLBACK_SENSOR)
      } finally {
        setSensorLoading(false)
      }
    }

    fetchSensors()
  }, [])

  const runFarmAdvisor = async () => {
    if (sensorLoading) return

    setAdvisorLoading(true)
    setAdvisorError('')
    setAdvisorResponse('')

    try {
      const soilMoisture = sensor.soil_moisture || Math.round(sensor.humidity * 0.7)
      const context = `Current Farm Conditions:
- Temperature: ${sensor.temperature || 25}°C
- Humidity: ${sensor.humidity || 60}%
- Soil Moisture: ${soilMoisture}%

Please provide actionable farming advice in Hinglish for today's conditions.`

      const answer = await callAI('farm_advisor', context)
      setAdvisorResponse(answer)
    } catch (error) {
      const message = String(error?.message || '')
      if (message.includes('429') || message.includes('RATE_LIMIT_429')) {
        setAdvisorError('Bahut saare requests ho gaye, thodi der baad try karo 🙏')
      } else {
        setAdvisorError(message || 'Farm Advisor response nahi aya')
      }
    } finally {
      setAdvisorLoading(false)
    }
  }

  // Auto-load advisor on mount
  useEffect(() => {
    if (!sensorLoading) {
      const timer = setTimeout(() => {
        runFarmAdvisor()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [sensorLoading])

  const soilMoisture = sensor.soil_moisture || Math.round((sensor.humidity || 60) * 0.7)

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
        Farm Advisor — Real-time AI Recommendations
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      {/* Sensor Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Temperature Card */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '14px',
          textAlign: 'center',
          borderTop: '2px solid #f59e0b'
        }}>
          <div style={{
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#94a394',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            🌡️ Temperature
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#f59e0b',
            fontFamily: 'monospace'
          }}>
            {sensor.temperature || '25'}°
          </div>
          <div style={{
            fontSize: '9px',
            color: '#6b7e6b',
            fontFamily: 'monospace',
            marginTop: '4px'
          }}>
            Optimal: 25-30°C
          </div>
        </div>

        {/* Humidity Card */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '14px',
          textAlign: 'center',
          borderTop: '2px solid #22d3ee'
        }}>
          <div style={{
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#94a394',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            💧 Humidity
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#22d3ee',
            fontFamily: 'monospace'
          }}>
            {sensor.humidity || '60'}%
          </div>
          <div style={{
            fontSize: '9px',
            color: '#6b7e6b',
            fontFamily: 'monospace',
            marginTop: '4px'
          }}>
            Optimal: 60-80%
          </div>
        </div>

        {/* Soil Moisture Card */}
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '14px',
          textAlign: 'center',
          borderTop: '2px solid #4ade80'
        }}>
          <div style={{
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#94a394',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            🌱 Soil Moisture
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#4ade80',
            fontFamily: 'monospace'
          }}>
            {soilMoisture}%
          </div>
          <div style={{
            fontSize: '9px',
            color: '#6b7e6b',
            fontFamily: 'monospace',
            marginTop: '4px'
          }}>
            Optimal: 50-70%
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={runFarmAdvisor}
        disabled={advisorLoading || sensorLoading}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '4px',
          background: (advisorLoading || sensorLoading) ? '#6b7e6b' : '#52b788',
          color: '#0a0f0a',
          fontSize: '11px',
          fontWeight: 600,
          border: 'none',
          cursor: (advisorLoading || sensorLoading) ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace',
          marginBottom: '12px',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => !(advisorLoading || sensorLoading) && (e.currentTarget.style.opacity = '0.9')}
        onMouseOut={e => !(advisorLoading || sensorLoading) && (e.currentTarget.style.opacity = '1')}
      >
        {advisorLoading ? 'AI advice generate ho rahi hai...' : '🤖 Refresh AI Advice'}
      </button>

      {/* Advisor Response */}
      <div style={{
        background: '#111c11',
        border: '1px solid #1e2e1e',
        borderRadius: '6px',
        padding: '18px',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#52b788',
          marginBottom: '12px',
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          आज के लिए सलाह (Today's Recommendations)
        </h3>

        {sensorError && (
          <div style={{
            fontSize: '11px',
            color: '#f97316',
            fontFamily: 'monospace',
            marginBottom: '12px'
          }}>
            ⚠ {sensorError}
          </div>
        )}

        {advisorError && (
          <div style={{
            fontSize: '11px',
            color: '#f97316',
            fontFamily: 'monospace',
            marginBottom: '12px'
          }}>
            ⚠ {advisorError}
          </div>
        )}

        {advisorResponse && (
          <pre style={{
            background: '#0a150a',
            border: '1px solid #1e2e1e',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '11px',
            color: '#c8d8c8',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: 'monospace',
            lineHeight: '1.6'
          }}>
            {advisorResponse}
          </pre>
        )}

        {!advisorResponse && !advisorError && !advisorLoading && (
          <div style={{
            fontSize: '11px',
            color: '#94a394',
            fontFamily: 'monospace',
            fontStyle: 'italic'
          }}>
            Click "Refresh AI Advice" to get today's farming recommendations based on current conditions.
          </div>
        )}

        {advisorLoading && (
          <div style={{
            fontSize: '11px',
            color: '#52b788',
            fontFamily: 'monospace',
            fontStyle: 'italic'
          }}>
            Loading AI recommendations...
          </div>
        )}
      </div>

      {/* Footer */}
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
        Real-time sensor data • AI-powered insights • In Hindi/Hinglish
      </div>
    </div>
  )
}
