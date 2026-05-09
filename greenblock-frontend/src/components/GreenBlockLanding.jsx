import { useEffect, useRef, useState } from 'react'

// ─── STATIC DATA ───

const stats = [
  { value: '23+', label: 'Green Blockchain Networks' },
  { value: '100%', label: 'Immutable Records' },
  { value: '4', label: 'Ecosystem Actors' },
  { value: '∞', label: 'Scalable Transactions' },
]

const steps = [
  {
    number: '01', phase: 'GOVERNANCE', title: 'Set the Baseline',
    description: 'Government bodies use public discourse and direct democracy to agree on the maximum environmental harm a nation tolerates per year — encoded immutably on-chain.',
    icon: 'governance',
  },
  {
    number: '02', phase: 'SENSING', title: 'IoT Monitoring',
    description: 'Distributed IoT sensors measure real-time environmental impact — emissions, energy usage, waste output — feeding verified data directly onto the blockchain ledger.',
    icon: 'sensing',
  },
  {
    number: '03', phase: 'INCENTIVES', title: 'Smart Contract Rewards',
    description: 'Entities that operate below their carbon threshold are automatically awarded credits. Those who exceed it face smart-contract-enforced restrictions.',
    icon: 'incentives',
  },
  {
    number: '04', phase: 'MARKETPLACE', title: 'Carbon Credit Trading',
    description: 'Surplus credits become tradeable assets in a transparent marketplace. Insurance companies access on-chain endorsement scores to calculate premiums.',
    icon: 'marketplace',
  },
]

const features = [
  { title: 'Immutable Record-Keeping', description: 'Every transaction, endorsement score, and carbon credit issuance is permanently recorded on Hyperledger Sawtooth — tamper-proof and publicly auditable.', icon: 'shield' },
  { title: 'Real-Time IoT Integration', description: 'Physical sensors feed live emissions data to the chain. No manual reporting — data is captured automatically, eliminating fraud and estimation errors.', icon: 'signal' },
  { title: 'REST API + Web Interface', description: 'A clean REST API and frontend allows any stakeholder — citizen, corporation, or regulator — to interact with the platform from any device.', icon: 'screen' },
  { title: 'Multi-Stakeholder by Design', description: 'Governments, corporations, insurance companies, and citizens all have distinct roles — one unified ledger serving an entire ecosystem.', icon: 'network' },
]

const actors = [
  { icon: 'government', name: 'Government Bodies', role: 'Set national carbon baselines through democratic process. Deploy policy and enforce compliance via smart contracts.' },
  { icon: 'corporation', name: 'Corporations', role: 'Monitored via IoT sensors. Earn carbon credits for under-threshold performance. Purchase credits when limits are exceeded.' },
  { icon: 'citizen', name: 'Citizens', role: 'Rewarded for eco-friendly behavior — from EV adoption to waste reduction. Build a personal endorsement score on-chain.' },
  { icon: 'insurance', name: 'Insurance Companies', role: 'Access immutable endorsement scores to calculate premiums and enable transparent on-chain insurance products.' },
  { icon: 'iot', name: 'IoT Networks', role: 'Physical sensors feed verified, real-time environmental data onto the blockchain — eliminating self-reporting fraud at the source.' },
  { icon: 'regulator', name: 'Regulators', role: 'Monitor compliance across the entire ecosystem through a transparent dashboard. Automated enforcement removes human bias.' },
]

const techTags = [
  'Hyperledger Sawtooth', 'Smart Contracts', 'IoT Integration', 'REST API',
  'Distributed Ledger', 'Carbon Credit Protocol', 'Endorsement Scoring',
  'Ethereum / EVM', 'Algorand', 'Solana', 'Raspberry Pi', 'Real-Time Sensors',
]

// ─── AGRIBLOCK VARIANTS ───

const agriStats = [
  { value: '120+', label: 'Pilot Farms Instrumented' },
  { value: '98%', label: 'Crop Traceability' },
  { value: '32%', label: 'Average Water Savings' },
  { value: '∞', label: 'Scalable Agri Data' },
]

