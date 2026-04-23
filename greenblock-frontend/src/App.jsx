import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import EnergyDashboard from './components/EnergyDashboard'
import AgriDashboard from './components/AgriDashboard'
import AgriAIDashboard from './components/AgriAIDashboard'
import GreenBlockLanding from './components/GreenBlockLanding'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage mode="greenblock" />} />
      <Route path="/agriblock" element={<LandingPage mode="agriblock" />} />
      <Route path="/dashboard/greenblock" element={<DashboardPage mode="greenblock" />} />
      <Route path="/dashboard/agriblock" element={<DashboardPage mode="agriblock" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function LandingPage({ mode }) {
  const navigate = useNavigate()

  const openDashboard = () => {
    navigate(`/dashboard/${mode}`)
  }

  const toggleMode = (nextMode) => {
    navigate(nextMode === 'agriblock' ? '/agriblock' : '/')
  }

  return (
    <GreenBlockLanding
      variant={mode}
      onToggle={toggleMode}
      onOpenDashboard={openDashboard}
    />
  )
}

function DashboardPage({ mode }) {
  const navigate = useNavigate()

  const isAgriMode = mode === 'agriblock'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">GreenBlock / AgriBlock</p>
            <h1 className="text-2xl font-bold text-white">
              {isAgriMode ? 'AgriBlock Dashboard' : 'GreenBlock Dashboard'}
            </h1>
          </div>

          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950/80 p-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard/greenblock')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                !isAgriMode
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              GreenBlock
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/agriblock')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isAgriMode
                  ? 'bg-green-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              AgriBlock
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-6">
        {isAgriMode ? (
          <div className="space-y-6">
            <AgriDashboard />
            <AgriAIDashboard />
          </div>
        ) : (
          <EnergyDashboard />
        )}
      </section>
    </main>
  )
}