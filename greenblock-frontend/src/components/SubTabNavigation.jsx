/**
 * SubTabNavigation Component
 * Secondary tab navigation for subsections with distinct styling
 */
export default function SubTabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 0',
      borderBottom: '1px solid #1e2e1e',
      marginBottom: '16px'
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '6px 14px',
            fontFamily: 'monospace',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: activeTab === tab.id ? `${tab.activeColor || '#4ade80'}22` : 'transparent',
            border: `1px solid ${activeTab === tab.id ? tab.activeColor || '#4ade80' : '#1e2e1e'}`,
            color: activeTab === tab.id ? tab.activeColor || '#4ade80' : '#6b7e6b',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
