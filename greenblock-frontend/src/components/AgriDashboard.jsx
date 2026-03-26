import { useEffect, useState } from 'react'
import { getAgriRecommendation } from '../utils/api'

export default function AgriDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getAgriRecommendation().then((res) => setData(res.data)).catch(() => setData(null))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Agri Dashboard</h3>
      {data ? (
        <>
          <p className="text-slate-300 text-sm">Crop: {data.crop}</p>
          <p className="text-slate-300 text-sm">Risk: {data.risk}</p>
          <p className="text-slate-400 text-sm mt-1">{data.recommendation}</p>
        </>
      ) : (
        <p className="text-slate-400 text-sm">Agri data unavailable.</p>
      )}
    </div>
  )
}
