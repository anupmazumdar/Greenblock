import { useEffect, useState } from 'react'
import { getAnomalies } from '../utils/api'

export default function AnomalyAlert() {
  const [items, setItems] = useState([])

  useEffect(() => {
    getAnomalies().then((res) => setItems(res.data.data || [])).catch(() => setItems([]))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Recent Anomalies</h3>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm">No anomalies found.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-300">{item.severity.toUpperCase()}: {item.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
