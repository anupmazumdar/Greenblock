import { useEffect, useMemo, useState } from 'react'
import { getSensors } from '../utils/api'

const TOOL_OPTIONS = [
  'Vermicompost',
  'Organic Spray',
  'Drip Irrigation',
  'Pest Trap',
  'Compost Bin',
  'Water Filter',
  'Other'
]

const FALLBACK_SENSOR = {
  temp: 27.2,
  humidity: 63,
  soil: 38
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map((part) => part?.text || '').join('\n').trim()
}

async function callGemini(promptText) {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY
  if (!key) {
    throw new Error('Gemini API key not found in VITE_GEMINI_API_KEY or VITE_GOOGLE_API_KEY')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 600
      }
    })
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || 'Gemini request failed'
    throw new Error(message)
  }

  const text = extractGeminiText(data)
  if (!text) {
    throw new Error('Empty response from Gemini')
  }

  return text
}

export default function AgriAIDashboard() {
  const [materials, setMaterials] = useState('')
  const [goal, setGoal] = useState(TOOL_OPTIONS[0])
  const [jugaadLoading, setJugaadLoading] = useState(false)
  const [jugaadError, setJugaadError] = useState('')
  const [jugaadResponse, setJugaadResponse] = useState('')

  const [sensor, setSensor] = useState(FALLBACK_SENSOR)
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const [advisorError, setAdvisorError] = useState('')
  const [advisorResponse, setAdvisorResponse] = useState('')

  const soilMoisture = useMemo(() => {
    if (Number.isFinite(Number(sensor.soil))) {
      return Number(sensor.soil)
    }
    return Number((Number(sensor.humidity || 0) * 0.6).toFixed(1))
  }, [sensor.soil, sensor.humidity])

  const runFarmAdvisor = async (nextSensor) => {
    setAdvisorLoading(true)
    setAdvisorError('')

    try {
      const nextSoilMoisture = Number.isFinite(Number(nextSensor.soil))
        ? Number(nextSensor.soil)
        : Number((Number(nextSensor.humidity || 0) * 0.6).toFixed(1))

      const prompt = `Current farm sensor snapshot:\nTemperature: ${nextSensor.temp} C\nHumidity: ${nextSensor.humidity}%\nSoil moisture: ${nextSoilMoisture}%\n\nGive AI-based practical recommendations in Hindi/Hinglish for:\n1. Irrigation timing\n2. Crop health action\n3. Pest prevention\n4. One low-budget next step for today\nKeep it concise and village-friendly.`
      const answer = await callGemini(prompt)
      setAdvisorResponse(answer)
    } catch (error) {
      setAdvisorError(error.message || 'Farm advisor unavailable right now')
      setAdvisorResponse('Pani subah jaldi do, shaam me patte check karo, aur neem based spray ready rakho for low-cost crop protection.')
    } finally {
      setAdvisorLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      let snapshot = FALLBACK_SENSOR
      try {
        const res = await getSensors()
        const data = res?.data || {}
        snapshot = {
          temp: Number.isFinite(Number(data.temp)) ? Number(data.temp) : FALLBACK_SENSOR.temp,
          humidity: Number.isFinite(Number(data.humidity)) ? Number(data.humidity) : FALLBACK_SENSOR.humidity,
          soil: Number.isFinite(Number(data.soil)) ? Number(data.soil) : Number((Number(data.humidity || FALLBACK_SENSOR.humidity) * 0.6).toFixed(1))
        }
      } catch {
        snapshot = FALLBACK_SENSOR
      }

      if (!cancelled) {
        setSensor(snapshot)
        await runFarmAdvisor(snapshot)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmitJugaad = async (event) => {
    event.preventDefault()
    if (!materials.trim()) {
      setJugaadError('Please describe available materials first.')
      return
    }

    setJugaadLoading(true)
    setJugaadError('')
    setJugaadResponse('')

    try {
      const prompt = `User has these materials: ${materials}\nThey want to make: ${goal}\nGive practical desi jugaad solution in Hindi/Hinglish with:\n1. Step by step instructions\n2. Cost estimate (very low budget)\n3. Tips for organic/natural alternatives\nKeep response practical and village-friendly.`
      const answer = await callGemini(prompt)
      setJugaadResponse(answer)
    } catch (error) {
      setJugaadError(error.message || 'Unable to get jugaad ideas right now')
    } finally {
      setJugaadLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Agri Dashboard</h1>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="text-xl font-semibold text-white">1. Desi Jugaad Toolkit</h2>
        <form onSubmit={onSubmitJugaad} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Mere paas kya hai?</label>
            <input
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. purani balti, pipe, bottle, jute bag"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Kya banana chahte ho?</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400"
            >
              {TOOL_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={jugaadLoading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          >
            {jugaadLoading ? 'Soch raha hoon...' : 'Jugaad Dhundho 🔧'}
          </button>
        </form>

        {jugaadError && (
          <p className="text-sm text-rose-300">{jugaadError}</p>
        )}

        {jugaadResponse && (
          <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/20 p-4">
            <h3 className="mb-2 text-sm font-semibold text-emerald-300">AI Jugaad Suggestion</h3>
            <pre className="whitespace-pre-wrap text-sm text-slate-100">{jugaadResponse}</pre>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="text-xl font-semibold text-white">2. AI Farm Advisor</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-slate-700 p-3">
            <p className="text-xs text-slate-400">Temperature</p>
            <p className="text-xl font-bold text-orange-400">{Number(sensor.temp).toFixed(1)} C</p>
          </div>
          <div className="rounded-lg bg-slate-700 p-3">
            <p className="text-xs text-slate-400">Humidity</p>
            <p className="text-xl font-bold text-blue-400">{Number(sensor.humidity).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg bg-slate-700 p-3">
            <p className="text-xs text-slate-400">Soil</p>
            <p className="text-xl font-bold text-emerald-400">{Number(soilMoisture).toFixed(0)}%</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => runFarmAdvisor(sensor)}
          disabled={advisorLoading}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {advisorLoading ? 'AI analyze kar raha hai...' : 'Refresh AI Advice'}
        </button>

        {advisorError && (
          <p className="text-sm text-amber-300">{advisorError}</p>
        )}

        {advisorResponse && (
          <div className="rounded-lg border border-blue-600/40 bg-blue-900/20 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-300">Farming Recommendation</h3>
            <pre className="whitespace-pre-wrap text-sm text-slate-100">{advisorResponse}</pre>
          </div>
        )}
      </div>
    </section>
  )
}
