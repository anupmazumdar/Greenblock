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
import AgriAIDashboard from './components/AgriAIDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const location = useLocation()
  const [cacheBanner, setCacheBanner] = useState(null)
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleCacheStatus = (event) => {
      const detail = event?.detail || {}
      if (detail.type === 'live' || !detail.message) {
        setCacheBanner(null)
        return
      }
      setCacheBanner({
        message: detail.message,
        type: detail.type || 'info'
      })
    }

    window.addEventListener('greenblock-cache-status', handleCacheStatus)
    return () => window.removeEventListener('greenblock-cache-status', handleCacheStatus)
  }, [])

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) {
      return
    }
    setMode(nextMode)
    navigate(nextMode === 'agriblock' ? '/agri/dashboard' : '/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar mode={mode} onModeChange={handleModeChange} />
      {cacheBanner && (
        <div className={[
          'mx-auto max-w-7xl mt-4 rounded-lg border px-4 py-2 text-sm',
          cacheBanner.type === 'error'
            ? 'border-rose-700 bg-rose-950/40 text-rose-200'
            : 'border-amber-700 bg-amber-950/40 text-amber-100'
        ].join(' ')}>
          {cacheBanner.message}
        </div>
      )}
      <main key={mode} className="mode-fade-enter max-w-7xl mx-auto px-4 py-6">
        <Routes>
          {mode === 'agriblock' ? (
            <>
              <Route path="/" element={<Navigate to="/agri/dashboard" replace />} />
              <Route path="/agri" element={<Navigate to="/agri/dashboard" replace />} />
              <Route path="/agri/dashboard" element={<AgriAIDashboard />} />
              <Route path="*" element={<Navigate to="/agri/dashboard" replace />} />
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