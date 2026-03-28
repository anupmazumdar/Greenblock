import { useEffect, useMemo, useState } from 'react'
import { getSensors } from '../utils/api'

const TOOL_OPTIONS = [
  'Vermicompost',
  'Organic Spray',
  'Drip Irrigation',
  'Pest Trap',
  'Compost Bin',
  'Organic Fertilizer',
  'Other'
]

const FALLBACK_SENSOR = {
  temp: 27.2,
  humidity: 63,
  soil: 38
}

const callAI = async (prompt) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://greenblock.anupmazumdar.me',
      'X-OpenRouter-Title': 'GreenBlock AgriAI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }]
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
};

export default function AgriAIDashboard() {
  const [goal, setGoal] = useState(TOOL_OPTIONS[0])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsError, setMaterialsError] = useState('')
  const [materialsNotes, setMaterialsNotes] = useState('')
  const [materialItems, setMaterialItems] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState({})

  const [recipeLoading, setRecipeLoading] = useState(false)
  const [recipeError, setRecipeError] = useState('')
  const [recipeResponse, setRecipeResponse] = useState('')
  const [copyStatus, setCopyStatus] = useState('')

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
      const answer = await callAI(prompt)
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

  const parseChecklistItems = (text) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const parsed = lines
      .filter((line) => /^[\-\*\u2022]|^\d+[\.)]/.test(line))
      .map((line) => line.replace(/^[\-\*\u2022]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim())
      .filter((line) => line.length > 0)

    if (parsed.length > 0) return parsed

    return lines
      .filter((line) => !line.endsWith(':'))
      .slice(0, 12)
  }

  const askMaterialsFromAI = async () => {
    setMaterialsLoading(true)
    setMaterialsError('')
    setMaterialsNotes('')
    setRecipeResponse('')
    setRecipeError('')
    setCopyStatus('')

    try {
      const prompt = `User wants to make: ${goal}\nList the materials needed in two categories:\n1. Primary materials (must have)\n2. Alternative/substitute materials (if primary not available)\nKeep it very simple, desi, low cost, village-friendly. Respond in Hinglish.`
      const answer = await callAI(prompt)
      const items = parseChecklistItems(answer)

      if (items.length === 0) {
        throw new Error('AI ne checklist items return nahi kiye. Dobara try karo.')
      }

      const deduped = [...new Set(items)]
      setMaterialItems(deduped)
      setSelectedMaterials(Object.fromEntries(deduped.map((item) => [item, false])))
      setMaterialsNotes(answer)
    } catch (error) {
      setMaterialsError(error.message || 'Materials list fetch nahi ho payi')
      setMaterialItems([])
      setSelectedMaterials({})
    } finally {
      setMaterialsLoading(false)
    }
  }

  const toggleMaterial = (item) => {
    setSelectedMaterials((prev) => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const buildFinalJugaad = async () => {
    const available = materialItems.filter((item) => selectedMaterials[item])
    const missing = materialItems.filter((item) => !selectedMaterials[item])

    if (available.length === 0) {
      setRecipeError('Kam se kam ek available material select karo.')
      return
    }

    setRecipeLoading(true)
    setRecipeError('')
    setRecipeResponse('')
    setCopyStatus('')

    try {
      const prompt = `User wants to make: ${goal}\nAvailable materials: ${available.join(', ')}\nMissing materials: ${missing.join(', ') || 'None'}\n\nGive step-by-step jugaad solution using ONLY available materials.\nSuggest cheap alternatives for missing items.\nKeep it organic, natural, practical. Respond in Hinglish.`
      const answer = await callAI(prompt)
      setRecipeResponse(answer)
    } catch (error) {
      setRecipeError(error.message || 'Final jugaad recipe generate nahi ho paya')
    } finally {
      setRecipeLoading(false)
    }
  }

  const availableCount = materialItems.filter((item) => selectedMaterials[item]).length
  const notAvailableCount = materialItems.length - availableCount
  const currentStep = recipeResponse
    ? 3
    : materialItems.length > 0
      ? 2
      : 1

  const copyRecipe = async () => {
    if (!recipeResponse) return
    try {
      await navigator.clipboard.writeText(recipeResponse)
      setCopyStatus('Recipe copied ✅')
    } catch {
      setCopyStatus('Copy failed ❌')
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Agri Dashboard</h1>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="text-xl font-semibold text-white">Desi Jugaad Toolkit 🔧</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={[
                'rounded-lg border px-3 py-2 text-xs font-semibold',
                currentStep >= step
                  ? 'border-emerald-500/60 bg-emerald-900/30 text-emerald-200'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400'
              ].join(' ')}
            >
              Step {step} {currentStep === step ? '• Active' : currentStep > step ? '• Done' : ''}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-300">Step 1: Goal Selection</h3>
          <label className="mb-1 block text-sm text-slate-300">Kya banana chahte hain?</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400"
          >
            {TOOL_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={askMaterialsFromAI}
            disabled={materialsLoading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          >
            {materialsLoading ? 'Materials list aa rahi hai...' : 'AI se Materials Puchho 🤖'}
          </button>
          {materialsError && <p className="text-sm text-rose-300">{materialsError}</p>}
        </div>

        {materialItems.length > 0 && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300">Step 2: Material Confirmation</h3>
            <div className="space-y-2">
              {materialItems.map((item) => {
                const checked = Boolean(selectedMaterials[item])
                return (
                  <label key={item} className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMaterial(item)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      {item}
                    </span>
                    <span className={checked ? 'text-emerald-300' : 'text-rose-300'}>
                      {checked ? 'Available ✅' : 'Not Available ❌'}
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <span>Available: <span className="font-semibold text-emerald-300">{availableCount}</span></span>
              <span>Not Available: <span className="font-semibold text-rose-300">{notAvailableCount}</span></span>
            </div>

            <button
              type="button"
              onClick={buildFinalJugaad}
              disabled={recipeLoading}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {recipeLoading ? 'Final recipe ban rahi hai...' : 'Jugaad Banao! 🔧'}
            </button>
            {recipeError && <p className="text-sm text-rose-300">{recipeError}</p>}
          </div>
        )}

        {recipeResponse && (
          <div className="rounded-lg border border-emerald-500/60 bg-emerald-900/20 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-emerald-300">Step 3: Final Jugaad Recipe</h3>
              <button
                type="button"
                onClick={copyRecipe}
                className="rounded-md border border-emerald-500/50 bg-emerald-950/40 px-2 py-1 text-xs font-semibold text-emerald-200"
              >
                Copy Recipe
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-100">{recipeResponse}</pre>
            {copyStatus && <p className="mt-2 text-xs text-emerald-200">{copyStatus}</p>}
          </div>
        )}

        {materialsNotes && (
          <details className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-300">AI raw material notes</summary>
            <pre className="mt-2 whitespace-pre-wrap">{materialsNotes}</pre>
          </details>
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