const agriSteps = [
  { number: '01', phase: 'BASELINE', title: 'Map Field Baselines', description: 'Farm operators establish crop, soil, and water baselines that are signed and recorded on-chain to create a trusted starting point for every season.', icon: 'governance' },
  { number: '02', phase: 'SENSING', title: 'Collect Live Farm Signals', description: 'Soil moisture probes, weather stations, and nutrient sensors stream verified data into the ledger in near real-time.', icon: 'sensing' },
  { number: '03', phase: 'ADVISORY', title: 'Trigger Smart Recommendations', description: 'Smart rules issue irrigation, fertilization, and pest-risk recommendations based on thresholds, helping farmers react before losses occur.', icon: 'incentives' },
  { number: '04', phase: 'MARKET', title: 'Unlock Verified Trade', description: 'Verified crop records and quality proofs travel with produce, enabling transparent pricing, better financing, and trusted procurement.', icon: 'marketplace' },
]

const agriFeatures = [
  { title: 'End-to-End Crop Traceability', description: 'From field events to post-harvest checkpoints, every critical action is immutably logged for compliance and buyer trust.', icon: 'shield' },
  { title: 'Precision Farming Signals', description: 'Continuous IoT telemetry provides actionable farm intelligence that reduces guesswork and improves operational decisions.', icon: 'signal' },
  { title: 'Farmer-Centric Dashboards', description: 'Simple interfaces expose alerts, trends, and recommendations so farmers can act quickly from mobile or desktop devices.', icon: 'screen' },
  { title: 'Multi-Stakeholder Agri Network', description: 'Farmers, buyers, cooperatives, insurers, and regulators share one trusted ledger with role-based visibility.', icon: 'network' },
]

const agriActors = [
  { icon: 'farmer', name: 'Farmers', role: 'Capture field activity, receive real-time recommendations, and improve yields with verifiable agronomic records.' },
  { icon: 'buyer', name: 'Buyers & Retailers', role: 'Procure produce with trusted provenance, quality history, and transparent farm compliance evidence.' },
  { icon: 'agronomist', name: 'Agronomists', role: 'Monitor farm telemetry, validate interventions, and optimize crop plans using reliable historical data.' },
  { icon: 'cooperative', name: 'Cooperatives', role: 'Coordinate shared infrastructure, benchmark outcomes, and improve farmer access to services and markets.' },
  { icon: 'insurance', name: 'Insurers & Lenders', role: 'Use immutable operational histories to underwrite risk, price premiums, and expand agricultural financing.' },
  { icon: 'regulator', name: 'Regulators', role: 'Verify sustainability and compliance metrics through auditable records without heavy manual inspections.' },
]

const agriTechTags = [
  'Precision Agriculture', 'IoT Sensor Mesh', 'Traceability Ledger', 'Farm Advisory Engine',
  'REST API', 'Weather + Soil Data', 'Distributed Ledger', 'Supply Chain Verification',
  'Yield Analytics', 'Sustainability Reporting',
]

// ─── TERMINAL MESSAGES ───

