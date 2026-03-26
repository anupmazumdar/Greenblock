import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import EnergyDashboard from './components/EnergyDashboard'
import CarbonLogger from './components/CarbonLogger'
import HvacRecommendation from './components/HvacRecommendation'
import AgriDashboard from './components/AgriDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const [mode, setMode] = useState('greenblock')
  const navigate = useNavigate()

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) {
      return
    }
    setMode(nextMode)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar mode={mode} onModeChange={handleModeChange} />
      <main key={mode} className="mode-fade-enter max-w-7xl mx-auto px-4 py-6">
        <Routes>
          {mode === 'agriblock' ? (
            <>
              <Route path="/" element={<AgriDashboard />} />
              <Route path="/agri" element={<AgriDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<EnergyDashboard />} />
              <Route path="/carbon" element={<CarbonLogger />} />
              <Route path="/hvac" element={<HvacRecommendation />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}