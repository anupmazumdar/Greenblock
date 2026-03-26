import axios from 'axios'

const baseURL = import.meta.env.PROD
  ? 'https://greenblock-production.up.railway.app/api'
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 5000
})

export const getSensors = () => api.get('/sensors')
export const getSensorHistory = () => api.get('/sensors/history')
export const getMaterials = () => api.get('/materials')
export const logMaterial = (data) => api.post('/materials', data)
export const getCarbonSummary = () => api.get('/carbon-summary')
export const getHvacRecommendation = (params) => api.get('/hvac-recommendation', { params })
export const getWeather = () => api.get('/weather')

export const getCarbonSavings = () => api.get('/carbon-savings')
export const getAnomalies = () => api.get('/anomalies')
export const getOccupancyHeatmap = () => api.get('/occupancy-heatmap')
export const getVisitorCount = () => api.get('/visitor-count')
export const getGridDependency = () => api.get('/grid-dependency')
export const getEnergyScore = () => api.get('/energy-score')
export const getRfidLog = () => api.get('/rfid-log')
export const getAirQuality = () => api.get('/air-quality')

export const getAgriRecommendation = () => api.get('/agri/recommendation')
export const getAgriIrrigationStatus = () => api.get('/agri/irrigation-status')
export const getAgriDiseaseRisk = () => api.get('/agri/disease-risk')
export const setAgriCrop = (crop) => api.post('/agri/crop', { crop })
export const getAgriTankLevel = () => api.get('/agri/tank-level')

export const sendWhatsappAlert = (payload) => api.post('/alerts/whatsapp', payload)
export const sendTelegramAlert = (payload) => api.post('/alerts/telegram', payload)
export const getMorningDigest = () => api.get('/alerts/digest')

export default api