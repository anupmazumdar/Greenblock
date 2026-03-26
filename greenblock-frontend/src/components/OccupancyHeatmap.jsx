import { useEffect, useState } from 'react'
import { getOccupancyHeatmap } from '../utils/api'

export default function OccupancyHeatmap() {
  const [heatmap, setHeatmap] = useState(null)

  useEffect(() => {
    getOccupancyHeatmap().then((res) => setHeatmap(res.data)).catch(() => setHeatmap(null))
  }, [])

  if (!heatmap) return <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">Heatmap unavailable.</div>

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Occupancy Heatmap</h3>
      <p className="text-slate-400 text-sm">{heatmap.days.length} days × {heatmap.hours.length} hours</p>
    </div>
  )
}
