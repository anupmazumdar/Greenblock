/**
 * TabNavigation Component
 * Main horizontal tab navigation with styling consistent to GreenBlock design
 */
export default function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid #1e2e1e',
      padding: '0 24px',
      background: '#090e09'
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '10px 20px',
            fontFamily: 'monospace',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            color: activeTab === tab.id ? tab.activeColor || '#4ade80' : '#6b7e6b',
            cursor: 'pointer',
            borderBottom: activeTab === tab.id ? `2px solid ${tab.activeColor || '#4ade80'}` : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'color 0.2s, border-color 0.2s',
            textDecoration: 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
