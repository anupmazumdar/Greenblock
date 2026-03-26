import { useEffect, useMemo, useState } from 'react'
import {
  getAgriRecommendation,
  getAgriIrrigationStatus,
  getAgriDiseaseRisk,
  getAgriTankLevel,
  setAgriCrop,
  getSensors
} from '../utils/api'

const DUMMY = {
  recommendation: {
    crop: 'wheat',
    risk: 'medium',
    recommendation: 'Humidity high. Evening me neem spray recommended.'
  },
  irrigation: {
    pump: 'OFF',
    reason: 'Rain detected ya humidity enough hai.'
  },
  disease: {
    risk: 'high',
    condition: 'Humidity 80%+ and temperature fungal band me.',
    remedy: 'Neem oil 5ml + 1L paani + 2 drops liquid soap'
  },
  tank: {
    distance_cm: 42,
    status: 'ok'
  },
  climate: {
    temp: 27.4,
    humidity: 74,
    co2_raw: 390,
    rain: 0,
    solar_mw: 640,
    pir: 0
  }
}

function badgeClass(level) {
  const v = String(level || '').toLowerCase()
  if (v === 'high') return 'bg-red-500/20 text-red-300 border-red-500/40'
  if (v === 'medium') return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
}

function pumpClass(pump) {
  return String(pump || '').toUpperCase() === 'ON'
    ? 'text-emerald-400'
    : 'text-rose-400'
}

