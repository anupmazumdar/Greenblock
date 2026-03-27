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

    const { hostname: host, protocol } = window.location
    if (!host || host === 'localhost' || host === '127.0.0.1') return null

    // Avoid mixed-content errors on HTTPS pages.
    if (protocol === 'https:') {
      return null
    }

    return normalizeApiBase(`http://${host}:8000`)
  } catch {
    return null
  }
}

const envApiBase = normalizeApiBase(import.meta.env.VITE_API_URL)
const hostedApiBase = normalizeApiBase('https://greenblock-api-production.up.railway.app')
const runtimeApiBase = getRuntimeApiBase()
const lanApiBase = normalizeApiBase('http://greenblock.local:8000')

const baseCandidates = ['/api', envApiBase, runtimeApiBase, lanApiBase, hostedApiBase].filter(Boolean)
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
  const { validate } = config
  const requestConfig = { ...config }
  delete requestConfig.validate

  for (const baseURL of dedupedBaseCandidates) {
    try {
      const response = await api.request({ ...requestConfig, baseURL })

      // If proxy/upstream is misconfigured, some servers return HTML with 200.
      // Treat that as invalid API response and continue failover.
      if (typeof response?.data === 'string') {
        throw new Error(`Invalid API payload from ${baseURL}`)
      }

      if (typeof validate === 'function' && !validate(response?.data)) {
        throw new Error(`Unexpected API schema from ${baseURL}`)
      }

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

const hasSensorShape = (data) => (
  data && typeof data === 'object' &&
  typeof data.timestamp === 'string' &&
  Object.prototype.hasOwnProperty.call(data, 'temp')
)

const hasSensorHistoryShape = (data) => (
  data && typeof data === 'object' && Array.isArray(data.data)
)

const hasWeatherShape = (data) => (
  data && typeof data === 'object' &&
  data.status === 'ok' &&
  data.data && typeof data.data === 'object'
)

export const getSensors = () => requestWithFailover({ method: 'get', url: '/sensors', validate: hasSensorShape })
export const getSensorHistory = () => requestWithFailover({ method: 'get', url: '/sensors/history', validate: hasSensorHistoryShape })
export const getMaterials = () => requestWithFailover({ method: 'get', url: '/materials' })
export const logMaterial = (data) => requestWithFailover({ method: 'post', url: '/materials', data })
export const getCarbonSummary = () => requestWithFailover({ method: 'get', url: '/carbon-summary' })
export const getHvacRecommendation = (params) => requestWithFailover({ method: 'get', url: '/hvac-recommendation', params })
export const getWeather = () => requestWithFailover({ method: 'get', url: '/weather', validate: hasWeatherShape })

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