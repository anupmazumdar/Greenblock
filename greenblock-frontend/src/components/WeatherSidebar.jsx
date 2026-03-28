import { useEffect, useState } from 'react'
import { getWeather } from '../utils/api'

export default function WeatherSidebar() {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getWeather()
      .then(res => {
        if (res.data.status === 'ok') {
          setWeather(res.data.data)
          setError(Boolean(res.__cacheMeta?.isCached))
        }
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])

  if (error && !weather) return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-slate-400 text-sm">
      🌤️ Weather unavailable — backend unreachable
    </div>
  )

  if (!weather) return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-slate-400 text-sm animate-pulse">
      Loading weather...
    </div>
  )

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3">
      <h2 className="text-white font-semibold">🌤️ Outdoor Weather — Jaipur</h2>
      {error && (
        <p className="text-xs text-yellow-300">Using cached weather data</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs mb-1">Temperature</p>
          <p className="text-orange-400 text-2xl font-bold">{weather.outdoor_temp}°C</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs mb-1">Humidity</p>
          <p className="text-blue-400 text-2xl font-bold">{weather.outdoor_humidity}%</p>
        </div>
      </div>
      <div className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
        <span className="text-slate-400 text-sm">Condition</span>
        <span className="text-white font-semibold capitalize">{weather.description}</span>
      </div>
      <div className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
        <span className="text-slate-400 text-sm">6hr Forecast</span>
        <span className="text-yellow-400 font-semibold">{weather.forecast_next_6hr}°C</span>
      </div>
    </div>
  )
}