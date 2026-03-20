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

export default api