export default function AgriDashboard() {
  const [loading, setLoading] = useState(true)
  const [cropInput, setCropInput] = useState('wheat')
  const [savingCrop, setSavingCrop] = useState(false)

  const [recommendation, setRecommendation] = useState(DUMMY.recommendation)
  const [irrigation, setIrrigation] = useState(DUMMY.irrigation)
  const [disease, setDisease] = useState(DUMMY.disease)
  const [tank, setTank] = useState(DUMMY.tank)
  const [climate, setClimate] = useState(DUMMY.climate)

  const loadAll = async () => {
    const results = await Promise.allSettled([
      getAgriRecommendation(),
      getAgriIrrigationStatus(),
      getAgriDiseaseRisk(),
      getAgriTankLevel(),
      getSensors()
    ])

    const r0 = results[0].status === 'fulfilled' ? results[0].value.data : DUMMY.recommendation
    const r1 = results[1].status === 'fulfilled' ? results[1].value.data : DUMMY.irrigation
    const r2 = results[2].status === 'fulfilled' ? results[2].value.data : DUMMY.disease
    const r3 = results[3].status === 'fulfilled' ? results[3].value.data : DUMMY.tank
    const r4 = results[4].status === 'fulfilled' ? results[4].value.data : DUMMY.climate

    setRecommendation({
      crop: r0.crop || DUMMY.recommendation.crop,
      risk: r0.risk || DUMMY.recommendation.risk,
      recommendation: r0.recommendation || DUMMY.recommendation.recommendation
    })
    setIrrigation({
      pump: r1.pump || DUMMY.irrigation.pump,
      reason: r1.reason || DUMMY.irrigation.reason
    })
    setDisease({
      risk: r2.risk || DUMMY.disease.risk,
      condition: r2.condition || DUMMY.disease.condition,
      remedy: r2.remedy || DUMMY.disease.remedy
    })
    setTank({
      distance_cm: Number.isFinite(Number(r3.distance_cm)) ? Number(r3.distance_cm) : DUMMY.tank.distance_cm,
      status: r3.status || DUMMY.tank.status
    })
    setClimate({
      temp: Number.isFinite(Number(r4.temp)) ? Number(r4.temp) : DUMMY.climate.temp,
      humidity: Number.isFinite(Number(r4.humidity)) ? Number(r4.humidity) : DUMMY.climate.humidity,
      co2_raw: Number.isFinite(Number(r4.co2_raw)) ? Number(r4.co2_raw) : DUMMY.climate.co2_raw,
      rain: Number.isFinite(Number(r4.rain)) ? Number(r4.rain) : DUMMY.climate.rain,
      solar_mw: Number.isFinite(Number(r4.solar_mw)) ? Number(r4.solar_mw) : DUMMY.climate.solar_mw,
      pir: Number.isFinite(Number(r4.pir)) ? Number(r4.pir) : DUMMY.climate.pir
    })

    setCropInput(r0.crop || DUMMY.recommendation.crop)
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const timer = setInterval(loadAll, 10000)
    return () => clearInterval(timer)
  }, [])

  const estimatedCo2Ppm = useMemo(() => {
    return Math.max(420, 400 + Math.round(Number(climate.co2_raw || 0) * 2))
  }, [climate.co2_raw])

  const intrusionRisk = useMemo(() => {
    const hour = new Date().getHours()
    const isNight = hour >= 20 || hour <= 6
    return isNight && Number(climate.pir) === 1
  }, [climate.pir])

  const tankState = useMemo(() => {
    if (tank.distance_cm > 80) return 'LOW'
    if (tank.distance_cm > 55) return 'MEDIUM'
    return 'GOOD'
  }, [tank.distance_cm])

  const ventilationText = estimatedCo2Ppm > 1200
    ? 'CO2 high. Exhaust / vent ON suggested.'
    : 'CO2 safe range. Ventilation normal.'

  const solarWindowText = Number(climate.solar_mw) > 500
    ? 'Solar peak active. Pump ko solar window me run karo.'
    : 'Solar low hai. Pump schedule optimize karo.'

  const saveCrop = async () => {
    if (!cropInput.trim()) return
    setSavingCrop(true)
    try {
      const res = await setAgriCrop(cropInput.trim())
      setRecommendation((prev) => ({ ...prev, crop: res.data.crop || cropInput.trim() }))
    } catch {
      setRecommendation((prev) => ({ ...prev, crop: cropInput.trim().toLowerCase() }))
    } finally {
      setSavingCrop(false)
    }
  }

  return (
    <section className='space-y-4'>
      <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
        <h2 className='text-xl font-bold text-white'>AgriBlock Control Center</h2>
        <p className='text-sm text-slate-300 mt-1'>
          Smart Irrigation, Disease Alerts, Intrusion Monitoring, CO2 Ventilation, Tank Level, Organic Spray Guide.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Greenhouse Climate</h3>
          <p className='text-slate-300 text-sm mt-2'>Temp: {Number(climate.temp).toFixed(1)} deg C</p>
          <p className='text-slate-300 text-sm'>Humidity: {Number(climate.humidity).toFixed(0)}%</p>
          <p className='text-slate-300 text-sm'>Rain: {Number(climate.rain) === 1 ? 'Detected' : 'No Rain'}</p>
          <p className='text-slate-400 text-sm mt-2'>{solarWindowText}</p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Smart Irrigation</h3>
          <p className={'text-sm mt-2 font-semibold ' + pumpClass(irrigation.pump)}>
            Pump: {String(irrigation.pump || 'OFF').toUpperCase()}
          </p>
          <p className='text-slate-300 text-sm'>{irrigation.reason}</p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Disease Risk</h3>
          <span className={'inline-block mt-2 rounded-lg border px-2 py-1 text-xs ' + badgeClass(disease.risk)}>
            {String(disease.risk || 'medium').toUpperCase()}
          </span>
          <p className='text-slate-300 text-sm mt-2'>{disease.condition}</p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Organic Spray Guide</h3>
          <p className='text-slate-300 text-sm mt-2'>{disease.remedy}</p>
          <p className='text-slate-400 text-sm mt-2'>Best spray time: Shaam 5-7 baje</p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>CO2 / Ventilation</h3>
          <p className='text-slate-300 text-sm mt-2'>Estimated CO2: {estimatedCo2Ppm} ppm</p>
          <p className='text-slate-400 text-sm mt-1'>{ventilationText}</p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Intrusion Alert</h3>
          <p className={'text-sm mt-2 font-semibold ' + (intrusionRisk ? 'text-rose-400' : 'text-emerald-400')}>
            {intrusionRisk ? 'Night Motion Detected' : 'No Intrusion'}
          </p>
          <p className='text-slate-400 text-sm mt-1'>
            PIR: {Number(climate.pir) === 1 ? 'Motion' : 'Idle'}
          </p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Water Tank Level</h3>
          <p className='text-slate-300 text-sm mt-2'>Distance: {tank.distance_cm} cm</p>
          <p className={'text-sm font-semibold mt-1 ' + (tankState === 'LOW' ? 'text-rose-400' : 'text-emerald-400')}>
            Status: {tankState}
          </p>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>Active Crop</h3>
          <p className='text-slate-300 text-sm mt-2'>Current: {recommendation.crop}</p>
          <div className='mt-3 flex gap-2'>
            <input
              value={cropInput}
              onChange={(e) => setCropInput(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400'
              placeholder='e.g. wheat, rice, tomato'
            />
            <button
              type='button'
              onClick={saveCrop}
              disabled={savingCrop}
              className='rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60'
            >
              {savingCrop ? 'Saving' : 'Set'}
            </button>
          </div>
        </div>

        <div className='rounded-xl border border-slate-700 bg-slate-800 p-4'>
          <h3 className='text-white font-semibold'>AI Recommendation</h3>
          <span className={'inline-block mt-2 rounded-lg border px-2 py-1 text-xs ' + badgeClass(recommendation.risk)}>
            Risk: {String(recommendation.risk || 'medium').toUpperCase()}
          </span>
          <p className='text-slate-300 text-sm mt-2'>{recommendation.recommendation}</p>
        </div>
      </div>

      {loading && (
        <p className='text-slate-400 text-sm'>Loading Agri data...</p>
      )}
    </section>
  )
}
