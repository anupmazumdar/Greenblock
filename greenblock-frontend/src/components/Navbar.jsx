import { Link, useLocation } from 'react-router-dom'

const links = [
  { path: '/', label: '⚡ Energy' },
  { path: '/carbon', label: '🏗️ Carbon' },
  { path: '/hvac', label: '❄️ HVAC' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="text-green-400 font-bold text-xl tracking-tight">
          🌿 GreenBlock
        </span>
        <div className="flex gap-2">
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