const greenTerminalMessages = [
  { type: 'sensor', text: 'SENSOR_BRIDGE   CO₂: 412.3ppm  Δ: -0.2  → chain' },
  { type: 'block',  text: 'BLOCK #008821   0x8f4a2c1e9b3d...   ✓ CONFIRMED' },
  { type: 'credit', text: 'CREDIT_MINT     +247 CC → 0x4f2a...9d  CORP_A' },
  { type: 'sensor', text: 'IOT_READ        TEMP: 24.2°C  HUM: 67%  AQ: 94/100' },
  { type: 'trade',  text: 'TRADE_EXEC      CORP_A → GOV  50 CC @ 12.4 SOL' },
  { type: 'sensor', text: 'SENSOR_BRIDGE   NOₓ: 0.8ppb  PM2.5: 4.2μg/m³' },
  { type: 'block',  text: 'BLOCK #008822   0x2e9d1f3b7a...   ✓ CONFIRMED' },
  { type: 'gov',    text: 'GOV_POLICY      LIMIT: 850 MT/yr  EPOCH: 2026-Q2' },
  { type: 'credit', text: 'INSURE_SCORE    CORP_A: 8.4/10  PREMIUM: -12%' },
  { type: 'trade',  text: 'MARKETPLACE     200 CC @ 15.2 ETH   SETTLED' },
  { type: 'sensor', text: 'IOT_READ        SOLAR: 4.2kWh  GRID_SAVE: 87%' },
  { type: 'block',  text: 'BLOCK #008823   0x7a3b8e9f2c...   ✓ CONFIRMED' },
  { type: 'credit', text: 'CITIZEN_REWARD  EV_TRAVEL → +18 CC  0xb8c3...2f' },
  { type: 'trade',  text: 'RETIRE_LEDGER   500 CC  → OFFSET VERIFIED ✓' },
]

const agriTerminalMessages = [
  { type: 'sensor',   text: 'SOIL_PROBE      MOISTURE: 34%  N: 220ppm  PH: 6.8' },
  { type: 'block',    text: 'BLOCK #004201   0x3f8c2d1a6e...   ✓ CONFIRMED' },
  { type: 'advisory', text: 'SMART_RULE      IRRIGATE: -12%  SAVE: 48L/ha/day' },
  { type: 'sensor',   text: 'WEATHER_STNX    TEMP: 31°C  WIND: 8km/h  RAIN: 0mm' },
  { type: 'trace',    text: 'BATCH_SIGN      FARM→BUYER  CERT: #AG-2847   ✓' },
  { type: 'sensor',   text: 'CROP_MONITOR    NDVI: 0.74  STRESS: LOW  ETA: 14d' },
  { type: 'block',    text: 'BLOCK #004202   0xc1e7f9a25b...   ✓ CONFIRMED' },
  { type: 'advisory', text: 'PEST_ALERT      RISK: MEDIUM  ZONE: NORTH-FIELD' },
  { type: 'sensor',   text: 'SOIL_PROBE      K: 180ppm  TEMP: 28°C  EC: 0.4mS' },
  { type: 'trace',    text: 'QUALITY_CERT    BATCH #2847  GRADE: A+   SIGNED' },
  { type: 'advisory', text: 'YIELD_PRED      EST: 4.8T/ha  Δ: +12% vs baseline' },
  { type: 'block',    text: 'BLOCK #004203   0x5d9a3c7f1e...   ✓ CONFIRMED' },
]

// ─── TERMINAL COMPONENT ───

const BOOT_TIME = 1746640800000

function fakeTs(idx) {
  return new Date(BOOT_TIME + idx * 2400).toTimeString().slice(0, 8)
}

