import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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