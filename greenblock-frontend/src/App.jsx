import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import GreenBlockLanding from './components/GreenBlockLanding'
import UnifiedDashboard from './components/UnifiedDashboard'

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
  return <UnifiedDashboard mode={mode} />
}