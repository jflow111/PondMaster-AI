import React, { useState, useRef, useEffect } from 'react';

const C = {
  bg: '#020c18',
  depth1: '#041424',
  depth2: '#061d30',
  depth3: '#08253d',
  border: '#0e3a5c',
  borderLight: '#1a5a80',
  accent: '#0ea5e9',
  accentDim: '#0369a1',
  koi: '#f97316',
  koiDim: '#c2570a',
  success: '#10b981',
  error: '#ef4444',
  text: '#e0f2fe',
  textDim: '#7ec8e3',
  muted: '#2d6a8a',
  font: "'Courier New', Courier, monospace",
  sans: "'Segoe UI', system-ui, sans-serif",
};

const AGENTS = [
  { id: 'intake', label: 'Intake', icon: '◎' },
  { id: 'estimator', label: 'Estimator', icon: '◈' },
  { id: 'equipment', label: 'Equipment', icon: '◉' },
  { id: 'labor', label: 'Labor', icon: '◍' },
  { id: 'proposal', label: 'Proposal', icon: '◆' },
];

const agentOrder = ['Intake Agent', 'Estimator Agent', 'Equipment Agent', 'Labor Planner', 'Proposal Writer'];

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: ${C.bg}; }
  #root { height: 100%; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${C.depth1}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.accentDim}; }

  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  @keyframes waterflow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  textarea::placeholder { color: ${C.muted}; }
  textarea:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 2px rgba(14,165,233,0.15) !important; }
  button:hover { filter: brightness(1.1); }

  .agent-card {
    transition: all 0.3s ease;
  }
  .agent-card.running {
    box-shadow: 0 0 12px rgba(249,115,22,0.4);
    border-color: ${C.koi} !important;
  }
  .agent-card.complete {
    box-shadow: 0 0 8px rgba(16,185,129,0.3);
    border-color: ${C.success} !important;
  }
  .run-btn:not(:disabled):hover {
    box-shadow: 0 0 20px rgba(249,115,22,0.5);
    transform: translateY(-1px);
  }
  .run-btn { transition: all 0.2s ease; }
  .tab-btn { transition: all 0.2s ease; }
  .tab-btn:hover { filter: brightness(1.2); }
  .msg-animate { animation: fadeIn 0.3s ease; }
`;

function WaterBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* Deep water gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 20% 80%, #041e36 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, #031525 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 50%, #020c18 0%, #010810 100%)`,
      }} />
      {/* Subtle caustic light patterns */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `radial-gradient(ellipse 80px 40px at 15% 30%, #0ea5e9 0%, transparent 100%),
                          radial-gradient(ellipse 60px 30px at 70% 60%, #0ea5e9 0%, transparent 100%),
                          radial-gradient(ellipse 100px 50px at 45% 80%, #0284c7 0%, transparent 100%)`,
        animation: 'waterflow 12s ease infinite',
        backgroundSize: '200% 200%',
      }} />
    </div>
  );
}

