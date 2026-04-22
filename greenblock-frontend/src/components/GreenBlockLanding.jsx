import { useEffect, useRef, useState } from 'react'

const tickerItems = [
  'Blockchain-Verified Carbon Credits',
  'IoT-Powered Real-Time Monitoring',
  'Hyperledger Sawtooth Infrastructure',
  'Smart Contract Incentives',
  'Transparent Carbon Offset Marketplace',
  'Government × Corporate × Citizen Ecosystem',
]

const stats = [
  { value: '23+', label: 'Green Blockchain Networks Identified' },
  { value: '100%', label: 'Immutable Transaction Records' },
  { value: '4', label: 'Core Ecosystem Actors' },
  { value: '∞', label: 'Scalable Carbon Credit Transactions' },
]

const steps = [
  {
    number: '01 — GOVERNANCE',
    title: 'Set the Baseline',
    description:
      'Government bodies use public discourse and direct democracy to agree on the maximum environmental harm a nation tolerates per year — encoded immutably on-chain.',
    icon: 'governance',
  },
  {
    number: '02 — SENSING',
    title: 'IoT Monitoring',
    description:
      'Distributed IoT sensors measure real-time environmental impact — emissions, energy usage, waste output — feeding verified data directly onto the blockchain ledger.',
    icon: 'sensing',
  },
  {
    number: '03 — INCENTIVES',
    title: 'Smart Contract Rewards',
    description:
      'Entities that operate below their carbon threshold are automatically awarded credits. Those who exceed it face smart-contract-enforced restrictions and can purchase insurance offsets.',
    icon: 'incentives',
  },
  {
    number: '04 — MARKETPLACE',
    title: 'Carbon Credit Trading',
    description:
      'Surplus credits become tradeable assets in a transparent marketplace. Insurance companies access on-chain endorsement scores to calculate premiums, making sustainability economically rational.',
    icon: 'marketplace',
  },
]

const features = [
  {
    title: 'Immutable Record-Keeping',
    description:
      'Every transaction, endorsement score, and carbon credit issuance is permanently recorded on Hyperledger Sawtooth — tamper-proof and publicly auditable.',
    icon: 'shield',
  },
  {
    title: 'Real-Time IoT Integration',
    description:
      'Physical sensors feed live emissions data to the chain. No manual reporting — data is captured automatically, eliminating fraud and estimation errors.',
    icon: 'signal',
  },
  {
    title: 'REST API + Web Interface',
    description:
      'A clean REST API and HTML/JS frontend allows any stakeholder — citizen, corporation, or regulator — to interact with the platform from any device.',
    icon: 'screen',
  },
  {
    title: 'Multi-Stakeholder by Design',
    description:
      'Governments, corporations, insurance companies, and citizens all have distinct roles and interfaces — one unified ledger serving an entire ecosystem.',
    icon: 'network',
  },
]

const actors = [
  {
    icon: '🏛️',
    name: 'Government Bodies',
    role: 'Set national carbon baselines through democratic process. Deploy policy and enforce compliance via smart contracts. Access real-time aggregate data.',
  },
  {
    icon: '🏭',
    name: 'Corporations',
    role: 'Monitored via IoT sensors. Earn carbon credits for under-threshold performance. Purchase credits or insurance when limits are exceeded.',
  },
  {
    icon: '👤',
    name: 'Citizens',
    role: 'Rewarded for eco-friendly behavior — from EV adoption to waste reduction. Build a personal endorsement score on-chain. Participate in governance.',
  },
  {
    icon: '🛡️',
    name: 'Insurance Companies',
    role: 'Access immutable endorsement scores to calculate premiums. Enable entities to offset carbon costs through transparent, on-chain verified insurance products.',
  },
  {
    icon: '📡',
    name: 'IoT Networks',
    role: 'Physical sensors and devices feed verified, real-time environmental data onto the blockchain — eliminating self-reporting fraud at the source.',
  },
  {
    icon: '⚖️',
    name: 'Regulators',
    role: 'Monitor compliance across the entire ecosystem through a transparent dashboard. Automated enforcement removes human bias and political pressure.',
  },
]

const techTags = [
  'Hyperledger Sawtooth',
  'Hyperledger Composer',
  'Smart Contracts',
  'REST API',
  'IoT Integration',
  'HTML / JavaScript',
  'Distributed Ledger',
  'Carbon Credit Protocol',
  'Endorsement Scoring',
  'Direct Democracy Layer',
]