function TerminalFeed({ messages, isAgriMode, prefersReducedMotion }) {
  const [lines, setLines] = useState([])
  const [msgIdx, setMsgIdx] = useState(0)
  const feedRef = useRef(null)

  useEffect(() => {
    setLines(messages.slice(0, 6))
    setMsgIdx(6)
  }, [messages])

  useEffect(() => {
    if (prefersReducedMotion) return undefined
    const interval = setInterval(() => {
      setLines(prev => [...prev, messages[msgIdx % messages.length]].slice(-14))
      setMsgIdx(i => i + 1)
    }, 2400)
    return () => clearInterval(interval)
  }, [messages, msgIdx, prefersReducedMotion])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [lines])

  const initLines = isAgriMode
    ? ['$ ./agri_bridge.py --net algorand', '> Connecting to Algorand TestNet... OK', '> Sensor mesh online. 94 nodes active.']
    : ['$ ./sensor_bridge.py --chain hyperledger', '> Connecting to Hyperledger Sawtooth... OK', '> IoT bridge initialized. 94 sensors live.']

  const footerStats = isAgriMode
    ? [{ v: '4,203', l: 'BLOCKS' }, { v: '120', l: 'FARMS' }, { v: '94', l: 'SENSORS' }, { v: '8', l: 'REGIONS' }]
    : [{ v: '8,823', l: 'BLOCKS' }, { v: '247K', l: 'CREDITS' }, { v: '94', l: 'SENSORS' }, { v: '12', l: 'NATIONS' }]

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot-red" />
          <span className="dot-amber" />
          <span className="dot-green" />
        </div>
        <span className="terminal-title">
          {isAgriMode ? 'agriblock' : 'greenblock'}.node — live_feed
        </span>
        <div className="terminal-live">
          <span className="terminal-pulse" />
          LIVE
        </div>
      </div>

      <div className="terminal-body" ref={feedRef}>
        {initLines.map((l, i) => (
          <div key={l} className={`t-line ${i === 0 ? 't-cmd' : 't-init'}`}>{l}</div>
        ))}
        <div className="t-separator">{'─'.repeat(50)}</div>
        {lines.map((line, i) => (
          <div key={`${i}-${line.text}`} className={`t-line t-${line.type}`}>
            <span className="t-ts">{fakeTs(i)}</span>
            <span className="t-msg">{line.text}</span>
          </div>
        ))}
        {!prefersReducedMotion && <div className="t-caret">█</div>}
      </div>

      <div className="terminal-footer">
        {footerStats.map(s => (
          <div key={s.l} className="t-stat">
            <span className="t-stat-v">{s.v}</span>
            <span className="t-stat-l">{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ICONS ───

function LogoHex() {
  return (
    <svg className="logo-hex" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--phosphor)' }} />
      <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" fill="rgba(0,255,140,0.08)" />
      <circle cx="18" cy="18" r="4" fill="var(--phosphor, #00FF8C)" />
      <line x1="18" y1="8" x2="18" y2="14" stroke="var(--phosphor, #00FF8C)" strokeWidth="1" opacity="0.45" />
      <line x1="27" y1="13" x2="22" y2="15.5" stroke="var(--phosphor, #00FF8C)" strokeWidth="1" opacity="0.45" />
      <line x1="27" y1="23" x2="22" y2="20.5" stroke="var(--phosphor, #00FF8C)" strokeWidth="1" opacity="0.45" />
      <line x1="18" y1="28" x2="18" y2="22" stroke="var(--phosphor, #00FF8C)" strokeWidth="1" opacity="0.45" />
      <line x1="9" y1="23" x2="14" y2="20.5" stroke="var(--phosphor, #00FF8C)" strokeWidth="1" opacity="0.45" />
      <line x1="9" y1="13" x2="14" y2="15.5" stroke="var(--phosphor, #00FF8C)" strokeWidth="1" opacity="0.45" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function renderStepIcon(icon) {
  const ph = 'var(--phosphor, #00FF8C)'
  const phDim = 'rgba(0,255,140,0.4)'
  const phGhost = 'rgba(0,255,140,0.06)'

  switch (icon) {
    case 'governance':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="none" stroke={ph} strokeWidth="1.5" />
          <line x1="24" y1="4" x2="24" y2="44" stroke={ph} strokeWidth="0.75" opacity="0.25" strokeDasharray="3,3" />
          <line x1="6" y1="14" x2="42" y2="34" stroke={ph} strokeWidth="0.75" opacity="0.25" strokeDasharray="3,3" />
          <line x1="42" y1="14" x2="6" y2="34" stroke={ph} strokeWidth="0.75" opacity="0.25" strokeDasharray="3,3" />
          <circle cx="24" cy="24" r="5" fill={ph} opacity="0.85" />
        </svg>
      )
    case 'sensing':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="16" y="8" width="16" height="22" rx="2" stroke={ph} strokeWidth="1.5" />
          <line x1="24" y1="30" x2="24" y2="40" stroke={ph} strokeWidth="1.5" />
          <line x1="18" y1="40" x2="30" y2="40" stroke={ph} strokeWidth="1.5" />
          <path d="M8 19 Q8 8 24 8" stroke={phDim} strokeWidth="1" strokeDasharray="3,2" />
          <path d="M40 19 Q40 8 24 8" stroke={phDim} strokeWidth="1" strokeDasharray="3,2" />
          <circle cx="24" cy="20" r="4" fill={phGhost} stroke={ph} strokeWidth="1" />
          <circle cx="24" cy="20" r="1.5" fill={ph} />
        </svg>
      )
    case 'incentives':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18" fill={phGhost} stroke={ph} strokeWidth="1.5" />
          <circle cx="24" cy="24" r="3" fill={ph} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="28" width="8" height="16" fill={phGhost} stroke={ph} strokeWidth="1.5" />
          <rect x="16" y="20" width="8" height="24" fill={phGhost} stroke={ph} strokeWidth="1.5" />
          <rect x="28" y="12" width="8" height="32" fill={phGhost} stroke={ph} strokeWidth="1.5" />
          <rect x="40" y="4" width="4" height="40" fill={phGhost} stroke={ph} strokeWidth="1.5" />
          <polyline points="4,26 20,16 32,10 44,4" stroke={ph} strokeWidth="1.5" strokeDasharray="3,2" />
        </svg>
      )
  }
}

function renderFeatureIcon(icon) {
  const ph = 'var(--phosphor, #00FF8C)'
  switch (icon) {
    case 'shield':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ph} strokeWidth="1.5" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'signal':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ph} strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
    case 'screen':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ph} strokeWidth="1.5" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
    default:
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ph} strokeWidth="1.5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  }
}

