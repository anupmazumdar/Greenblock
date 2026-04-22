import { useState } from 'react'
import GreenBlockLanding from './components/GreenBlockLanding'

export default function App() {
  const [mode, setMode] = useState('greenblock')

  return <GreenBlockLanding variant={mode} onToggle={setMode} />
}