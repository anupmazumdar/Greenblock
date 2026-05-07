import { useState, useEffect } from 'react'

const S = {
  card: { background: '#111c11', border: '1px solid #1e2e1e', borderRadius: '10px', padding: '20px' },
  label: { fontSize: '10px', letterSpacing: '0.14em', color: '#6b7e6b', textTransform: 'uppercase', marginBottom: '6px' },
  badge: (color) => ({
    background: `${color}18`, border: `1px solid ${color}44`, color, borderRadius: '4px',
    padding: '2px 8px', fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'monospace', display: 'inline-block',
  }),
  row: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' },
  metric: { background: '#0a0f0a', borderRadius: '6px', padding: '12px', flex: 1 },
  metricLabel: { fontSize: '10px', color: '#6b7e6b', letterSpacing: '0.1em' },
  metricValue: (color = '#4ade80') => ({ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color }),
}

export default function MRVReport() {
  const [report, setReport] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calcForm, setCalcForm] = useState({ baseline: '1200', actual: '738' })

  useEffect(() => {
    Promise.all([
      fetch('/api/blockchain/mrv-report').then(r => r.json()).catch(() => null),
      fetch('/api/blockchain/market-stats').then(r => r.json()).catch(() => null),
    ]).then(([r, m]) => {
      setReport(r)
      setEstimate(m)
    }).finally(() => setLoading(false))
  }, [])

  async function handleCalc(e) {
    e.preventDefault()
    const res = await fetch('/api/blockchain/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kwh_baseline_month: parseFloat(calcForm.baseline),
        kwh_actual_month: parseFloat(calcForm.actual),
        building_id: 'GREENBLOCK_B01',
      }),
    }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setEstimate(prev => ({ ...prev, calc: data }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Legal Framework Banner */}
      <div style={{ ...S.card, background: '#0a1a0a', borderColor: '#4ade8033' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={S.badge('#4ade80')}>CCTS 2023</span>
          <span style={S.badge('#22d3ee')}>Energy Conservation Amendment Act 2022</span>
          <span style={S.badge('#f59e0b')}>BEE · MoPower</span>
          <span style={S.badge('#c084fc')}>Verra VCS Compatible</span>
        </div>
        <div style={{ fontSize: '11px', color: '#6b7e6b', lineHeight: '1.8' }}>
          <strong style={{ color: '#c8d8c8' }}>Legal Basis:</strong> Carbon Credit Trading Scheme notified via S.O. 2825(E), 28 June 2023, under powers from Section 14(w) of the Energy Conservation (Amendment) Act 2022.
          GreenBlock qualifies for the <strong style={{ color: '#4ade80' }}>Voluntary Offset Mechanism</strong> (non-obligated entities).
          Compliance targets currently apply to 9 heavy industries (Aluminium, Cement, Steel, Paper, Chlor-Alkali, Fertiliser, Refinery, Petrochemical, Textile).
          Voluntary market for buildings launches <strong style={{ color: '#22d3ee' }}>2025–26</strong>, trading on IEX.
        </div>
      </div>

      {/* Credit Calculator */}
      <div style={S.card}>
        <div style={S.label}>Live Credit Calculator</div>
        <form onSubmit={handleCalc} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '12px' }}>
          <div>
            <div style={S.label}>Baseline kWh/Month</div>
            <input style={{ background: '#0a0f0a', border: '1px solid #1e2e1e', color: '#c8d8c8', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace', width: '140px' }}
              type="number" value={calcForm.baseline} onChange={e => setCalcForm(f => ({ ...f, baseline: e.target.value }))} />
          </div>
          <div>
            <div style={S.label}>Actual kWh/Month</div>
            <input style={{ background: '#0a0f0a', border: '1px solid #1e2e1e', color: '#c8d8c8', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace', width: '140px' }}
              type="number" value={calcForm.actual} onChange={e => setCalcForm(f => ({ ...f, actual: e.target.value }))} />
          </div>
          <button type="submit" style={{ background: '#4ade80', border: 'none', color: '#050f05', borderRadius: '6px', padding: '9px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.08em' }}>
            Calculate
          </button>
        </form>

        {estimate?.calc && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '16px' }}>
            <div style={S.metric}>
              <div style={S.metricLabel}>kWh Saved</div>
              <div style={S.metricValue('#4ade80')}>{estimate.calc.kwh_saved}</div>
              <div style={{ fontSize: '10px', color: '#6b7e6b' }}>{estimate.calc.saving_pct}% reduction</div>
            </div>
            <div style={S.metric}>
              <div style={S.metricLabel}>CO₂ Avoided</div>
              <div style={S.metricValue('#22d3ee')}>{estimate.calc.kg_co2_avoided} kg</div>
              <div style={{ fontSize: '10px', color: '#6b7e6b' }}>0.82 kg/kWh × saved</div>
            </div>
            <div style={S.metric}>
              <div style={S.metricLabel}>GBT Earned</div>
              <div style={S.metricValue('#f59e0b')}>{estimate.calc.gbt_earned}</div>
              <div style={{ fontSize: '10px', color: '#6b7e6b' }}>1 GBT = 1 kg CO₂</div>
            </div>
            <div style={S.metric}>
              <div style={S.metricLabel}>CCC Equivalent</div>
              <div style={S.metricValue('#c084fc')}>{estimate.calc.ccc_equivalent}</div>
              <div style={{ fontSize: '10px', color: '#6b7e6b' }}>1 CCC = 1 tonne CO₂</div>
            </div>
          </div>
        )}
      </div>

      {/* Full MRV Report */}
      {loading && <div style={{ color: '#6b7e6b', fontFamily: 'monospace', fontSize: '12px' }}>Loading MRV report...</div>}

      {report && (
        <>
          {/* Measurements */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={S.label}>MRV Report — {report.period?.start} to {report.period?.end}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={S.badge('#4ade80')}>v{report.version?.split(' ').pop()}</span>
                <span style={S.badge('#22d3ee')}>Scope 2</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <div style={S.metric}>
                <div style={S.metricLabel}>Baseline kWh/Mo</div>
                <div style={S.metricValue('#c8d8c8')}>{report.measurements?.baseline_kwh_month}</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>Actual kWh/Mo</div>
                <div style={S.metricValue('#c8d8c8')}>{report.measurements?.actual_kwh_month}</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>kWh Saved</div>
                <div style={S.metricValue('#4ade80')}>{report.measurements?.kwh_saved}</div>
                <div style={{ fontSize: '10px', color: '#6b7e6b' }}>{report.measurements?.saving_pct}% saving</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>Solar Generation</div>
                <div style={S.metricValue('#f59e0b')}>{report.measurements?.solar_generation_kwh} kWh</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>HVAC Savings</div>
                <div style={S.metricValue('#22d3ee')}>{report.measurements?.hvac_optimisation_kwh} kWh</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>Occupancy Savings</div>
                <div style={S.metricValue('#c084fc')}>{report.measurements?.occupancy_based_kwh} kWh</div>
              </div>
            </div>
          </div>

          {/* Carbon Calculations */}
          <div style={S.card}>
            <div style={S.label}>Carbon Calculations</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '12px' }}>
              <div style={S.metric}>
                <div style={S.metricLabel}>kg CO₂ Avoided</div>
                <div style={S.metricValue('#4ade80')}>{report.carbon_calculations?.kg_co2_avoided}</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>Tonnes CO₂ Avoided</div>
                <div style={S.metricValue('#22d3ee')}>{report.carbon_calculations?.tonnes_co2_avoided}</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>GBT Tokens Earned</div>
                <div style={S.metricValue('#f59e0b')}>{report.carbon_calculations?.gbt_earned}</div>
              </div>
              <div style={S.metric}>
                <div style={S.metricLabel}>CCC Equivalent</div>
                <div style={S.metricValue('#c084fc')}>{report.carbon_calculations?.ccc_equivalent}</div>
                <div style={{ fontSize: '10px', color: '#6b7e6b' }}>India CCTS unit</div>
              </div>
            </div>
          </div>

          {/* Methodology */}
          <div style={S.card}>
            <div style={S.label}>Methodology & Legal Context</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7e6b', fontWeight: 700, marginBottom: '8px' }}>MEASUREMENT APPROACH</div>
                {[
                  ['Emission Factor', `${report.methodology?.emission_factor_kg_per_kwh} kg CO₂/kWh (CEA 2023)`],
                  ['Standard', report.methodology?.standard],
                  ['Scope', report.methodology?.scope],
                  ['CCTS Mechanism', report.methodology?.ccts_mechanism],
                ].map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7e6b' }}>{k}: </span>
                    <span style={{ fontSize: '11px', color: '#c8d8c8', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7e6b', fontWeight: 700, marginBottom: '8px' }}>INDIA LEGAL FRAMEWORK</div>
                {report.legal_context && Object.entries(report.legal_context).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7e6b', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}: </span>
                    <span style={{ fontSize: '11px', color: '#c8d8c8', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7e6b', fontWeight: 700, marginBottom: '8px' }}>VERIFICATION</div>
                {report.verification && Object.entries(report.verification).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7e6b', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}: </span>
                    <span style={{ fontSize: '11px', color: k === 'anomaly_check' ? '#4ade80' : '#c8d8c8', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* IoT Sensors */}
          <div style={S.card}>
            <div style={S.label}>IoT Sensor Infrastructure</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {report.building?.sensors?.map(s => (
                <span key={s} style={S.badge('#4ade80')}>{s}</span>
              ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#6b7e6b' }}>
              Platform: {report.building?.iot_platform} · Location: {report.building?.location}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
