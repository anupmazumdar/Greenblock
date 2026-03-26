import { useEffect, useState } from 'react'
import { getGridDependency } from '../utils/api'

export default function GridDependencyDonut() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getGridDependency().then((res) => setData(res.data)).catch(() => setData(null))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Grid Dependency</h3>
      {data ? (
        <p className="text-slate-300 text-sm">
          Solar {data.today_mix_percent.solar}% · Battery {data.today_mix_percent.battery}% · Grid {data.today_mix_percent.grid}%
        </p>
      ) : (
        <p className="text-slate-400 text-sm">Grid mix unavailable.</p>
      )}
    </div>
  )
}
