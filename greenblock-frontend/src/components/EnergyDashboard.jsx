import WeatherSidebar from './WeatherSidebar'
import { useEffect, useState } from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getSensors, getSensorHistory } from '../utils/api'

const DEMO_DATA = {
  temperature: 24.5,
  humidity: 62,
  solarVoltage: 4.2,
  solarPower: 180,
  relay: 'ON',
  occupancy: 'Occupied'
}

function isAllZeroSensorValues(data) {
  if (!data || typeof data !== 'object') return false

  const temp = Number(data.temp ?? 0)
  const humidity = Number(data.humidity ?? 0)
  const solarVoltage = Number(data.solar_v ?? 0)
  const solarPower = Number(data.solar_mw ?? 0)

  return temp === 0 && humidity === 0 && solarVoltage === 0 && solarPower === 0
}

function isAllZeroHistoryValues(items) {
  if (!Array.isArray(items) || items.length === 0) return false

  return items.every((d) => {
    const temp = Number(d?.temp ?? 0)
    const humidity = Number(d?.humidity ?? 0)
    const solar = Number(d?.solar_mw ?? 0)
    return temp === 0 && humidity === 0 && solar === 0
  })
}

function buildDemoSensorSnapshot() {
  return {
    temp: DEMO_DATA.temperature,
    humidity: DEMO_DATA.humidity,
    solar_v: DEMO_DATA.solarVoltage,
    solar_mw: DEMO_DATA.solarPower,
    relay: String(DEMO_DATA.relay).toUpperCase() === 'ON',
    occupancy: String(DEMO_DATA.occupancy).toLowerCase() === 'occupied',
    source: 'demo',
    timestamp: new Date().toISOString()
  }
}

function buildDemoHistory(points = 24) {
  const now = Date.now()
  return Array.from({ length: points }, (_, idx) => {
    const minutesBack = (points - 1 - idx) * 5
    const time = new Date(now - minutesBack * 60 * 1000)
    const wobble = Math.sin(idx / 3)

    return {
      time: time.toISOString().slice(11, 16),
      temp: Number((DEMO_DATA.temperature + wobble * 0.8).toFixed(1)),
      solar: Math.max(40, Math.round(DEMO_DATA.solarPower + wobble * 25)),
      humidity: Math.max(45, Math.round(DEMO_DATA.humidity - wobble * 5)),
    }
  })
}

function SensorCard({ label, value, unit, icon, color }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>
        {value ?? '—'}
        <span className="text-base font-normal text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  )
}

export default function EnergyDashboard() {
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])
  const [apiOnline, setApiOnline] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [latestLive, setLatestLive] = useState(false)

  const applyDemoMode = () => {
    setLatest(buildDemoSensorSnapshot())
    setHistory(buildDemoHistory())
    setApiOnline(false)
    setDemoMode(true)
    setLatestLive(false)
  }

  const fetchLatest = async () => {
    try {
      const res = await getSensors()

      if (res.__cacheMeta?.isCached || isAllZeroSensorValues(res.data)) {
        applyDemoMode()
        return
      }

      setLatest(res.data)
      setApiOnline(true)
      setDemoMode(false)
      setLatestLive(true)
    } catch (e) {
      console.error(e)
      applyDemoMode()
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await getSensorHistory()
      const raw = Array.isArray(res.data?.data) ? res.data.data.slice(-24) : []

      if (res.__cacheMeta?.isCached || isAllZeroHistoryValues(raw)) {
        // Keep cards on live data if available, only chart falls back.
        setHistory(buildDemoHistory())
        setApiOnline(false)
        if (!latestLive) {
          setDemoMode(true)
        }
        return
      }

      // Take last 24 points for charts (last 2 hours)
      const mapped = raw.map((d) => ({
        time: d.timestamp.slice(11, 16),
        temp: d.temp,
        solar: d.solar_mw,
        humidity: d.humidity,
      }))
      setHistory(mapped)
      if (latestLive) {
        setApiOnline(true)
        setDemoMode(false)
      }
    } catch (e) {
      console.error(e)
      setHistory(buildDemoHistory())
      if (!latestLive) {
        setApiOnline(false)
        setDemoMode(true)
      }
    }
  }

  useEffect(() => {
    fetchLatest()
    fetchHistory()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchLatest, 5000)
    return () => clearInterval(interval)
  }, [latestLive])

  const hasLatest = latest !== null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">⚡ Energy Dashboard</h1>
      {demoMode && (
        <div className="rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-2 text-sm text-amber-100">
          Demo Mode — Connect hardware for live data
        </div>
      )}

      {/* Sensor Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SensorCard label="Temperature" value={latest?.temp} unit="°C" icon="🌡️" color="text-orange-400" />
        <SensorCard label="Humidity" value={latest?.humidity} unit="%" icon="💧" color="text-blue-400" />
        <SensorCard label="Solar Voltage" value={latest?.solar_v} unit="V" icon="☀️" color="text-yellow-400" />
        <SensorCard label="Solar Power" value={latest?.solar_mw} unit="mW" icon="⚡" color="text-green-400" />
      </div>

      {/* Status Bar */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-6 text-sm">
        <span className="text-slate-400">
          API: <span className={apiOnline ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
            {apiOnline ? '🟢 Live' : '🟡 Offline (showing cached data if available)'}
          </span>
        </span>
        <span className="text-slate-400">
          Occupancy: <span className={!hasLatest ? 'text-slate-300 font-bold' : latest?.occupancy ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {!hasLatest ? '⚪ Unknown' : latest?.occupancy ? '🟢 Occupied' : '🔴 Vacant'}
          </span>
        </span>
        <span className="text-slate-400">
          Relay: <span className="text-white font-bold">{!hasLatest ? '—' : latest?.relay ? 'ON' : 'OFF'}</span>
        </span>
        <span className="text-slate-400">
          Source: <span className="text-white font-bold">{latest?.source ?? '—'}</span>
        </span>
        <span className="text-slate-400">
          Last update: <span className="text-white font-bold">{latest?.timestamp?.slice(11, 19) ?? '—'} UTC</span>
        </span>
      </div>

      {/* Temperature Chart */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-white font-semibold mb-4">🌡️ Temperature — Last 2 Hours</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }} />
            <Line type="monotone" dataKey="temp" stroke="#fb923c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Solar Chart */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-white font-semibold mb-4">☀️ Solar Input — Last 2 Hours</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }} />
            <Area type="monotone" dataKey="solar" stroke="#facc15" fill="#facc1520" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <WeatherSidebar />
    </div>
  )
}