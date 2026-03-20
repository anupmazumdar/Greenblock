import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import EnergyDashboard from './components/EnergyDashboard'
import CarbonLogger from './components/CarbonLogger'
import HvacRecommendation from './components/HvacRecommendation'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<EnergyDashboard />} />
            <Route path="/carbon" element={<CarbonLogger />} />
            <Route path="/hvac" element={<HvacRecommendation />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}