function AgentBar({ agentStatuses }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '10px 20px',
      background: `linear-gradient(180deg, ${C.depth2} 0%, ${C.depth1} 100%)`,
      borderBottom: `1px solid ${C.border}`,
      overflowX: 'auto',
    }}>
      {AGENTS.map((a, i) => {
        const st = agentStatuses[agentOrder[i]] || 'idle';
        const isRunning = st === 'running';
        const isComplete = st === 'complete';
        return (
          <div key={a.id}
            className={`agent-card ${st}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              border: `1px solid ${isComplete ? C.success : isRunning ? C.koi : C.border}`,
              borderRadius: 20,
              background: isComplete
                ? 'rgba(16,185,129,0.08)'
                : isRunning
                ? 'rgba(249,115,22,0.1)'
                : 'rgba(4,20,36,0.8)',
              flex: '0 0 auto',
            }}>
            <span style={{
              fontSize: 12,
              color: isComplete ? C.success : isRunning ? C.koi : C.muted,
              animation: isRunning ? 'pulse 1s infinite' : 'none',
            }}>
              {a.icon}
            </span>
            <span style={{
              fontFamily: C.sans, fontSize: 12, fontWeight: 500,
              color: isComplete ? C.success : isRunning ? C.koi : C.textDim,
              letterSpacing: 0.3,
            }}>
              {a.label}
            </span>
            <span style={{
              fontSize: 9, fontFamily: C.font,
              color: isComplete ? C.success : isRunning ? C.koi : C.muted,
              letterSpacing: 1,
            }}>
              {st.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LaborBanner({ laborRate, setLaborRate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(laborRate));
  const save = () => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) setLaborRate(n);
    setEditing(false);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '7px 20px',
      background: `linear-gradient(90deg, rgba(14,165,233,0.06) 0%, transparent 100%)`,
      borderBottom: `1px solid ${C.border}`,
      fontFamily: C.sans, fontSize: 12,
    }}>
      <span style={{ color: C.accent, fontSize: 11, letterSpacing: 1, fontWeight: 600 }}>
        LABOR RATE
      </span>
      {editing ? (
        <>
          <span style={{ color: C.muted }}>$</span>
          <input value={val} onChange={e => setVal(e.target.value)}
            onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} autoFocus
            style={{
              background: C.depth2, border: `1px solid ${C.accent}`,
              color: C.text, fontFamily: C.font, fontSize: 13,
              padding: '2px 8px', width: 70, borderRadius: 4, outline: 'none',
            }} />
          <span style={{ color: C.muted }}>/hr</span>
          <button onClick={save} style={{
            background: C.accent, color: '#fff', border: 'none',
            fontFamily: C.sans, fontSize: 11, fontWeight: 600,
            padding: '3px 10px', cursor: 'pointer', borderRadius: 4,
          }}>Set</button>
        </>
      ) : (
        <>
          <span style={{
            color: C.text, fontSize: 15, fontWeight: 700,
            fontFamily: C.font,
          }}>
            ${laborRate}<span style={{ color: C.textDim, fontSize: 11 }}>/hr</span>
          </span>
          <button onClick={() => setEditing(true)} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: C.sans, fontSize: 10,
            padding: '2px 8px', cursor: 'pointer', borderRadius: 4,
          }}>edit</button>
        </>
      )}
      <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 11 }}>
        Set your shop rate before running
      </span>
    </div>
  );
}

function ChatTab({ messages, input, setInput, onRun, running }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center', marginTop: 60,
            animation: 'fadeIn 0.6s ease',
          }}>
            <div style={{
              fontSize: 48, marginBottom: 16,
              animation: 'float 4s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(14,165,233,0.3))',
            }}>🐟</div>
            <div style={{
              fontFamily: C.sans, fontSize: 28, fontWeight: 700,
              background: `linear-gradient(135deg, ${C.accent} 0%, #38bdf8 50%, ${C.koi} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 8,
            }}>
              PondMaster AI
            </div>
            <div style={{ color: C.textDim, fontFamily: C.sans, fontSize: 14, marginBottom: 6 }}>
              Professional Pond Construction Estimator
            </div>
            <div style={{
              color: C.muted, fontFamily: C.sans, fontSize: 13, lineHeight: 1.8,
              maxWidth: 400, margin: '0 auto', marginTop: 16,
              padding: '16px 20px',
              background: 'rgba(14,165,233,0.04)',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}>
              Describe your pond project below.<br />
              The 5-agent AI pipeline will generate a<br />
              complete estimate and proposal instantly.
            </div>
            <div style={{ marginTop: 20, color: C.muted, fontSize: 12, fontFamily: C.font, letterSpacing: 1 }}>
              ── EXAMPLE ──
            </div>
            <div style={{
              marginTop: 10, color: C.textDim, fontSize: 12, fontFamily: C.font,
              fontStyle: 'italic', lineHeight: 1.7,
            }}>
              "16x12 koi pond, 3ft deep, natural rock<br />waterfall, heavy fish load, sloped backyard"
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="msg-animate" style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '78%',
          }}>
            <div style={{
              background: m.role === 'user'
                ? `linear-gradient(135deg, #0c2a45 0%, #0a1e35 100%)`
                : `linear-gradient(135deg, ${C.depth2} 0%, ${C.depth3} 100%)`,
              border: `1px solid ${m.role === 'user' ? C.accentDim : C.border}`,
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '12px 16px',
              fontFamily: m.role === 'ai' ? C.font : C.sans,
              fontSize: 13, color: C.text, lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              boxShadow: m.role === 'user'
                ? '0 4px 20px rgba(14,165,233,0.1)'
                : '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {m.content}
            </div>
            <div style={{
              fontSize: 10, color: C.muted, marginTop: 4,
              fontFamily: C.sans, textAlign: m.role === 'user' ? 'right' : 'left',
            }}>
              {m.role === 'user' ? '👷 Contractor' : '🤖 PondMaster AI'} · {m.time}
            </div>
          </div>
        ))}

        {running && (
          <div className="msg-animate" style={{
            alignSelf: 'flex-start',
            padding: '12px 16px',
            border: `1px solid ${C.koi}`,
            borderRadius: '16px 16px 16px 4px',
            background: 'rgba(249,115,22,0.08)',
            fontFamily: C.font, fontSize: 12, color: C.koi,
            boxShadow: '0 0 20px rgba(249,115,22,0.15)',
            animation: 'pulse 1.5s infinite',
          }}>
            ◈ Running 5-agent pipeline...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 24px',
        background: `linear-gradient(180deg, transparent 0%, ${C.depth1} 100%)`,
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe the pond project... size, depth, waterfall, fish load, site conditions, aesthetic goals"
            disabled={running}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) onRun(); }}
            style={{
              flex: 1,
              background: C.depth2,
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: C.sans, fontSize: 13,
              padding: '12px 16px',
              borderRadius: 12, resize: 'vertical', minHeight: 72,
              outline: 'none', lineHeight: 1.6,
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
          <button
            onClick={onRun}
            disabled={running || !input.trim()}
            className="run-btn"
            style={{
              background: running || !input.trim()
                ? C.depth3
                : `linear-gradient(135deg, ${C.koi} 0%, #ea580c 100%)`,
              color: running || !input.trim() ? C.muted : '#fff',
              border: `1px solid ${running || !input.trim() ? C.border : C.koiDim}`,
              fontFamily: C.sans, fontSize: 13, fontWeight: 700,
              padding: '0 24px', height: 72,
              cursor: running || !input.trim() ? 'not-allowed' : 'pointer',
              borderRadius: 12, minWidth: 100, letterSpacing: 0.5,
            }}
          >
            {running ? '⟳ Running' : '▶ Run'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginTop: 8 }}>
          Ctrl+Enter to run · 5 AI agents process your description in sequence
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{
          fontFamily: C.sans, fontSize: 12, fontWeight: 700,
          color: C.accent, letterSpacing: 1, textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '6px 0', borderBottom: `1px solid rgba(14,58,92,0.4)`,
    }}>
      <span style={{ fontFamily: C.sans, fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{
        fontFamily: C.font, fontSize: 12,
        color: accent ? C.koi : C.text, fontWeight: accent ? 'bold' : 'normal',
      }}>{value}</span>
    </div>
  );
}

function CostRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: highlight ? '10px 0' : '6px 0',
      borderBottom: highlight ? 'none' : `1px solid rgba(14,58,92,0.4)`,
      marginTop: highlight ? 4 : 0,
    }}>
      <span style={{
        fontFamily: C.sans, fontSize: highlight ? 14 : 12,
        color: highlight ? C.koi : C.muted,
        fontWeight: highlight ? 700 : 400,
      }}>{label}</span>
      <span style={{
        fontFamily: C.font, fontSize: highlight ? 16 : 12,
        color: highlight ? C.koi : C.text,
        fontWeight: highlight ? 700 : 400,
      }}>{value}</span>
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString();
}

function ProposalTab({ data }) {
  if (!data) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12,
      }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
        <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 14 }}>
          No proposal yet — run the pipeline from the Chat tab
        </div>
      </div>
    );
  }

  const { intake, calc, equipment, labor, proposal } = data;

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '24px 28px' }}>

      {/* Header */}
      <div style={{
        textAlign: 'center', marginBottom: 32, padding: '24px',
        background: `linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(249,115,22,0.06) 100%)`,
        border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🐟</div>
        <div style={{
          fontFamily: C.sans, fontSize: 24, fontWeight: 800,
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.koi} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: 6,
        }}>
          {proposal?.project_title || 'Pond Construction Proposal'}
        </div>
        <div style={{ color: C.muted, fontFamily: C.sans, fontSize: 11, letterSpacing: 2 }}>
          GENERATED BY PONDMASTER AI · 5-AGENT PIPELINE
        </div>
      </div>

      {/* Summary */}
      {proposal?.executive_summary && (
        <Section title="Executive Summary" icon="📝">
          <div style={{
            fontFamily: C.sans, fontSize: 13, color: C.textDim,
            lineHeight: 1.9, padding: '12px 16px',
            background: 'rgba(14,165,233,0.04)', borderRadius: 8,
            border: `1px solid rgba(14,58,92,0.5)`,
          }}>
            {proposal.executive_summary}
          </div>
        </Section>
      )}

      {/* Cost Breakdown — prominent */}
      {proposal?.cost_breakdown && (
        <Section title="Cost Estimate" icon="💰">
          <div style={{
            background: `linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.04) 100%)`,
            border: `1px solid rgba(249,115,22,0.2)`,
            borderRadius: 12, padding: '16px 20px', marginBottom: 8,
          }}>
            <CostRow label="Excavation" value={fmt(proposal.cost_breakdown.excavation)} />
            <CostRow label="Liner & Underlayment" value={fmt(proposal.cost_breakdown.liner_underlayment)} />
            <CostRow label="Rock & Gravel" value={fmt(proposal.cost_breakdown.rock_gravel)} />
            <CostRow label="Equipment" value={fmt(proposal.cost_breakdown.equipment)} />
            <CostRow label="Plumbing" value={fmt(proposal.cost_breakdown.plumbing)} />
            <CostRow label="Electrical" value={fmt(proposal.cost_breakdown.electrical)} />
            <CostRow label="Labor" value={fmt(proposal.cost_breakdown.labor)} />
            <CostRow label="Overhead & Profit" value={fmt(proposal.cost_breakdown.overhead_profit)} />
            <div style={{ borderTop: `1px solid rgba(249,115,22,0.3)`, marginTop: 8 }} />
            <CostRow label="TOTAL (LOW)" value={fmt(proposal.cost_breakdown.total_low)} highlight />
            <CostRow label="TOTAL (HIGH)" value={fmt(proposal.cost_breakdown.total_high)} highlight />
          </div>
        </Section>
      )}

      {/* Pond Specs */}
      <Section title="Pond Specifications" icon="🌊">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px',
          background: 'rgba(14,165,233,0.03)', borderRadius: 8,
          border: `1px solid rgba(14,58,92,0.5)`, padding: '4px 16px',
        }}>
          <Row label="Type" value={intake?.pond_type?.replace(/_/g, ' ') || '—'} />
          <Row label="Dimensions" value={`${intake?.length_ft || '?'} × ${intake?.width_ft || '?'} × ${intake?.depth_ft || '?'} ft`} />
          <Row label="Surface Area" value={calc?.pond_surface_sqft ? `${calc.pond_surface_sqft.toLocaleString()} sq ft` : '—'} />
          <Row label="Volume" value={calc?.pond_volume_gallons ? `${Math.round(calc.pond_volume_gallons).toLocaleString()} gal` : '—'} />
          <Row label="Liner Size" value={calc?.liner_length_ft ? `${calc.liner_length_ft} × ${calc.liner_width_ft} ft` : '—'} />
          <Row label="Shape" value={intake?.shape || '—'} />
          <Row label="Site Conditions" value={intake?.site_conditions?.replace(/_/g, ' ') || '—'} />
          <Row label="Aesthetic" value={intake?.desired_aesthetic || '—'} />
          <Row label="Fish Load" value={intake?.fish_load || '—'} />
          <Row label="Waterfall" value={intake?.has_waterfall ? `${intake.waterfall_width_ft}W × ${intake.waterfall_height_ft}H ft` : 'No'} />
          <Row label="Pump Required" value={calc?.pump_gph_required ? `${Math.round(calc.pump_gph_required).toLocaleString()} GPH` : '—'} />
          <Row label="UV Clarifier" value={calc?.needs_uv ? 'Yes' : 'No'} />
          <Row label="Aeration" value={calc?.needs_aeration ? 'Yes' : 'No'} />
          <Row label="Bottom Drains" value={calc?.bottom_drains ?? '—'} />
          <Row label="Excavation" value={calc?.excavation_cubic_yards ? `${Math.round(calc.excavation_cubic_yards)} cu yd` : '—'} />
          <Row label="Rock" value={calc?.rock_tons ? `${calc.rock_tons} tons` : '—'} />
        </div>
      </Section>

      {/* Scope of Work */}
      {proposal?.scope_of_work?.length > 0 && (
        <Section title="Scope of Work" icon="📋">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {proposal.scope_of_work.map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '6px 12px', borderRadius: 6,
                background: i % 2 === 0 ? 'rgba(14,165,233,0.03)' : 'transparent',
              }}>
                <span style={{ color: C.accent, fontSize: 14, marginTop: 1 }}>◈</span>
                <span style={{ fontFamily: C.sans, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Equipment + Materials grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {proposal?.equipment_list?.length > 0 && (
          <Section title="Equipment" icon="⚙️">
            {proposal.equipment_list.map((e, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: `1px solid rgba(14,58,92,0.4)`,
              }}>
                <div>
                  <div style={{ fontFamily: C.sans, fontSize: 12, color: C.text }}>{e.item}</div>
                  <div style={{ fontFamily: C.font, fontSize: 10, color: C.muted }}>{e.model_class}</div>
                </div>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.textDim }}>×{e.qty}</div>
              </div>
            ))}
          </Section>
        )}

        {proposal?.materials_list?.length > 0 && (
          <Section title="Materials" icon="🪨">
            {proposal.materials_list.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: `1px solid rgba(14,58,92,0.4)`,
              }}>
                <span style={{ fontFamily: C.sans, fontSize: 12, color: C.text }}>{m.item}</span>
                <span style={{ fontFamily: C.font, fontSize: 12, color: C.textDim }}>{m.qty} {m.unit}</span>
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* Day Schedule */}
      {labor?.day_schedule?.length > 0 && (
        <Section title="Crew Schedule" icon="👷">
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 16,
          }}>
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(14,165,233,0.06)', border: `1px solid ${C.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: C.font, fontSize: 20, color: C.accent }}>{labor.crew_size}</div>
              <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 2 }}>Crew Members</div>
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(14,165,233,0.06)', border: `1px solid ${C.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: C.font, fontSize: 20, color: C.accent }}>{labor.total_days}</div>
              <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 2 }}>Total Days</div>
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(249,115,22,0.06)', border: `1px solid rgba(249,115,22,0.2)`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: C.font, fontSize: 20, color: C.koi }}>{labor.total_labor_hours}h</div>
              <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 2 }}>Total Hours</div>
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(249,115,22,0.06)', border: `1px solid rgba(249,115,22,0.2)`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: C.font, fontSize: 20, color: C.koi }}>{fmt(labor.total_labor_cost)}</div>
              <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 2 }}>Labor Cost</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {labor.day_schedule.map((day, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.accent}`,
                borderRadius: '0 8px 8px 0',
                background: 'rgba(14,165,233,0.03)',
              }}>
                <div style={{
                  fontFamily: C.sans, fontSize: 12, fontWeight: 700,
                  color: C.accent, marginBottom: 6,
                }}>
                  Day {day.day} — {day.crew_focus} · {day.hours}h
                </div>
                {day.tasks?.map((task, j) => (
                  <div key={j} style={{
                    fontFamily: C.sans, fontSize: 12, color: C.textDim,
                    padding: '2px 0', display: 'flex', gap: 8,
                  }}>
                    <span style={{ color: C.muted }}>·</span>
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Timeline + Warranty */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {proposal?.project_timeline && (
          <Section title="Timeline" icon="📅">
            <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>
              {proposal.project_timeline}
            </div>
          </Section>
        )}
        {proposal?.warranty_notes && (
          <Section title="Warranty" icon="🛡️">
            <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>
              {proposal.warranty_notes}
            </div>
          </Section>
        )}
      </div>

      {proposal?.payment_terms && (
        <Section title="Payment Terms" icon="💳">
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>
            {proposal.payment_terms}
          </div>
        </Section>
      )}

      {proposal?.contractor_notes && (
        <Section title="Contractor Notes" icon="📌">
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>
            {proposal.contractor_notes}
          </div>
        </Section>
      )}
    </div>
  );
}

function LogTab({ log }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);
  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '16px 24px' }}>
      {log.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 12,
        }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>📡</div>
          <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 14 }}>No log entries yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', gap: 16, padding: '6px 10px',
              borderRadius: 6, fontFamily: C.font, fontSize: 11,
              background: i % 2 === 0 ? 'rgba(14,165,233,0.02)' : 'transparent',
              alignItems: 'center',
            }}>
              <span style={{ color: C.muted, minWidth: 95 }}>
                {entry.time?.split('T')[1]?.slice(0, 12) || ''}
              </span>
              <span style={{
                minWidth: 90,
                color: entry.status === 'complete' ? C.success
                  : entry.status === 'running' ? C.koi
                  : entry.status === 'error' ? C.error
                  : C.muted,
                fontWeight: 600,
              }}>
                [{entry.status?.toUpperCase()}]
              </span>
              <span style={{ color: C.text }}>{entry.agent}</span>
              {entry.message && <span style={{ color: C.error }}>— {entry.message}</span>}
            </div>
          ))}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('Chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [laborRate, setLaborRate] = useState(75);
  const [pipelineData, setPipelineData] = useState(null);
  const [log, setLog] = useState([]);

  const runPipeline = async () => {
    if (!input.trim() || running) return;
    const desc = input.trim();
    setInput('');
    setRunning(true);
    setAgentStatuses({});
    setLog([]);
    setMessages(prev => [...prev, { role: 'user', content: desc, time: new Date().toLocaleTimeString() }]);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: desc, laborRate }),
      });
      const json = await res.json();

      if (json.log) {
        setLog(json.log);
        const statuses = {};
        json.log.forEach(e => { statuses[e.agent] = e.status; });
        setAgentStatuses(statuses);
      }

      if (json.success) {
        setPipelineData(json.data);
        const p = json.data.proposal;
        const cb = p?.cost_breakdown;
        const summary = [
          `✓ Pipeline complete.`,
          ``,
          `Project: ${p?.project_title || 'Pond Construction'}`,
          `Pond: ${json.data.intake?.length_ft}×${json.data.intake?.width_ft} ft, ${json.data.intake?.depth_ft} ft deep`,
          `Volume: ${Math.round(json.data.calc?.pond_volume_gallons || 0).toLocaleString()} gallons`,
          ``,
          `ESTIMATE:`,
          `  Low:  $${(cb?.total_low || 0).toLocaleString()}`,
          `  High: $${(cb?.total_high || 0).toLocaleString()}`,
          ``,
          `Open the Proposal tab for the full breakdown.`,
        ].join('\n');
        setMessages(prev => [...prev, { role: 'ai', content: summary, time: new Date().toLocaleTimeString() }]);
        setTab('Proposal');
      } else {
        setMessages(prev => [...prev, {
          role: 'ai', content: `Pipeline error: ${json.error || 'Unknown error'}`,
          time: new Date().toLocaleTimeString(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai', content: `Network error: ${err.message}`,
        time: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setRunning(false);
    }
  };

  const tabs = ['Chat', 'Proposal', 'Log'];

  return (
    <div style={{
      background: C.bg, height: '100vh', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{globalStyles}</style>
      <WaterBackground />

      {/* Everything above the water bg */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(180deg, rgba(4,20,36,0.98) 0%, rgba(6,29,48,0.95) 100%)`,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 16, height: 58,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 22, animation: 'float 4s ease-in-out infinite' }}>🐟</span>
          <div>
            <div style={{
              fontFamily: C.sans, fontSize: 17, fontWeight: 800, letterSpacing: 0.5,
              background: `linear-gradient(135deg, ${C.accent} 0%, #38bdf8 60%, ${C.koi} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              PondMaster AI
            </div>
            <div style={{ fontFamily: C.sans, fontSize: 10, color: C.muted, letterSpacing: 0.5, marginTop: 1 }}>
              Professional Pond Construction Estimator
            </div>
          </div>

          {/* Tabs */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} className="tab-btn" style={{
                background: tab === t
                  ? `linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0.1) 100%)`
                  : 'transparent',
                color: tab === t ? C.accent : C.muted,
                border: `1px solid ${tab === t ? C.accentDim : 'transparent'}`,
                fontFamily: C.sans, fontSize: 13, fontWeight: tab === t ? 600 : 400,
                padding: '6px 18px', cursor: 'pointer', borderRadius: 8,
              }}>
                {t}
                {t === 'Log' && log.length > 0 && (
                  <span style={{
                    marginLeft: 6, background: C.depth3,
                    color: C.textDim, borderRadius: 10,
                    padding: '1px 6px', fontSize: 9, fontFamily: C.font,
                  }}>
                    {log.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <AgentBar agentStatuses={agentStatuses} />
        <LaborBanner laborRate={laborRate} setLaborRate={setLaborRate} />

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {tab === 'Chat' && (
            <ChatTab messages={messages} input={input} setInput={setInput} onRun={runPipeline} running={running} />
          )}
          {tab === 'Proposal' && <ProposalTab data={pipelineData} />}
          {tab === 'Log' && <LogTab log={log} />}
        </div>
      </div>
    </div>
  );
}