const agriTickerItems = [
  'IoT-Powered Soil Monitoring',
  'Farm-to-Fork Traceability Ledger',
  'Smart Irrigation Optimization',
  'Climate-Resilient Crop Insights',
  'Transparent Produce Marketplace',
  'Farmer × Buyer × Regulator Collaboration',
]

const agriStats = [
  { value: '120+', label: 'Pilot Farms Instrumented' },
  { value: '98%', label: 'Crop Traceability Coverage' },
  { value: '32%', label: 'Average Water Savings' },
  { value: '∞', label: 'Scalable Agri Data Transactions' },
]

const agriSteps = [
  {
    number: '01 — BASELINE',
    title: 'Map Field Baselines',
    description:
      'Farm operators establish crop, soil, and water baselines that are signed and recorded on-chain to create a trusted starting point for every season.',
    icon: 'governance',
  },
  {
    number: '02 — SENSING',
    title: 'Collect Live Farm Signals',
    description:
      'Soil moisture probes, weather stations, and nutrient sensors stream verified data into the ledger in near real-time.',
    icon: 'sensing',
  },
  {
    number: '03 — ADVISORY',
    title: 'Trigger Smart Recommendations',
    description:
      'Smart rules issue irrigation, fertilization, and pest-risk recommendations based on thresholds, helping farmers react before losses occur.',
    icon: 'incentives',
  },
  {
    number: '04 — MARKET',
    title: 'Unlock Verified Trade',
    description:
      'Verified crop records and quality proofs travel with produce, enabling transparent pricing, better financing, and trusted procurement.',
    icon: 'marketplace',
  },
]

const agriFeatures = [
  {
    title: 'End-to-End Crop Traceability',
    description:
      'From field events to post-harvest checkpoints, every critical action is immutably logged for compliance and buyer trust.',
    icon: 'shield',
  },
  {
    title: 'Precision Farming Signals',
    description:
      'Continuous IoT telemetry provides actionable farm intelligence that reduces guesswork and improves operational decisions.',
    icon: 'signal',
  },
  {
    title: 'Farmer-Centric Dashboards',
    description:
      'Simple interfaces expose alerts, trends, and recommendations so farmers can act quickly from mobile or desktop devices.',
    icon: 'screen',
  },
  {
    title: 'Multi-Stakeholder Agri Network',
    description:
      'Farmers, buyers, cooperatives, insurers, and regulators share one trusted ledger with role-based visibility.',
    icon: 'network',
  },
]

const agriActors = [
  {
    icon: '🚜',
    name: 'Farmers',
    role: 'Capture field activity, receive real-time recommendations, and improve yields with verifiable agronomic records.',
  },
  {
    icon: '🏪',
    name: 'Buyers & Retailers',
    role: 'Procure produce with trusted provenance, quality history, and transparent farm compliance evidence.',
  },
  {
    icon: '🧪',
    name: 'Agronomists',
    role: 'Monitor farm telemetry, validate interventions, and optimize crop plans using reliable historical data.',
  },
  {
    icon: '🤝',
    name: 'Cooperatives',
    role: 'Coordinate shared infrastructure, benchmark outcomes, and improve farmer access to services and markets.',
  },
  {
    icon: '🛡️',
    name: 'Insurers & Lenders',
    role: 'Use immutable operational histories to underwrite risk, price premiums, and expand agricultural financing.',
  },
  {
    icon: '⚖️',
    name: 'Regulators',
    role: 'Verify sustainability and compliance metrics through auditable records without heavy manual inspections.',
  },
]

const agriTechTags = [
  'Precision Agriculture',
  'IoT Sensor Mesh',
  'Traceability Ledger',
  'Farm Advisory Engine',
  'REST API',
  'Weather + Soil Data',
  'Distributed Ledger',
  'Supply Chain Verification',
  'Yield Analytics',
  'Sustainability Reporting',
]

