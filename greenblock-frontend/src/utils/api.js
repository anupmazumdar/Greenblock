import axios from 'axios'

function normalizeApiBase(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null

  const trimmed = rawUrl.trim().replace(/\/+$/, '')
  if (!trimmed) return null

  // If user already provided /api suffix, keep it as-is.
  if (/\/api$/i.test(trimmed)) {
    return trimmed
  }

  return `${trimmed}/api`
}

function getRuntimeApiBase() {
  try {
    if (typeof window === 'undefined') return null

    const localOverride = window.localStorage.getItem('GREENBLOCK_API_URL')
    const normalizedOverride = normalizeApiBase(localOverride)
    if (normalizedOverride) return normalizedOverride

    const host = window.location.hostname
    if (!host || host === 'localhost' || host === '127.0.0.1') return null

    return normalizeApiBase(`http://${host}:8000`)
  } catch {
    return null
  }
}

const envApiBase = normalizeApiBase(import.meta.env.VITE_API_URL)
const hostedApiBase = normalizeApiBase('https://greenblock-api-production.up.railway.app')
const runtimeApiBase = getRuntimeApiBase()

const baseCandidates = [envApiBase, runtimeApiBase, '/api', hostedApiBase].filter(Boolean)
const dedupedBaseCandidates = [...new Set(baseCandidates)]

const api = axios.create({
  baseURL: dedupedBaseCandidates[0],
  timeout: 5000
})

function isRetryableError(error) {
  if (!error.response) return true
  const { status } = error.response
  return status === 404 || status >= 500
}

async function requestWithFailover(config) {
  let lastError = null

  for (const baseURL of dedupedBaseCandidates) {
    try {
      const response = await api.request({ ...config, baseURL })
      if (api.defaults.baseURL !== baseURL) {
        api.defaults.baseURL = baseURL
      }
      return response
    } catch (error) {
      lastError = error
      if (!isRetryableError(error)) {
        throw error
      }
    }
  }

  throw lastError
}

export const getSensors = () => requestWithFailover({ method: 'get', url: '/sensors' })
export const getSensorHistory = () => requestWithFailover({ method: 'get', url: '/sensors/history' })
export const getMaterials = () => requestWithFailover({ method: 'get', url: '/materials' })
export const logMaterial = (data) => requestWithFailover({ method: 'post', url: '/materials', data })
export const getCarbonSummary = () => requestWithFailover({ method: 'get', url: '/carbon-summary' })
export const getHvacRecommendation = (params) => requestWithFailover({ method: 'get', url: '/hvac-recommendation', params })
export const getWeather = () => requestWithFailover({ method: 'get', url: '/weather' })

export const getCarbonSavings = () => requestWithFailover({ method: 'get', url: '/carbon-savings' })
export const getAnomalies = () => requestWithFailover({ method: 'get', url: '/anomalies' })
export const getOccupancyHeatmap = () => requestWithFailover({ method: 'get', url: '/occupancy-heatmap' })
export const getVisitorCount = () => requestWithFailover({ method: 'get', url: '/visitor-count' })
export const getGridDependency = () => requestWithFailover({ method: 'get', url: '/grid-dependency' })
export const getEnergyScore = () => requestWithFailover({ method: 'get', url: '/energy-score' })
export const getRfidLog = () => requestWithFailover({ method: 'get', url: '/rfid-log' })
export const getAirQuality = () => requestWithFailover({ method: 'get', url: '/air-quality' })

export const getAgriRecommendation = () => requestWithFailover({ method: 'get', url: '/agri/recommendation' })
export const getAgriIrrigationStatus = () => requestWithFailover({ method: 'get', url: '/agri/irrigation-status' })
export const getAgriDiseaseRisk = () => requestWithFailover({ method: 'get', url: '/agri/disease-risk' })
export const setAgriCrop = (crop) => requestWithFailover({ method: 'post', url: '/agri/crop', data: { crop } })
export const getAgriTankLevel = () => requestWithFailover({ method: 'get', url: '/agri/tank-level' })

export const sendWhatsappAlert = (payload) => requestWithFailover({ method: 'post', url: '/alerts/whatsapp', data: payload })
export const sendTelegramAlert = (payload) => requestWithFailover({ method: 'post', url: '/alerts/telegram', data: payload })
export const getMorningDigest = () => requestWithFailover({ method: 'get', url: '/alerts/digest' })

export default api