function renderActorIcon(icon) {
  const ph = 'var(--phosphor, #00FF8C)'
  const s = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: ph, strokeWidth: 1.5, 'aria-hidden': true }
  switch (icon) {
    case 'government':
      return <svg {...s}><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" /></svg>
    case 'corporation':
      return <svg {...s}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" /></svg>
    case 'citizen':
      return <svg {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    case 'insurance':
      return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'iot':
      return <svg {...s}><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></svg>
    case 'regulator':
      return <svg {...s}><path d="M12 3l1.88 5.79H20l-4.94 3.59 1.88 5.79L12 14.58l-4.94 3.59 1.88-5.79L4 8.79h6.12L12 3z" /></svg>
    case 'farmer':
      return <svg {...s}><path d="M3 17l3-9 5 4 5-4 3 9" /><path d="M12 2v5M7 12a5 5 0 0 0 10 0" /></svg>
    case 'buyer':
      return <svg {...s}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
    case 'agronomist':
      return <svg {...s}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4m0-8h10m0 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9m10-8v8" /></svg>
    case 'cooperative':
      return <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    default:
      return <svg {...s}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
  }
}

// ─── MOTION HOOK ───

function usePrefersReducedMotion() {
  const [pref, setPref] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handle = () => setPref(mq.matches)
    handle()
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handle)
      return () => mq.removeEventListener('change', handle)
    }
    mq.addListener(handle)
    return () => mq.removeListener(handle)
  }, [])
  return pref
}

// ─── MAIN EXPORT ───

