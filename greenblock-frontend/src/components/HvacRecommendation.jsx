import { useEffect, useState } from 'react'
import { getHvacRecommendation, getWeather } from '../utils/api'

function RuleCard({ rec }) {
  const priorityColor = {
    high: 'border-red-500 bg-red-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    low: 'border-blue-500 bg-blue-500/10',
  }

  return (
    <div className={`rounded-xl p-4 border ${priorityColor[rec.priority]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{rec.icon}</span>
        <div>
          <p className="text-white font-semibold">{rec.action}</p>
          <p className="text-slate-400 text-sm mt-1">{rec.detail}</p>
          <span className={`text-xs font-bold mt-2 inline-block uppercase tracking-wide ${
            rec.priority === 'high' ? 'text-red-400' :
            rec.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
          }`}>
            {rec.priority} priority · Rule {rec.rule}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HvacRecommendation() {
  const [data, setData] = useState(null)
  const [weather, setWeather] = useState(null)
  const [inputs, setInputs] = useState({
    indoor_temp: 27,
    indoor_humidity: 60,
    occupancy: 1,
  })
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const [hvacRes, weatherRes] = await Promise.all([
        getHvacRecommendation(inputs),
        getWeather(),
      ])
      setData(hvacRes.data)
      setWeather(weatherRes.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">❄️ HVAC Recommendation</h1>

      {/* Input Controls */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-white font-semibold mb-4">🎛️ Current Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Indoor Temp (°C)</label>
            <input
              type="number"
              value={inputs.indoor_temp}
              onChange={e => setInputs({ ...inputs, indoor_temp: Number(e.target.value) })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Indoor Humidity (%)</label>
            <input
              type="number"
              value={inputs.indoor_humidity}
              onChange={e => setInputs({ ...inputs, indoor_humidity: Number(e.target.value) })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Occupancy</label>
            <select
              value={inputs.occupancy}
              onChange={e => setInputs({ ...inputs, occupancy: Number(e.target.value) })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-green-500"
            >
              <option value={1}>🟢 Occupied</option>
              <option value={0}>🔴 Vacant</option>
            </select>
          </div>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="mt-4 bg-green-500 hover:bg-green-600 text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : '🔍 Get Recommendations'}
        </button>
      </div>

      {/* Weather Card */}
      {weather?.data && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 className="text-white font-semibold mb-3">🌤️ Outdoor Weather</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-slate-400">Temp: <span className="text-white font-bold">{weather.data.outdoor_temp}°C</span></span>
            <span className="text-slate-400">Humidity: <span className="text-white font-bold">{weather.data.outdoor_humidity}%</span></span>
            <span className="text-slate-400">Condition: <span className="text-white font-bold capitalize">{weather.data.description}</span></span>
            <span className="text-slate-400">6hr Forecast: <span className="text-white font-bold">{weather.data.forecast_next_6hr}°C</span></span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">
              📋 Active Rules
              <span className="ml-2 bg-green-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                {data.total_triggered} triggered
              </span>
            </h2>
            <span className="text-slate-400 text-xs">Source: {data.source}</span>
          </div>

          {data.recommendations.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center text-slate-400">
              ✅ All conditions normal. No HVAC action needed.
            </div>
          ) : (
            data.recommendations.map((rec, i) => <RuleCard key={i} rec={rec} />)
          )}
        </div>
      )}
    </div>
  )
}