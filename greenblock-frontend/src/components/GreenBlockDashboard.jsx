/**
 * GreenBlockDashboard Component
 * Wrapper component that manages Energy, Carbon, and HVAC sub-tabs
 */
import { useState } from 'react'
import SubTabNavigation from './SubTabNavigation'
import EnergySection from './sections/EnergySection'
import CarbonSection from './sections/CarbonSection'
import HvacSection from './sections/HvacSection'

export default function GreenBlockDashboard() {
  const [subTab, setSubTab] = useState('energy')

  const subTabs = [
    { id: 'energy', label: 'Energy', activeColor: '#4ade80' },
    { id: 'carbon', label: 'Carbon', activeColor: '#22d3ee' },
    { id: 'hvac', label: 'HVAC', activeColor: '#f59e0b' },
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Sub-Tab Navigation */}
      <SubTabNavigation tabs={subTabs} activeTab={subTab} onTabChange={setSubTab} />

      {/* Energy Section */}
      {subTab === 'energy' && <EnergySection />}

      {/* Carbon Section */}
      {subTab === 'carbon' && <CarbonSection />}

      {/* HVAC Section */}
      {subTab === 'hvac' && <HvacSection />}
    </div>
  )
}
