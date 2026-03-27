import { Link, useLocation } from 'react-router-dom'

const greenLinks = [
  { path: '/', label: '⚡ Energy' },
  { path: '/carbon', label: '🏗️ Carbon' },
  { path: '/hvac', label: '❄️ HVAC' },
]

const agriLinks = [
  { path: '/agri', label: '🌾 Agri Dashboard' },
]

export default function Navbar({ mode = 'greenblock', onModeChange = () => {} }) {
  const { pathname } = useLocation()
  const links = mode === 'agriblock' ? agriLinks : greenLinks
  const brandText = mode === 'agriblock' ? '🌾 AgriBlock' : '🌿 GreenBlock'

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
        <span className="text-green-400 font-bold text-xl tracking-tight">
          {brandText}
        </span>
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/70 p-1">
            <button
              type="button"
              onClick={() => onModeChange('greenblock')}
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
              onClick={() => onModeChange('agriblock')}
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
        <div className="flex justify-end gap-2">
          {links.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === path
                  ? 'bg-green-500 text-slate-900'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}