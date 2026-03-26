import { useEffect, useState } from 'react'
import { getEnergyScore } from '../utils/api'

export default function EnergyScoreCard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getEnergyScore().then((res) => setData(res.data)).catch(() => setData(null))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Energy Score</h3>
      {data ? (
        <>
          <p className="text-green-400">Grade {data.grade} ({data.score}/100)</p>
          <p className="text-slate-400 text-sm">Trend: {data.trend_30d.join(' → ')}</p>
        </>
      ) : (
        <p className="text-slate-400 text-sm">Score unavailable.</p>
      )}
    </div>
  )
}