export default function GreenBlockLanding({ variant = 'greenblock', onToggle, onOpenDashboard }) {
  const shellRef = useRef(null)
  const navRef = useRef(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pref = usePrefersReducedMotion()
  const isAgri = variant === 'agriblock'
  const nextMode = isAgri ? 'greenblock' : 'agriblock'

  const statsFeed = isAgri ? agriStats : stats
  const stepsFeed = isAgri ? agriSteps : steps
  const featuresFeed = isAgri ? agriFeatures : features
  const actorsFeed = isAgri ? agriActors : actors
  const techFeed = isAgri ? agriTechTags : techTags
  const termFeed = isAgri ? agriTerminalMessages : greenTerminalMessages
  const brand = isAgri ? 'Agri' : 'Green'

  const heroLines = isAgri
    ? ['Cultivating', 'the Future of', 'Smart Farming', 'On-Chain']
    : ['Rewarding', "the Planet's", 'Defenders', 'On-Chain']

  const heroTag = isAgri ? 'Agriculture × IoT × Traceability' : 'Blockchain × IoT × Climate Action'
  const heroSub = isAgri
    ? 'AgriBlock combines IoT telemetry and blockchain traceability to help farmers optimize inputs, improve yields, and build trust across the food supply chain.'
    : 'GreenBlock uses blockchain and IoT to create a transparent, incentive-driven ecosystem where governments, corporations, and citizens collectively reduce carbon emissions — and get rewarded for doing so.'

  const processTitle = isAgri ? 'How AgriBlock Works' : 'How GreenBlock Works'
  const processSub = isAgri
    ? 'A practical flow combining live farm sensing, advisory logic, and verifiable records to improve outcomes from field to market.'
    : 'A multi-layered system combining democratic governance, IoT sensing, and blockchain automation for accountable, incentivized climate action.'

  const platformTitle = isAgri ? 'Built for Agricultural Intelligence at Scale' : 'Built for Accountability at Scale'
  const platformSub = isAgri
    ? "AgriBlock isn't just a dashboard — it's an operational intelligence layer connecting fields, markets, and regulators with trusted real-time data."
    : "GreenBlock isn't just a concept — it's a functional architecture that bridges the physical and digital worlds to enforce environmental accountability."

  const ecoSub = isAgri
    ? 'AgriBlock unifies all agri stakeholders on one trusted network, from farm operations to post-harvest verification and downstream trade.'
    : 'GreenBlock is designed for every level of society. Each actor has a defined role, enforced by smart contracts and verified by the distributed ledger.'

  const techSub = isAgri
    ? 'AgriBlock combines proven distributed-ledger infrastructure with precision-agriculture tooling to deliver reliable farm intelligence at scale.'
    : 'GreenBlock leverages enterprise-grade blockchain technology alongside modern web tooling to deliver a secure, scalable, and auditable platform.'

  const ctaTitle = isAgri ? 'Build a Transparent, Data-Driven Agricultural Future' : 'Join the Movement Toward a Verifiable, Incentivized Planet'
  const ctaSub = isAgri
    ? 'AgriBlock is looking for pilot farms, cooperatives, and agri-tech partners to scale from prototype to production-ready deployments.'
    : "GreenBlock is seeking funding, endorsement, and guidance to grow from prototype to production. Whether you're a government, corporation, or individual — there's a role for you on-chain."

  const footerDesc = isAgri
    ? 'An IoT + blockchain platform for precision agriculture, crop traceability, and trusted farm-to-market collaboration.'
    : 'A blockchain + IoT platform incentivising environment-friendly behaviour through transparent, automated carbon credit systems.'

  const footerLedger = isAgri ? 'LEDGER ACTIVE · TRACEABILITY NETWORK' : 'LEDGER ACTIVE · HYPERLEDGER SAWTOOTH'
  const devpostHref = 'https://anupmazumdar.me'
  const devpostLabel = isAgri ? 'View Shared Devpost' : 'View on Devpost'
  const dashLabel = isAgri ? 'Open AgriBlock Dashboard' : 'Open GreenBlock Dashboard'
  const hasDash = typeof onOpenDashboard === 'function'

  useEffect(() => {
    const shell = shellRef.current
    const nav = navRef.current
    if (!shell || !nav) return undefined
    const sync = () => {
      shell.style.setProperty('--nav-h', `${Math.ceil(nav.getBoundingClientRect().height) + 8}px`)
    }
    sync()
    window.addEventListener('resize', sync)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
    ro?.observe(nav)
    return () => { window.removeEventListener('resize', sync); ro?.disconnect() }
  }, [variant])

  useEffect(() => {
    const els = document.querySelectorAll('.step-card, .actor-card, .feature-item')
    if (pref) {
      els.forEach(el => { el.style.opacity = ''; el.style.transform = ''; el.style.transition = '' })
      return undefined
    }
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)' }
      }),
      { threshold: 0.06 }
    )
    els.forEach(el => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(16px)'
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      obs.observe(el)
    })
    return () => obs.disconnect()
  }, [pref, variant])

  useEffect(() => {
    const els = document.querySelectorAll('.stat-num')
    if (pref) { els.forEach(el => { el.textContent = el.dataset.final || el.textContent }); return undefined }
    const ids = []
    els.forEach(el => {
      const raw = el.textContent || ''
      const num = parseInt(raw, 10)
      if (isNaN(num)) return
      const suffix = raw.match(/[^\d.]+$/)?.[0] || ''
      let count = 0
      const step = num / 40
      const id = setInterval(() => {
        count = Math.min(count + step, num)
        el.textContent = `${Math.floor(count)}${suffix}`
        if (count >= num) clearInterval(id)
      }, 40)
      ids.push(id)
    })
    return () => ids.forEach(clearInterval)
  }, [pref, variant])

  return (
    <div ref={shellRef} className="landing-shell">

      {/* ─── NAV ─── */}
      <nav ref={navRef} className="top-nav">
        <a href="#top" className="nav-logo">
          <LogoHex />
          <span className="logo-text">{brand}<em>Block</em></span>
        </a>
        <ul className={`nav-links${mobileOpen ? ' nav-links--open' : ''}`}>
          <li><a href="#how" onClick={() => setMobileOpen(false)}>How It Works</a></li>
          <li><a href="#features" onClick={() => setMobileOpen(false)}>Platform</a></li>
          <li><a href="#actors" onClick={() => setMobileOpen(false)}>Participants</a></li>
          <li><a href="#tech" onClick={() => setMobileOpen(false)}>Technology</a></li>
          <li className="nav-mobile-only">
            <button type="button" className="btn-ghost" onClick={() => { onToggle?.(nextMode); setMobileOpen(false) }}>
              {isAgri ? 'Switch to GreenBlock' : 'Switch to AgriBlock'}
            </button>
          </li>
        </ul>
        <div className="nav-actions">
          <button type="button" className="btn-ghost nav-desktop-only" onClick={() => onToggle?.(nextMode)}>
            {isAgri ? 'Switch to GreenBlock' : 'Switch to AgriBlock'}
          </button>
          <a className="btn-nav-cta" href="#cta">Get Involved</a>
          <button
            type="button"
            className="nav-hamburger"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            }
          </button>
        </div>
      </nav>

      <main id="top">

        {/* ─── HERO ─── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              {heroTag}
            </div>

            <p className="hero-descriptor">
              {isAgri
                ? 'IoT-Powered Agricultural Traceability Platform'
                : 'Blockchain Carbon Credit System · IoT-Powered'}
            </p>

            <h1 className="hero-h1">
              {heroLines.map((line, i) => (
                <span
                  key={i}
                  className={`h1-line${i === 2 ? ' h1-accent' : ''}${i === 3 ? ' h1-dim' : ''}`}
                >
                  {line}
                </span>
              ))}
            </h1>

            <p className="hero-sub">{heroSub}</p>

            <div className="hero-ctas">
              <a href="#how" className="btn-primary">Explore the Platform →</a>
              <button type="button" className="btn-outline" disabled={!hasDash} onClick={() => onOpenDashboard?.()}>
                {dashLabel}
              </button>
              <a href={devpostHref} target="_blank" rel="noreferrer" className="btn-outline">
                <DocIcon /> {devpostLabel}
              </a>
            </div>
          </div>

          <div className="hero-right" aria-hidden="true">
            <TerminalFeed messages={termFeed} isAgriMode={isAgri} prefersReducedMotion={pref} />
          </div>
        </section>

        {/* ─── STATS ─── */}
        <div className="stats-bar">
          {statsFeed.map(s => (
            <div className="stat-item" key={s.label}>
              <span className="stat-num" data-final={s.value}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section className="how-section" id="how">
          <div className="section-head">
            <div className="section-eyebrow">Process</div>
            <h2 className="section-title">{processTitle}</h2>
            <p className="section-sub">{processSub}</p>
          </div>
          <div className="steps-grid">
            {stepsFeed.map(step => (
              <article className="step-card" key={step.title}>
                <div className="step-number">
                  <span className="step-n">{step.number}</span>
                  <span className="step-phase">— {step.phase}</span>
                </div>
                <div className="step-icon">{renderStepIcon(step.icon)}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── PLATFORM FEATURES ─── */}
        <section id="features" className="features-section">
          <div className="section-head">
            <div className="section-eyebrow">Platform</div>
            <h2 className="section-title">{platformTitle}</h2>
            <p className="section-sub">{platformSub}</p>
          </div>
          <ul className="features-list" role="list">
            {featuresFeed.map((f, i) => (
              <li className="feature-row feature-item" key={f.title}>
                <span className="feature-num" aria-hidden="true">0{i + 1}</span>
                <div className="feature-icon-wrap">{renderFeatureIcon(f.icon)}</div>
                <div className="feature-text">
                  <h4 className="feature-title">{f.title}</h4>
                  <p>{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── ACTORS ─── */}
        <section className="actors-section" id="actors">
          <div className="section-head">
            <div className="section-eyebrow">Ecosystem</div>
            <h2 className="section-title">Who Participates</h2>
            <p className="section-sub">{ecoSub}</p>
          </div>
          <div className="actors-grid">
            {actorsFeed.map(a => (
              <article className="actor-card" key={a.name}>
                <div className="actor-icon-wrap">{renderActorIcon(a.icon)}</div>
                <h3 className="actor-name">{a.name}</h3>
                <p className="actor-role">{a.role}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── TECHNOLOGY ─── */}
        <section id="tech" className="tech-section">
          <div className="section-eyebrow tech-eyebrow-solo">Technology Stack</div>
          <div className="tech-tags">
            {techFeed.map(tag => (
              <span className="tech-tag" key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="cta-section" id="cta">
          <div className="section-eyebrow section-eyebrow-center">Get Involved</div>
          <h2 className="section-title cta-title">{ctaTitle}</h2>
          <p className="section-sub cta-sub">{ctaSub}</p>
          <div className="cta-actions">
            <button type="button" className="btn-primary" disabled={!hasDash} onClick={() => onOpenDashboard?.()}>
              {dashLabel}
            </button>
            <a href={devpostHref} target="_blank" rel="noreferrer" className="btn-primary">
              {devpostLabel}
            </a>
            <a href="mailto:anup@anupmazumdar.me" className="btn-outline">
              Contact the Team →
            </a>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#top" className="nav-logo">
              <LogoHex />
              <span className="logo-text">{brand}<em>Block</em></span>
            </a>
            <p>{footerDesc}</p>
          </div>

          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><a href="#how">How It Works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#actors">Participants</a></li>
              <li><a href="#tech">Technology</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Resources</h5>
            <ul>
              <li><a href={devpostHref} target="_blank" rel="noreferrer">Devpost</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Whitepaper</a></li>
              <li><a href="#">API Reference</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Contact</h5>
            <ul>
              <li><a href="https://anupmazumdar.me" target="_blank" rel="noreferrer">anupmazumdar.me</a></li>
              <li><a href="mailto:anup@anupmazumdar.me">Email</a></li>
              <li><a href="#">GitHub</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 {brand}Block · Anup Mazumdar · All Rights Reserved</span>
          <div className="footer-ledger">
            <span className="ledger-dot" aria-hidden="true" />
            {footerLedger}
          </div>
        </div>
      </footer>
    </div>
  )
}
