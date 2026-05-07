import { useState } from 'react'
import SubTabNavigation from './SubTabNavigation'
import EnergySection from './sections/EnergySection'
import CarbonSection from './sections/CarbonSection'
import HvacSection from './sections/HvacSection'
import BlockchainSection from './sections/BlockchainSection'

export default function GreenBlockDashboard() {
  const [subTab, setSubTab] = useState('energy')

  const subTabs = [
    { id: 'energy', label: 'Energy', activeColor: '#4ade80' },
    { id: 'carbon', label: 'Carbon', activeColor: '#22d3ee' },
    { id: 'hvac', label: 'HVAC', activeColor: '#f59e0b' },
    { id: 'blockchain', label: 'Carbon Credits ⛓', activeColor: '#c084fc' },
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <SubTabNavigation tabs={subTabs} activeTab={subTab} onTabChange={setSubTab} />

      {subTab === 'energy' && <EnergySection />}
      {subTab === 'carbon' && <CarbonSection />}
      {subTab === 'hvac' && <HvacSection />}
      {subTab === 'blockchain' && <BlockchainSection />}
    </div>
  )
}
