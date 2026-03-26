import { useEffect, useState } from 'react'
import { getVisitorCount } from '../utils/api'

export default function VisitorCounter() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getVisitorCount().then((res) => setData(res.data)).catch(() => setData(null))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Visitor Counter</h3>
      {data ? (
        <>
          <p className="text-green-400">Today: {data.today.count}</p>
          <p className="text-slate-400 text-sm">Peak hour: {data.peak_hour}</p>
        </>
      ) : (
        <p className="text-slate-400 text-sm">Visitor data unavailable.</p>
      )}
    </div>
  )
}
