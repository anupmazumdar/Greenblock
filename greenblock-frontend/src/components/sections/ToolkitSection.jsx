/**
 * ToolkitSection Component
 * Desi Jugaad Toolkit - 3-step AI-powered DIY farming solutions
 */
import { useEffect, useState } from 'react'

const TOOL_OPTIONS = [
  'Vermicompost',
  'Organic Spray',
  'Drip Irrigation',
  'Pest Trap',
  'Compost Bin',
  'Organic Fertilizer',
  'Other'
]

const API_BASE_URL = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '')
const JUGAAD_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api/agri/jugaad` : '/api/agri/jugaad'

let lastAICallAt = 0

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const RATE_LIMIT_MESSAGE = 'Bahut saare requests ho gaye, thodi der baad try karo 🙏'

const toUserAIError = (error) => {
  const message = String(error?.message || '')
  if (message.includes('429') || message.includes('RATE_LIMIT_429')) {
    return RATE_LIMIT_MESSAGE
  }
  return message || 'AI service abhi unavailable hai'
}

const callAI = async (selectedGoal, context = '') => {
  const now = Date.now()
  if (lastAICallAt && now - lastAICallAt < 2000) {
    await wait(2000)
  }

  const response = await fetch(JUGAAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal: selectedGoal, context })
  })

  lastAICallAt = Date.now()

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_429')
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.detail || `Agri AI request failed (${response.status})`)
  }
  if (!data?.result) {
    throw new Error('Agri AI response invalid')
  }
  return data.result
}

const parseChecklistItems = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const parsed = lines
    .filter((line) => /^[\-\*\u2022]|^\d+[\.)]/.test(line))
    .map((line) => line.replace(/^[\-\*\u2022]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim())
    .filter((line) => line.length > 0)
  if (parsed.length > 0) return parsed
  return lines.filter((line) => !line.endsWith(':')).slice(0, 12)
}

export default function ToolkitSection() {
  const [goal, setGoal] = useState(TOOL_OPTIONS[0])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsError, setMaterialsError] = useState('')
  const [materialItems, setMaterialItems] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState({})

  const [recipeLoading, setRecipeLoading] = useState(false)
  const [recipeError, setRecipeError] = useState('')
  const [recipeResponse, setRecipeResponse] = useState('')
  const [copyStatus, setCopyStatus] = useState('')

  const availableCount = materialItems.filter((item) => selectedMaterials[item]).length
  const notAvailableCount = materialItems.length - availableCount
  const currentStep = recipeResponse ? 3 : materialItems.length > 0 ? 2 : 1

  const askMaterialsFromAI = async () => {
    setMaterialsLoading(true)
    setMaterialsError('')
    setRecipeResponse('')
    setRecipeError('')
    setCopyStatus('')

    try {
      const prompt = `User wants to make: ${goal}\nList the materials needed in two categories:\n1. Primary materials (must have)\n2. Alternative/substitute materials (if primary not available)\nKeep it very simple, desi, low cost, village-friendly. Respond in Hinglish.`
      const answer = await callAI(goal, prompt)
      const items = parseChecklistItems(answer)

      if (items.length === 0) {
        throw new Error('AI ne checklist items return nahi kiye. Dobara try karo.')
      }

      const deduped = [...new Set(items)]
      setMaterialItems(deduped)
      setSelectedMaterials(Object.fromEntries(deduped.map((item) => [item, false])))
    } catch (error) {
      setMaterialsError(toUserAIError(error) || 'Materials list fetch nahi ho payi')
      setMaterialItems([])
      setSelectedMaterials({})
    } finally {
      setMaterialsLoading(false)
    }
  }

  const toggleMaterial = (item) => {
    setSelectedMaterials((prev) => ({ ...prev, [item]: !prev[item] }))
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
      const answer = await callAI(goal, prompt)
      setRecipeResponse(answer)
    } catch (error) {
      setRecipeError(toUserAIError(error) || 'Final jugaad recipe generate nahi ho paya')
    } finally {
      setRecipeLoading(false)
    }
  }

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
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.2em',
        color: '#6b7e6b',
        textTransform: 'uppercase',
        padding: '14px 0 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
      }}>
        Desi Jugaad Toolkit — AI-Powered DIY Solutions
        <div style={{ flex: 1, height: '1px', background: '#1e2e1e' }} />
      </div>

      {/* Step Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {[1, 2, 3].map((step) => (
          <div key={step} style={{
            background: currentStep >= step ? '#22d3ee22' : '#0a150a',
            border: `1px solid ${currentStep >= step ? '#22d3ee' : '#1e2e1e'}`,
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 600,
            color: currentStep >= step ? '#22d3ee' : '#6b7e6b'
          }}>
            Step {step} {currentStep === step ? '• Active' : currentStep > step ? '• Done' : ''}
          </div>
        ))}
      </div>

      {/* Step 1: Goal Selection */}
      <div style={{
        background: '#111c11',
        border: '1px solid #1e2e1e',
        borderRadius: '6px',
        padding: '18px',
        marginBottom: '16px',
        borderTop: '2px solid #22d3ee'
      }}>
        <h3 style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#22d3ee',
          marginBottom: '12px',
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          Step 1: Goal Selection
        </h3>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#94a394',
          marginBottom: '6px',
          fontFamily: 'monospace'
        }}>
          Kya banana chahte hain?
        </label>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #1e2e1e',
            background: '#0f1a0f',
            color: '#c8d8c8',
            fontSize: '11px',
            fontFamily: 'monospace',
            marginBottom: '12px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {TOOL_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button
          onClick={askMaterialsFromAI}
          disabled={materialsLoading}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            background: materialsLoading ? '#6b7e6b' : '#22d3ee',
            color: '#0a0f0a',
            fontSize: '11px',
            fontWeight: 600,
            border: 'none',
            cursor: materialsLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => !materialsLoading && (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={e => !materialsLoading && (e.currentTarget.style.opacity = '1')}
        >
          {materialsLoading ? 'AI se materials aa rahi hain...' : 'AI se Materials Puchho 🤖'}
        </button>
        {materialsError && (
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#f97316',
            fontFamily: 'monospace'
          }}>
            ⚠ {materialsError}
          </div>
        )}
      </div>

      {/* Step 2: Material Confirmation */}
      {materialItems.length > 0 && (
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          marginBottom: '16px',
          borderTop: '2px solid #f59e0b'
        }}>
          <h3 style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#f59e0b',
            marginBottom: '12px',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Step 2: Material Confirmation
          </h3>
          <div style={{ marginBottom: '12px' }}>
            {materialItems.map((item) => {
              const checked = Boolean(selectedMaterials[item])
              return (
                <label key={item} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  marginBottom: '6px',
                  borderRadius: '4px',
                  border: '1px solid #1e2e1e',
                  background: checked ? '#22d3ee11' : '#0a150a',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#c8d8c8'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMaterial(item)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#22d3ee'
                      }}
                    />
                    {item}
                  </span>
                  <span style={{ color: checked ? '#4ade80' : '#f97316', fontWeight: 600 }}>
                    {checked ? 'Available ✅' : 'Not Available ❌'}
                  </span>
                </label>
              )
            })}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#94a394',
            marginBottom: '12px',
            fontFamily: 'monospace',
            paddingBottom: '12px',
            borderBottom: '1px solid #1e2e1e'
          }}>
            <span>Available: <strong style={{ color: '#4ade80' }}>{availableCount}</strong></span>
            <span>Not Available: <strong style={{ color: '#f97316' }}>{notAvailableCount}</strong></span>
          </div>

          <button
            onClick={buildFinalJugaad}
            disabled={recipeLoading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              background: recipeLoading ? '#6b7e6b' : '#4ade80',
              color: '#0a0f0a',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: recipeLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => !recipeLoading && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={e => !recipeLoading && (e.currentTarget.style.opacity = '1')}
          >
            {recipeLoading ? 'Final recipe ban rahi hai...' : 'Jugaad Banao! 🔧'}
          </button>

          {recipeError && (
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#f97316',
              fontFamily: 'monospace'
            }}>
              ⚠ {recipeError}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Final Recipe */}
      {recipeResponse && (
        <div style={{
          background: '#111c11',
          border: '1px solid #1e2e1e',
          borderRadius: '6px',
          padding: '18px',
          marginBottom: '16px',
          borderTop: '2px solid #4ade80'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#4ade80',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              Step 3: Final Jugaad Recipe
            </h3>
            <button
              onClick={copyRecipe}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #4ade80',
                background: '#4ade8011',
                color: '#4ade80',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'monospace',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Copy Recipe
            </button>
          </div>

          <pre style={{
            background: '#0a150a',
            border: '1px solid #1e2e1e',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '11px',
            color: '#c8d8c8',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: 'monospace',
            lineHeight: '1.6',
            marginBottom: copyStatus ? '8px' : '0'
          }}>
            {recipeResponse}
          </pre>

          {copyStatus && (
            <div style={{
              fontSize: '10px',
              color: '#4ade80',
              fontFamily: 'monospace',
              marginTop: '8px'
            }}>
              {copyStatus}
            </div>
          )}
        </div>
      )}

      <div style={{
        textAlign: 'center',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6b7e6b',
        letterSpacing: '0.1em',
        marginTop: '12px',
        borderTop: '1px solid #1e2e1e'
      }}>
        Desi solutions • Low cost • Locally available materials
      </div>
    </div>
  )
}
