import { useEffect, useState } from 'react'
import { getAirQuality } from '../utils/api'

export default function AirQualityCard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getAirQuality().then((res) => setData(res.data)).catch(() => setData(null))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Air Quality</h3>
      {data ? (
        <p className="text-slate-300 text-sm">CO2: {data.co2_ppm} ppm · {data.recommendation}</p>
      ) : (
        <p className="text-slate-400 text-sm">Air quality data unavailable.</p>
      )}
    </div>
  )
}
