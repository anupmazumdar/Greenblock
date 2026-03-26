import { useEffect, useState } from 'react'
import { getCarbonSavings } from '../utils/api'

export default function CarbonSavingsCard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getCarbonSavings().then((res) => setData(res.data)).catch(() => setData(null))
  }, [])

  if (!data) return <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">Carbon savings unavailable.</div>

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-1">
      <h3 className="text-white font-semibold">Carbon Savings</h3>
      <p className="text-green-400">{data.saved_kgco2} kgCO2 saved</p>
      <p className="text-slate-400 text-sm">Trees equivalent: {data.trees_equivalent}</p>
      <p className="text-slate-400 text-sm">Credit value: ₹{data.credit_value_inr}</p>
    </div>
  )
}
