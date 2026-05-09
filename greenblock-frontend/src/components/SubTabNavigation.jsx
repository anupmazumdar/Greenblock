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
      borderBottom: '1px solid var(--wire)',
      marginBottom: '16px',
      overflowX: 'auto',
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '6px 14px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: activeTab === tab.id ? `${tab.activeColor || 'var(--phosphor)'}22` : 'transparent',
            border: `1px solid ${activeTab === tab.id ? tab.activeColor || 'var(--phosphor)' : 'var(--wire)'}`,
            color: activeTab === tab.id ? tab.activeColor || 'var(--phosphor)' : 'var(--text-dim)',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
