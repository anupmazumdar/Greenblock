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
      <Navbar mode={mode} />
      <main key={mode} className="mode-fade-enter max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('greenblock')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'greenblock'
                  ? 'bg-green-500 text-slate-900'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              GreenBlock
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('agriblock')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'agriblock'
                  ? 'bg-emerald-400 text-slate-900'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              AgriBlock
            </button>
          </div>
        </div>

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