export default function GreenBlockLanding({ variant = 'greenblock', onToggle }) {
  const canvasRef = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isAgriMode = variant === 'agriblock'
  const nextMode = isAgriMode ? 'greenblock' : 'agriblock'
  const tickerFeed = isAgriMode ? agriTickerItems : tickerItems
  const statsFeed = isAgriMode ? agriStats : stats
  const stepsFeed = isAgriMode ? agriSteps : steps
  const featuresFeed = isAgriMode ? agriFeatures : features
  const actorsFeed = isAgriMode ? agriActors : actors
  const techFeed = isAgriMode ? agriTechTags : techTags
  const brandPrefix = isAgriMode ? 'Agri' : 'Green'
  const heroTag = isAgriMode ? 'Agriculture × IoT × Traceability' : 'Blockchain × IoT × Climate Action'
  const heroHeadlineTop = isAgriMode ? 'Cultivating the' : 'Rewarding the'
  const heroHeadlineAccent = isAgriMode ? 'Future of Smart Farming' : "Planet's Defenders"
  const heroHeadlineBottom = isAgriMode ? 'On-Chain' : 'On-Chain'
  const heroSub = isAgriMode
    ? 'AgriBlock combines IoT telemetry and blockchain traceability to help farmers optimize inputs, improve yields, and build trust across the food supply chain.'
    : 'GreenBlock uses blockchain and IoT to create a transparent, incentive-driven ecosystem where governments, corporations, and citizens collectively reduce carbon emissions — and get rewarded for doing so.'
  const processTitle = isAgriMode ? 'How AgriBlock Works' : 'How GreenBlock Works'
  const processSummary = isAgriMode
    ? 'A practical flow that combines live farm sensing, advisory logic, and verifiable records to improve outcomes from field operations to market delivery.'
    : 'A multi-layered system combining democratic governance, IoT sensing, and blockchain automation to create accountable, incentivized climate action.'
  const platformTitle = isAgriMode ? 'Built for Agricultural Intelligence at Scale' : 'Built for Accountability at Scale'
  const platformSummary = isAgriMode
    ? "AgriBlock isn't just a dashboard — it's an operational intelligence layer that connects fields, markets, and regulators with trusted real-time data."
    : "GreenBlock isn't just a concept — it's a functional architecture that bridges the physical and digital worlds to enforce environmental accountability."
  const ecosystemSummary = isAgriMode
    ? 'AgriBlock unifies all agri stakeholders on one trusted network, from farm operations to post-harvest verification and downstream trade.'
    : 'GreenBlock is designed for every level of society. Each actor has a defined role, enforced by smart contracts and verified by the distributed ledger.'
  const technologySummary = isAgriMode
    ? 'AgriBlock combines proven distributed-ledger infrastructure with precision-agriculture tooling to deliver reliable farm intelligence at scale.'
    : 'GreenBlock leverages enterprise-grade blockchain technology alongside modern web tooling to deliver a secure, scalable, and auditable platform.'
  const ctaTitle = isAgriMode
    ? 'Build a Transparent, Data-Driven Agricultural Future'
    : 'Join the Movement Toward a Verifiable, Incentivized Planet'
  const ctaSummary = isAgriMode
    ? 'AgriBlock is looking for pilot farms, cooperatives, and agri-tech partners to scale from prototype to production-ready deployments.'
    : "GreenBlock is seeking funding, endorsement, and guidance to grow from prototype to production. Whether you're a government, corporation, or individual — there's a role for you on-chain."
  const footerDescription = isAgriMode
    ? 'An IoT + blockchain platform for precision agriculture, crop traceability, and trusted farm-to-market collaboration.'
    : 'A blockchain + IoT platform incentivising environment-friendly behaviour through transparent, automated carbon credit systems.'
  const blockRecordOne = isAgriMode ? 'FARM BASELINE SET' : 'GOV BASELINE SET'
  const blockRecordTwo = isAgriMode ? 'FIELD READING: SOIL MOISTURE +18%' : 'IOT READING: -14% CO₂'
  const blockRecordThree = isAgriMode ? 'ADVISORY ISSUED: IRRIGATION -12%' : 'CREDITS AWARDED: +250 CC'
  const blockRecordFour = isAgriMode ? 'BATCH VERIFIED: FARM → BUYER' : 'CREDIT TRADE: CORP → GOV'
  const visualNodeA = isAgriMode ? 'FARM' : 'GOV'
  const visualNodeB = isAgriMode ? 'CO-OP' : 'CORP'
  const visualNodeC = isAgriMode ? 'SENSOR' : 'IOT'
  const visualNodeD = isAgriMode ? 'BUYER' : 'CITIZEN'
  const visualNodeE = isAgriMode ? 'TRACE' : 'LEDGER'
  const footerLedgerStatus = isAgriMode
    ? 'LEDGER ACTIVE · TRACEABILITY NETWORK'
    : 'LEDGER ACTIVE · HYPERLEDGER SAWTOOTH'
  const devpostHref = 'https://devpost.com/software/greenblock'
  const devpostLabel = isAgriMode ? 'View Shared Devpost' : 'View on Devpost'
  const modeToggleLabel = isAgriMode ? 'Switch to GreenBlock' : 'Switch to AgriBlock'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return undefined
    }

    const hexPath = (x, y, radius) => {
      ctx.beginPath()
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI / 3) * index - Math.PI / 6
        const px = x + radius * Math.cos(angle)
        const py = y + radius * Math.sin(angle)
        if (index === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.closePath()
    }

    const drawHexGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const radius = 40
      const height = radius * Math.sqrt(3)
      const columns = Math.ceil(canvas.width / (radius * 1.5)) + 2
      const rows = Math.ceil(canvas.height / height) + 2

      for (let row = -1; row < rows; row += 1) {
        for (let column = -1; column < columns; column += 1) {
          const x = column * radius * 1.5
          const y = row * height + (column % 2 === 0 ? 0 : height / 2)
          hexPath(x, y, radius - 2)
          ctx.strokeStyle = 'rgba(82,183,136,0.06)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      drawHexGrid()
    }

    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    const observedElements = document.querySelectorAll('.step-card, .actor-card, .feature-item')

    if (prefersReducedMotion) {
      observedElements.forEach((element) => {
        element.style.opacity = ''
        element.style.transform = ''
        element.style.transition = ''
      })

      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }
        })
      },
      { threshold: 0.1 },
    )

    observedElements.forEach((element) => {
      element.style.opacity = '0'
      element.style.transform = 'translateY(20px)'
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [prefersReducedMotion, variant])

  useEffect(() => {
    const elements = document.querySelectorAll('.stat-num')

    if (prefersReducedMotion) {
      elements.forEach((element) => {
        element.textContent = element.dataset.finalValue || element.textContent || ''
      })

      return undefined
    }

    const intervalIds = []

    elements.forEach((element) => {
      const rawValue = element.textContent || ''
      const numericValue = Number.parseInt(rawValue, 10)
      if (Number.isNaN(numericValue)) {
        return
      }

      const suffixMatch = rawValue.match(/[^\d.]+$/)
      const suffix = suffixMatch ? suffixMatch[0] : ''
      let count = 0
      const step = numericValue / 40
      const intervalId = window.setInterval(() => {
        count = Math.min(count + step, numericValue)
        element.textContent = `${Math.floor(count)}${suffix}`
        if (count >= numericValue) {
          window.clearInterval(intervalId)
        }
      }, 40)

      intervalIds.push(intervalId)
    })

    return () => {
      intervalIds.forEach((intervalId) => window.clearInterval(intervalId))
    }
  }, [prefersReducedMotion, variant])

  return (
    <div className="landing-shell">
      <canvas ref={canvasRef} className="hex-canvas" aria-hidden="true" />

      <nav className="top-nav">
        <a href="#top" className="nav-logo">
          <svg className="logo-hex" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#40ff9a" strokeWidth="1.5" />
            <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" fill="rgba(64,255,154,0.12)" />
            <circle cx="18" cy="18" r="4" fill="#40ff9a" />
            <line x1="18" y1="8" x2="18" y2="14" stroke="#40ff9a" strokeWidth="1" opacity="0.5" />
            <line x1="27" y1="13" x2="22" y2="15.5" stroke="#40ff9a" strokeWidth="1" opacity="0.5" />
            <line x1="27" y1="23" x2="22" y2="20.5" stroke="#40ff9a" strokeWidth="1" opacity="0.5" />
            <line x1="18" y1="28" x2="18" y2="22" stroke="#40ff9a" strokeWidth="1" opacity="0.5" />
            <line x1="9" y1="23" x2="14" y2="20.5" stroke="#40ff9a" strokeWidth="1" opacity="0.5" />
            <line x1="9" y1="13" x2="14" y2="15.5" stroke="#40ff9a" strokeWidth="1" opacity="0.5" />
          </svg>
          <span className="logo-text">
            {brandPrefix}<span>Block</span>
          </span>
        </a>
        <ul className="nav-links">
          <li><a href="#how">How It Works</a></li>
          <li><a href="#features">Platform</a></li>
          <li><a href="#actors">Participants</a></li>
          <li><a href="#tech">Technology</a></li>
        </ul>
        <div className="nav-actions">
          <button
            type="button"
            className="nav-toggle"
            onClick={() => onToggle?.(nextMode)}
          >
            {modeToggleLabel}
          </button>
          <a className="nav-cta" href="#cta">Get Involved</a>
        </div>
      </nav>

      <main id="top">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-tag">{heroTag}</div>
            <h1>
              {heroHeadlineTop}
              <br />
              <span className="accent">{heroHeadlineAccent}</span>
              <br />
              {heroHeadlineBottom}
            </h1>
            <p className="hero-sub">{heroSub}</p>
            <div className="hero-actions">
              <a href="#how" className="btn-primary">Explore the Platform →</a>
              <a href={devpostHref} target="_blank" rel="noreferrer" className="btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {devpostLabel}
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <svg viewBox="0 0 700 600" xmlns="http://www.w3.org/2000/svg" fill="none">
              <defs>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#40ff9a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#40ff9a" stopOpacity="0" />
                </radialGradient>
                <filter id="blur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                </filter>
              </defs>

              <circle cx="350" cy="300" r="200" fill="url(#glowGrad)" />

              <g opacity="0.12" stroke="#74c69d" strokeWidth="1">
                <polygon points="200,80 234,60 268,80 268,120 234,140 200,120" />
                <polygon points="268,80 302,60 336,80 336,120 302,140 268,120" />
                <polygon points="336,80 370,60 404,80 404,120 370,140 336,120" />
                <polygon points="404,80 438,60 472,80 472,120 438,140 404,120" />
                <polygon points="472,80 506,60 540,80 540,120 506,140 472,120" />
                <polygon points="166,160 200,140 234,160 234,200 200,220 166,200" />
                <polygon points="234,160 268,140 302,160 302,200 268,220 234,200" />
                <polygon points="302,160 336,140 370,160 370,200 336,220 302,200" />
                <polygon points="370,160 404,140 438,160 438,200 404,220 370,200" />
                <polygon points="438,160 472,140 506,160 506,200 472,220 438,200" />
                <polygon points="506,160 540,140 574,160 574,200 540,220 506,200" />
                <polygon points="200,240 234,220 268,240 268,280 234,300 200,280" />
                <polygon points="268,240 302,220 336,240 336,280 302,300 268,280" />
                <polygon points="336,240 370,220 404,240 404,280 370,300 336,280" />
                <polygon points="404,240 438,220 472,240 472,280 438,300 404,280" />
                <polygon points="472,240 506,220 540,240 540,280 506,300 472,280" />
                <polygon points="166,320 200,300 234,320 234,360 200,380 166,360" />
                <polygon points="234,320 268,300 302,320 302,360 268,380 234,360" />
                <polygon points="302,320 336,300 370,320 370,360 336,380 302,360" />
                <polygon points="370,320 404,300 438,320 438,360 404,380 370,360" />
                <polygon points="438,320 472,300 506,320 506,360 472,380 438,360" />
                <polygon points="506,320 540,300 574,320 574,360 540,380 506,360" />
                <polygon points="200,400 234,380 268,400 268,440 234,460 200,440" />
                <polygon points="268,400 302,380 336,400 336,440 302,460 268,440" />
                <polygon points="336,400 370,380 404,400 404,440 370,460 336,440" />
                <polygon points="404,400 438,380 472,400 472,440 438,460 404,440" />
                <polygon points="472,400 506,380 540,400 540,440 506,460 472,440" />
              </g>

              <polygon points="302,160 336,140 370,160 370,200 336,220 302,200" fill="rgba(64,255,154,0.08)" stroke="#40ff9a" strokeWidth="1.5" />
              <polygon points="370,240 404,220 438,240 438,280 404,300 370,280" fill="rgba(64,255,154,0.08)" stroke="#40ff9a" strokeWidth="1.5" />
              <polygon points="234,320 268,300 302,320 302,360 268,380 234,360" fill="rgba(64,255,154,0.08)" stroke="#40ff9a" strokeWidth="1.5" />
              <polygon points="438,320 472,300 506,320 506,360 472,380 438,360" fill="rgba(64,255,154,0.06)" stroke="#74c69d" strokeWidth="1" />
              <polygon points="302,400 336,380 370,400 370,440 336,460 302,440" fill="rgba(64,255,154,0.06)" stroke="#74c69d" strokeWidth="1" />

              <g stroke="#40ff9a" strokeWidth="1" opacity="0.5" strokeDasharray="4,4">
                <line x1="336" y1="180" x2="404" y2="260" />
                <line x1="404" y1="260" x2="268" y2="340" />
                <line x1="268" y1="340" x2="472" y2="340" />
                <line x1="472" y1="340" x2="336" y2="420" />
              </g>

              <circle cx="336" cy="180" r="6" fill="#40ff9a" />
              <circle cx="404" cy="260" r="6" fill="#40ff9a" />
              <circle cx="268" cy="340" r="6" fill="#74c69d" />
              <circle cx="472" cy="340" r="6" fill="#74c69d" />
              <circle cx="336" cy="420" r="6" fill="#40ff9a" />

              <circle cx="336" cy="180" r="16" fill="#40ff9a" opacity="0.1" filter="url(#blur)" />
              <circle cx="404" cy="260" r="16" fill="#40ff9a" opacity="0.1" filter="url(#blur)" />
              <circle cx="336" cy="420" r="16" fill="#40ff9a" opacity="0.1" filter="url(#blur)" />

              <text x="348" y="176" fontFamily="Space Mono" fontSize="9" fill="#40ff9a" opacity="0.8">{visualNodeA}</text>
              <text x="416" y="256" fontFamily="Space Mono" fontSize="9" fill="#40ff9a" opacity="0.8">{visualNodeB}</text>
              <text x="232" y="336" fontFamily="Space Mono" fontSize="9" fill="#74c69d" opacity="0.8">{visualNodeC}</text>
              <text x="484" y="336" fontFamily="Space Mono" fontSize="9" fill="#74c69d" opacity="0.8">{visualNodeD}</text>
              <text x="344" y="432" fontFamily="Space Mono" fontSize="9" fill="#40ff9a" opacity="0.8">{visualNodeE}</text>

              <circle cx="336" cy="180" r="20" fill="none" stroke="#40ff9a" strokeWidth="1" opacity="0.3">
                {!prefersReducedMotion && (
                  <>
                    <animate attributeName="r" values="12;28;12" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                  </>
                )}
              </circle>
              <circle cx="404" cy="260" r="20" fill="none" stroke="#40ff9a" strokeWidth="1" opacity="0.3">
                {!prefersReducedMotion && (
                  <>
                    <animate attributeName="r" values="12;28;12" dur="3s" begin="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" begin="1s" repeatCount="indefinite" />
                  </>
                )}
              </circle>
              <circle cx="336" cy="420" r="20" fill="none" stroke="#40ff9a" strokeWidth="1" opacity="0.3">
                {!prefersReducedMotion && (
                  <>
                    <animate attributeName="r" values="12;28;12" dur="3s" begin="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" begin="2s" repeatCount="indefinite" />
                  </>
                )}
              </circle>
            </svg>
          </div>
        </section>

        <div className="ticker">
          <div className="ticker-track">
            {Array.from({ length: 2 }).flatMap((_, loopIndex) =>
              tickerFeed.map((item) => (
                <span className="ticker-item" key={`${loopIndex}-${item}`}>
                  <span>✦</span>
                  {item}
                </span>
              )),
            )}
          </div>
        </div>

        <div className="stats-bar">
          {statsFeed.map((stat) => (
            <div className="stat-item" key={stat.label}>
              <span className="stat-num" data-final-value={stat.value}>{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <section className="how-it-works" id="how">
          <div className="section-label">Process</div>
          <h2 className="section-title">{processTitle}</h2>
          <p className="section-desc">{processSummary}</p>

          <div className="steps-grid">
            {stepsFeed.map((step) => (
              <article className="step-card" key={step.title}>
                <div className="step-num">{step.number}</div>
                <div className="step-icon">{renderStepIcon(step.icon)}</div>
                <div className="step-title">{step.title}</div>
                <p className="step-desc">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="features-inner">
            <div>
              <div className="section-label">Platform</div>
              <h2 className="section-title">{platformTitle}</h2>
              <p className="section-desc">{platformSummary}</p>

              <div className="feature-list">
                {featuresFeed.map((feature) => (
                  <div className="feature-item" key={feature.title}>
                    <div className="feature-icon-wrap">{renderFeatureIcon(feature.icon)}</div>
                    <div className="feature-text">
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="blockchain-visual" aria-hidden="true">
              <svg viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg" fill="none">
                <defs>
                  <linearGradient id="blockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1a3d28" />
                    <stop offset="100%" stopColor="#0e2015" />
                  </linearGradient>
                </defs>

                <rect x="60" y="20" width="280" height="90" fill="url(#blockGrad)" stroke="#2d6a4f" strokeWidth="1.5" rx="2" />
                <rect x="60" y="20" width="280" height="3" fill="#40ff9a" opacity="0.7" rx="2" />
                <text x="80" y="50" fontFamily="Space Mono" fontSize="8" fill="#40ff9a" opacity="0.7" letterSpacing="0.1em">BLOCK #00421</text>
                <text x="80" y="68" fontFamily="Space Mono" fontSize="9" fill="#d8f3dc">{blockRecordOne}</text>
                <text x="80" y="84" fontFamily="Space Mono" fontSize="7" fill="#74c69d" opacity="0.6">HASH: 0x8f4a2c...</text>
                <circle cx="360" cy="65" r="8" fill="rgba(64,255,154,0.15)" stroke="#40ff9a" strokeWidth="1" />
                <text x="356" y="69" fontFamily="Space Mono" fontSize="8" fill="#40ff9a">✓</text>

                <line x1="200" y1="110" x2="200" y2="145" stroke="#40ff9a" strokeWidth="1.5" strokeDasharray="4,3" />
                <polygon points="196,142 204,142 200,150" fill="#40ff9a" />

                <rect x="60" y="150" width="280" height="90" fill="url(#blockGrad)" stroke="#2d6a4f" strokeWidth="1.5" rx="2" />
                <rect x="60" y="150" width="280" height="3" fill="#74c69d" opacity="0.7" rx="2" />
                <text x="80" y="180" fontFamily="Space Mono" fontSize="8" fill="#74c69d" opacity="0.7" letterSpacing="0.1em">BLOCK #00422</text>
                <text x="80" y="198" fontFamily="Space Mono" fontSize="9" fill="#d8f3dc">{blockRecordTwo}</text>
                <text x="80" y="214" fontFamily="Space Mono" fontSize="7" fill="#74c69d" opacity="0.6">HASH: 0x2e9d1f...</text>
                <circle cx="360" cy="195" r="8" fill="rgba(64,255,154,0.15)" stroke="#40ff9a" strokeWidth="1" />
                <text x="356" y="199" fontFamily="Space Mono" fontSize="8" fill="#40ff9a">✓</text>

                <line x1="200" y1="240" x2="200" y2="275" stroke="#40ff9a" strokeWidth="1.5" strokeDasharray="4,3" />
                <polygon points="196,272 204,272 200,280" fill="#40ff9a" />

                <rect x="60" y="280" width="280" height="90" fill="url(#blockGrad)" stroke="#40ff9a" strokeWidth="1.5" rx="2" />
                <rect x="60" y="280" width="280" height="3" fill="#40ff9a" rx="2" />
                <text x="80" y="310" fontFamily="Space Mono" fontSize="8" fill="#40ff9a" opacity="0.7" letterSpacing="0.1em">BLOCK #00423</text>
                <text x="80" y="328" fontFamily="Space Mono" fontSize="9" fill="#40ff9a">{blockRecordThree}</text>
                <text x="80" y="344" fontFamily="Space Mono" fontSize="7" fill="#74c69d" opacity="0.6">HASH: 0x7a3b8e...</text>
                <circle cx="360" cy="325" r="8" fill="rgba(64,255,154,0.3)" stroke="#40ff9a" strokeWidth="1.5" />
                <text x="356" y="329" fontFamily="Space Mono" fontSize="8" fill="#40ff9a">✓</text>

                <rect x="60" y="280" width="280" height="90" fill="none" stroke="#40ff9a" strokeWidth="0.5" rx="2" opacity="0.3">
                  {!prefersReducedMotion && (
                    <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
                  )}
                </rect>

                <line x1="200" y1="370" x2="200" y2="405" stroke="#40ff9a" strokeWidth="1.5" strokeDasharray="4,3" />
                <polygon points="196,402 204,402 200,410" fill="#40ff9a" />

                <rect x="60" y="410" width="280" height="90" fill="url(#blockGrad)" stroke="#2d6a4f" strokeWidth="1.5" rx="2" />
                <rect x="60" y="410" width="280" height="3" fill="#52b788" opacity="0.7" rx="2" />
                <text x="80" y="440" fontFamily="Space Mono" fontSize="8" fill="#52b788" opacity="0.7" letterSpacing="0.1em">BLOCK #00424</text>
                <text x="80" y="458" fontFamily="Space Mono" fontSize="9" fill="#d8f3dc">{blockRecordFour}</text>
                <text x="80" y="474" fontFamily="Space Mono" fontSize="7" fill="#74c69d" opacity="0.6">HASH: 0xf1c4a9... (PENDING)</text>
                <circle cx="360" cy="455" r="8" fill="rgba(82,183,136,0.1)" stroke="#52b788" strokeWidth="1" />
                <text x="356" y="459" fontFamily="Space Mono" fontSize="8" fill="#52b788">⋯</text>
              </svg>
            </div>
          </div>
        </section>

        <section className="actors" id="actors">
          <div className="section-label">Ecosystem</div>
          <h2 className="section-title">Who Participates</h2>
          <p className="section-desc">{ecosystemSummary}</p>

          <div className="actors-grid">
            {actorsFeed.map((actor) => (
              <article className="actor-card" key={actor.name}>
                <span className="actor-icon" aria-hidden="true">{actor.icon}</span>
                <div className="actor-name">{actor.name}</div>
                <p className="actor-role">{actor.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="tech">
          <div className="section-label">Technology</div>
          <h2 className="section-title">Built on Proven Infrastructure</h2>
          <p className="section-desc">{technologySummary}</p>

          <div className="tech-row">
            {techFeed.map((tag) => (
              <span className="tech-tag" key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        <section className="cta-section" id="cta">
          <div className="section-label section-label-center">Get Involved</div>
          <h2 className="section-title">{ctaTitle}</h2>
          <p className="section-desc">{ctaSummary}</p>
          <div className="cta-actions">
            <a href={devpostHref} target="_blank" rel="noreferrer" className="btn-primary">{devpostLabel}</a>
            <a href="mailto:anup@anupmazumdar.me" className="btn-secondary">Contact the Team →</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#top" className="nav-logo footer-logo">
              <svg className="logo-hex" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#40ff9a" strokeWidth="1.5" />
                <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" fill="rgba(64,255,154,0.12)" />
                <circle cx="18" cy="18" r="4" fill="#40ff9a" />
              </svg>
              <span className="logo-text">
                {brandPrefix}<span>Block</span>
              </span>
            </a>
            <p>{footerDescription}</p>
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
          <span className="footer-copy">© 2026 {brandPrefix}Block · Anup Mazumdar · All Rights Reserved</span>
          <div className="footer-chain">
            <div className="chain-dot" />
            {footerLedgerStatus}
          </div>
        </div>
      </footer>
    </div>
  )
}

function renderStepIcon(icon) {
  switch (icon) {
    case 'governance':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="none" stroke="#40ff9a" strokeWidth="1.5" />
          <line x1="24" y1="4" x2="24" y2="44" stroke="#40ff9a" strokeWidth="0.75" opacity="0.4" strokeDasharray="3,3" />
          <line x1="6" y1="14" x2="42" y2="34" stroke="#40ff9a" strokeWidth="0.75" opacity="0.4" strokeDasharray="3,3" />
          <line x1="42" y1="14" x2="6" y2="34" stroke="#40ff9a" strokeWidth="0.75" opacity="0.4" strokeDasharray="3,3" />
          <circle cx="24" cy="24" r="5" fill="#40ff9a" opacity="0.9" />
        </svg>
      )
    case 'sensing':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="16" y="8" width="16" height="22" rx="2" stroke="#40ff9a" strokeWidth="1.5" />
          <line x1="24" y1="30" x2="24" y2="40" stroke="#40ff9a" strokeWidth="1.5" />
          <line x1="18" y1="40" x2="30" y2="40" stroke="#40ff9a" strokeWidth="1.5" />
          <path d="M8 19 Q8 8 24 8" stroke="#74c69d" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
          <path d="M40 19 Q40 8 24 8" stroke="#74c69d" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
          <circle cx="24" cy="20" r="4" fill="rgba(64,255,154,0.2)" stroke="#40ff9a" strokeWidth="1" />
          <circle cx="24" cy="20" r="1.5" fill="#40ff9a" />
        </svg>
      )
    case 'incentives':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18" fill="rgba(64,255,154,0.15)" stroke="#40ff9a" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="3" fill="#40ff9a" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="28" width="8" height="16" fill="rgba(64,255,154,0.2)" stroke="#40ff9a" strokeWidth="1.5" />
          <rect x="16" y="20" width="8" height="24" fill="rgba(64,255,154,0.2)" stroke="#40ff9a" strokeWidth="1.5" />
          <rect x="28" y="12" width="8" height="32" fill="rgba(64,255,154,0.2)" stroke="#40ff9a" strokeWidth="1.5" />
          <rect x="40" y="4" width="4" height="40" fill="rgba(64,255,154,0.2)" stroke="#40ff9a" strokeWidth="1.5" />
          <polyline points="4,26 20,16 32,10 44,4" stroke="#40ff9a" strokeWidth="1.5" strokeDasharray="3,2" />
        </svg>
      )
  }
}

function renderFeatureIcon(icon) {
  switch (icon) {
    case 'shield':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#40ff9a" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case 'signal':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#40ff9a" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      )
    case 'screen':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#40ff9a" strokeWidth="1.5" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      )
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#40ff9a" strokeWidth="1.5" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    handleChange()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReducedMotion
}
