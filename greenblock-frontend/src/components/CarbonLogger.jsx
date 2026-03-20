import { useEffect, useState } from 'react'
import { getMaterials, logMaterial, getCarbonSummary } from '../utils/api'

export default function CarbonLogger() {
  const [materials, setMaterials] = useState([])
  const [selected, setSelected] = useState('')
  const [quantity, setQuantity] = useState('')
  const [summary, setSummary] = useState(null)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    getMaterials().then(res => {
      setMaterials(res.data.materials)
      setSelected(res.data.materials[0]?.name || '')
    })
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const res = await getCarbonSummary()
      setSummary(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleLog = async () => {
    if (!selected || !quantity || isNaN(quantity) || Number(quantity) <= 0) {
      setMessage({ type: 'error', text: 'Please select a material and enter a valid quantity.' })
      return
    }
    setLoading(true)
    try {
      const res = await logMaterial({ material_name: selected, quantity_kg: Number(quantity) })
      const entry = res.data.entry
      setLog(prev => [entry, ...prev])
      setQuantity('')
      setMessage({ type: 'success', text: `Logged ${entry.quantity_kg}kg of ${entry.material_name} — ${entry.total_kgco2} kgCO₂` })
      fetchSummary()
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to log material.' })
    }
    setLoading(false)
  }

  const percent = summary?.percent_of_benchmark ?? 0
  const barColor = percent < 50 ? 'bg-green-500' : percent < 80 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🏗️ Carbon Material Logger</h1>

      {/* Input Form */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-slate-400 text-sm mb-1 block">Material</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-green-500"
            >
              {materials.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name} — {m.kgco2_per_kg} kgCO₂/kg
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Quantity (kg)</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <button
          onClick={handleLog}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging...' : '+ Log Material'}
        </button>

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3">
          <h2 className="text-white font-semibold">📊 Carbon Summary</h2>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Total: <span className="text-white font-bold">{summary.total_kgco2} kgCO₂</span></span>
            <span>Benchmark: <span className="text-white font-bold">{summary.benchmark_kgco2.toLocaleString()} kgCO₂</span></span>
            <span className={percent < 80 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{summary.status}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`${barColor} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs">{percent}% of benchmark used</p>

          {/* Suggestions */}
          {summary.top_suggestions?.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-slate-400 text-sm font-medium">💡 Green Suggestions</p>
              {summary.top_suggestions.map((s, i) => (
                <div key={i} className="bg-slate-700 rounded-lg px-4 py-2 text-sm">
                  <span className="text-white">Switch <span className="text-red-400">{s.material}</span> → <span className="text-green-400">{s.switch_to}</span></span>
                  <span className="text-slate-400 ml-2">saves {s.co2_saving_kg} kgCO₂</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Table */}
      {log.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 className="text-white font-semibold mb-3">📋 Session Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Qty (kg)</th>
                  <th className="pb-2">kgCO₂</th>
                  <th className="pb-2">Alternative</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry, i) => (
                  <tr key={i} className="border-b border-slate-700 text-slate-300">
                    <td className="py-2">{entry.material_name}</td>
                    <td className="py-2">{entry.quantity_kg}</td>
                    <td className="py-2 text-orange-400">{entry.total_kgco2}</td>
                    <td className="py-2 text-green-400">{entry.alternative ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}