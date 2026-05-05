/**
 * AgriBlockDashboard Component
 * Wrapper component managing Control Center, Toolkit, and AI Advisor sub-tabs
 * for the AgriBlock main section
 */
import { useState } from 'react'
import SubTabNavigation from './SubTabNavigation'
import ControlCenterSection from './sections/ControlCenterSection'
import ToolkitSection from './sections/ToolkitSection'
import AIAdvisorSection from './sections/AIAdvisorSection'

const SUB_TABS = [
  { id: 'control', label: 'Control Center', icon: '🎛️' },
  { id: 'toolkit', label: 'Desi Toolkit', icon: '🔧' },
  { id: 'advisor', label: 'Farm Advisor', icon: '🤖' }
]

export default function AgriBlockDashboard() {
  const [subTab, setSubTab] = useState('control')

  return (
    <div>
      {/* SubTab Navigation */}
      <SubTabNavigation
        tabs={SUB_TABS}
        activeTab={subTab}
        onTabChange={setSubTab}
      />

      {/* Conditional Section Rendering */}
      <div style={{ marginTop: '12px' }}>
        {subTab === 'control' && <ControlCenterSection />}
        {subTab === 'toolkit' && <ToolkitSection />}
        {subTab === 'advisor' && <AIAdvisorSection />}
      </div>
    </div>
  )
}
