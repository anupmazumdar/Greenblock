import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom'
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
  const location = useLocation()
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('greenblock_mode')
      if (saved === 'agriblock' || saved === 'greenblock') {
        return saved
      }
    }
    return 'greenblock'
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname.startsWith('/agri') && mode !== 'agriblock') {
      setMode('agriblock')
      return
    }

    if (!location.pathname.startsWith('/agri') && mode === 'agriblock' && location.pathname === '/') {
      return
    }
  }, [location.pathname, mode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('greenblock_mode', mode)
    }
  }, [mode])

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) {
      return
    }
    setMode(nextMode)
    navigate(nextMode === 'agriblock' ? '/agri' : '/', { replace: true })
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
              <Route path="*" element={<Navigate to="/agri" replace />} />
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