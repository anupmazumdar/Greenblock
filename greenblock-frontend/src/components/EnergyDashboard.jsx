import WeatherSidebar from './WeatherSidebar'
import { useEffect, useState } from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getSensors, getSensorHistory } from '../utils/api'

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

  const fetchLatest = async () => {
    try {
      const res = await getSensors()
      setLatest(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await getSensorHistory()
      // Take last 24 points for charts (last 2 hours)
      const raw = res.data.data.slice(-24)
      setHistory(raw.map((d) => ({
        time: d.timestamp.slice(11, 16),
        temp: d.temp,
        solar: d.solar_mw,
        humidity: d.humidity,
      })))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLatest()
    fetchHistory()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchLatest, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">⚡ Energy Dashboard</h1>

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
          Occupancy: <span className={latest?.occupancy ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {latest?.occupancy ? '🟢 Occupied' : '🔴 Vacant'}
          </span>
        </span>
        <span className="text-slate-400">
          Relay: <span className="text-white font-bold">{latest?.relay ? 'ON' : 'OFF'}</span>
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