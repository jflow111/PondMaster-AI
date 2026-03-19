import React, { useState, useRef, useEffect } from 'react';

const C = {
  bg: '#060d14',
  panel: '#0d1117',
  border: '#1e2d3d',
  accent: '#f59e0b',
  success: '#10b981',
  error: '#ef4444',
  text: '#e2e8f0',
  muted: '#64748b',
  font: "'Courier New', Courier, monospace",
};

const AGENTS = [
  { id: 'intake', label: 'INTAKE' },
  { id: 'estimator', label: 'ESTIMATOR' },
  { id: 'equipment', label: 'EQUIPMENT' },
  { id: 'labor', label: 'LABOR' },
  { id: 'proposal', label: 'PROPOSAL' },
];

const agentOrder = ['Intake Agent', 'Estimator Agent', 'Equipment Agent', 'Labor Planner', 'Proposal Writer'];

function StatusDot({ status }) {
  const color = status === 'complete' ? C.success : status === 'running' ? C.accent : C.muted;
  const pulse = status === 'running';
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, marginRight: 6,
      boxShadow: pulse ? `0 0 8px ${C.accent}` : 'none',
      animation: pulse ? 'pulse 1s infinite' : 'none',
    }} />
  );
}

function AgentBar({ agentStatuses }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '10px 16px',
      background: C.panel, borderBottom: `1px solid ${C.border}`,
      flexWrap: 'wrap',
    }}>
      {AGENTS.map((a, i) => {
        const st = agentStatuses[agentOrder[i]] || 'idle';
        return (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center',
            padding: '4px 10px', border: `1px solid ${C.border}`,
            borderRadius: 4, background: '#060d14',
            fontSize: 11, fontFamily: C.font, color: C.text,
            letterSpacing: 1,
          }}>
            <StatusDot status={st} />
            {a.label}
            <span style={{ marginLeft: 6, color: C.muted, fontSize: 10 }}>
              [{st.toUpperCase()}]
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
      padding: '8px 16px', background: '#0a1520',
      borderBottom: `1px solid ${C.border}`,
      fontFamily: C.font, fontSize: 12, color: C.muted,
    }}>
      <span style={{ color: C.accent, letterSpacing: 1 }}>LABOR RATE</span>
      {editing ? (
        <>
          <span style={{ color: C.muted }}>$</span>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
            style={{
              background: C.panel, border: `1px solid ${C.accent}`,
              color: C.text, fontFamily: C.font, fontSize: 13,
              padding: '2px 6px', width: 70, borderRadius: 3,
              outline: 'none',
            }}
          />
          <span style={{ color: C.muted }}>/hr</span>
          <button onClick={save} style={{
            background: C.accent, color: '#000', border: 'none',
            fontFamily: C.font, fontSize: 11, padding: '2px 8px',
            cursor: 'pointer', borderRadius: 3, letterSpacing: 1,
          }}>SET</button>
        </>
      ) : (
        <>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 'bold' }}>
            ${laborRate}/hr
          </span>
          <button onClick={() => setEditing(true)} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: C.font, fontSize: 10,
            padding: '2px 8px', cursor: 'pointer', borderRadius: 3,
            letterSpacing: 1,
          }}>EDIT</button>
        </>
      )}
      <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 10 }}>
        Set your shop rate before running the pipeline
      </span>
    </div>
  );
}

function ChatTab({ messages, input, setInput, onRun, running }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        flex: 1, overflowY: 'auto', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.length === 0 && (
          <div style={{
            color: C.muted, fontFamily: C.font, fontSize: 13,
            textAlign: 'center', marginTop: 60, lineHeight: 2,
          }}>
            <div style={{ color: C.accent, fontSize: 20, marginBottom: 12, letterSpacing: 2 }}>
              PONDMASTER AI
            </div>
            <div>Professional Pond Construction Estimator</div>
            <div style={{ marginTop: 8, fontSize: 11 }}>
              Describe your pond project below and the 5-agent pipeline<br />
              will generate a complete estimate and proposal.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              background: m.role === 'user' ? '#1a2840' : C.panel,
              border: `1px solid ${m.role === 'user' ? '#2a4060' : C.border}`,
              borderRadius: 6, padding: '10px 14px',
              fontFamily: C.font, fontSize: 13, color: C.text,
              lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontFamily: C.font }}>
              {m.role === 'user' ? 'CONTRACTOR' : 'PONDMASTER AI'} · {m.time}
            </div>
          </div>
        ))}
        {running && (
          <div style={{
            alignSelf: 'flex-start', fontFamily: C.font, fontSize: 12,
            color: C.accent, padding: '8px 12px',
            border: `1px solid ${C.border}`, borderRadius: 6,
            background: C.panel,
          }}>
            ⟳ Running 5-agent pipeline...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{
        padding: 16, borderTop: `1px solid ${C.border}`,
        background: C.panel,
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe the pond project... (e.g. 16x12 koi pond, 3ft deep, natural rock waterfall, heavy fish load, sloped backyard)"
            disabled={running}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) onRun();
            }}
            style={{
              flex: 1, background: C.bg, border: `1px solid ${C.border}`,
              color: C.text, fontFamily: C.font, fontSize: 13,
              padding: '10px 12px', borderRadius: 6, resize: 'vertical',
              minHeight: 70, outline: 'none',
            }}
          />
          <button
            onClick={onRun}
            disabled={running || !input.trim()}
            style={{
              background: running || !input.trim() ? C.border : C.accent,
              color: running || !input.trim() ? C.muted : '#000',
              border: 'none', fontFamily: C.font, fontSize: 12,
              fontWeight: 'bold', padding: '0 20px', borderRadius: 6,
              cursor: running || !input.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: 2, minWidth: 90,
              transition: 'background 0.2s',
            }}
          >
            {running ? 'RUNNING' : 'RUN'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font, marginTop: 6 }}>
          Ctrl+Enter to run · 5 AI agents will process your description
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        color: C.accent, fontFamily: C.font, fontSize: 11,
        letterSpacing: 2, marginBottom: 10, paddingBottom: 6,
        borderBottom: `1px solid ${C.border}`,
      }}>
        ▸ {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: C.font, fontSize: 12, color: C.text,
      padding: '4px 0', borderBottom: `1px solid #0f1a24`,
    }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color: C.text }}>{value}</span>
    </div>
  );
}

function CostRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: C.font, fontSize: highlight ? 14 : 12,
      color: highlight ? C.accent : C.text,
      padding: '5px 0',
      borderBottom: highlight ? 'none' : `1px solid #0f1a24`,
      fontWeight: highlight ? 'bold' : 'normal',
      marginTop: highlight ? 8 : 0,
    }}>
      <span style={{ color: highlight ? C.accent : C.muted }}>{label}</span>
      <span>{value}</span>
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', fontFamily: C.font, color: C.muted, fontSize: 13,
      }}>
        No proposal yet — run the pipeline from the CHAT tab.
      </div>
    );
  }

  const { intake, calc, equipment, labor, proposal } = data;

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: 20 }}>
      {/* Title */}
      <div style={{
        textAlign: 'center', marginBottom: 28,
        fontFamily: C.font, borderBottom: `2px solid ${C.accent}`,
        paddingBottom: 16,
      }}>
        <div style={{ color: C.accent, fontSize: 22, letterSpacing: 3, fontWeight: 'bold' }}>
          {proposal?.project_title || 'POND CONSTRUCTION PROPOSAL'}
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 6, letterSpacing: 1 }}>
          GENERATED BY PONDMASTER AI · 5-AGENT PIPELINE
        </div>
      </div>

      {/* Executive Summary */}
      {proposal?.executive_summary && (
        <Section title="EXECUTIVE SUMMARY">
          <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, lineHeight: 1.8 }}>
            {proposal.executive_summary}
          </div>
        </Section>
      )}

      {/* Pond Specs */}
      <Section title="POND SPECIFICATIONS">
        <Row label="Type" value={intake?.pond_type?.replace(/_/g, ' ').toUpperCase() || '—'} />
        <Row label="Dimensions" value={`${intake?.length_ft || '?'} × ${intake?.width_ft || '?'} ft, ${intake?.depth_ft || '?'} ft deep`} />
        <Row label="Surface Area" value={calc?.pond_surface_sqft ? `${calc.pond_surface_sqft.toLocaleString()} sq ft` : '—'} />
        <Row label="Volume" value={calc?.pond_volume_gallons ? `${Math.round(calc.pond_volume_gallons).toLocaleString()} gallons` : '—'} />
        <Row label="Liner Size" value={calc?.liner_length_ft ? `${calc.liner_length_ft} × ${calc.liner_width_ft} ft (${calc.liner_sqft?.toLocaleString()} sq ft)` : '—'} />
        <Row label="Shape" value={intake?.shape || '—'} />
        <Row label="Site Conditions" value={intake?.site_conditions?.replace(/_/g, ' ') || '—'} />
        <Row label="Aesthetic" value={intake?.desired_aesthetic || '—'} />
        <Row label="Fish Load" value={intake?.fish_load || '—'} />
        <Row label="Has Waterfall" value={intake?.has_waterfall ? `Yes — ${intake.waterfall_width_ft}W × ${intake.waterfall_height_ft}H ft` : 'No'} />
        <Row label="Pump Required" value={calc?.pump_gph_required ? `${Math.round(calc.pump_gph_required).toLocaleString()} GPH` : '—'} />
        <Row label="UV Clarifier" value={calc?.needs_uv ? 'Yes' : 'No'} />
        <Row label="Aeration" value={calc?.needs_aeration ? 'Yes' : 'No'} />
        <Row label="Bottom Drains" value={calc?.bottom_drains ?? '—'} />
        <Row label="Excavation" value={calc?.excavation_cubic_yards ? `${Math.round(calc.excavation_cubic_yards)} cu yd` : '—'} />
      </Section>

      {/* Cost Breakdown */}
      {proposal?.cost_breakdown && (
        <Section title="COST BREAKDOWN">
          <CostRow label="Excavation" value={fmt(proposal.cost_breakdown.excavation)} />
          <CostRow label="Liner & Underlayment" value={fmt(proposal.cost_breakdown.liner_underlayment)} />
          <CostRow label="Rock & Gravel" value={fmt(proposal.cost_breakdown.rock_gravel)} />
          <CostRow label="Equipment" value={fmt(proposal.cost_breakdown.equipment)} />
          <CostRow label="Plumbing" value={fmt(proposal.cost_breakdown.plumbing)} />
          <CostRow label="Electrical" value={fmt(proposal.cost_breakdown.electrical)} />
          <CostRow label="Labor" value={fmt(proposal.cost_breakdown.labor)} />
          <CostRow label="Overhead & Profit" value={fmt(proposal.cost_breakdown.overhead_profit)} />
          <div style={{ borderTop: `2px solid ${C.accent}`, marginTop: 10, paddingTop: 10 }}>
            <CostRow label="TOTAL (LOW)" value={fmt(proposal.cost_breakdown.total_low)} highlight />
            <CostRow label="TOTAL (HIGH)" value={fmt(proposal.cost_breakdown.total_high)} highlight />
          </div>
        </Section>
      )}

      {/* Scope of Work */}
      {proposal?.scope_of_work?.length > 0 && (
        <Section title="SCOPE OF WORK">
          {proposal.scope_of_work.map((item, i) => (
            <div key={i} style={{
              fontFamily: C.font, fontSize: 12, color: C.text,
              padding: '4px 0', display: 'flex', gap: 8,
            }}>
              <span style={{ color: C.accent }}>▸</span>
              <span>{item}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Equipment List */}
      {proposal?.equipment_list?.length > 0 && (
        <Section title="EQUIPMENT LIST">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 4 }}>
            <div style={{ fontFamily: C.font, fontSize: 10, color: C.accent, letterSpacing: 1 }}>ITEM</div>
            <div style={{ fontFamily: C.font, fontSize: 10, color: C.accent, letterSpacing: 1 }}>MODEL CLASS</div>
            <div style={{ fontFamily: C.font, fontSize: 10, color: C.accent, letterSpacing: 1 }}>QTY</div>
            {proposal.equipment_list.map((e, i) => (
              <React.Fragment key={i}>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, padding: '3px 0' }}>{e.item}</div>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.muted, padding: '3px 0' }}>{e.model_class}</div>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, padding: '3px 0' }}>{e.qty}</div>
              </React.Fragment>
            ))}
          </div>
        </Section>
      )}

      {/* Materials List */}
      {proposal?.materials_list?.length > 0 && (
        <Section title="MATERIALS LIST">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: 4 }}>
            <div style={{ fontFamily: C.font, fontSize: 10, color: C.accent, letterSpacing: 1 }}>MATERIAL</div>
            <div style={{ fontFamily: C.font, fontSize: 10, color: C.accent, letterSpacing: 1 }}>QTY</div>
            <div style={{ fontFamily: C.font, fontSize: 10, color: C.accent, letterSpacing: 1 }}>UNIT</div>
            {proposal.materials_list.map((m, i) => (
              <React.Fragment key={i}>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, padding: '3px 0' }}>{m.item}</div>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.muted, padding: '3px 0' }}>{m.qty}</div>
                <div style={{ fontFamily: C.font, fontSize: 12, color: C.muted, padding: '3px 0' }}>{m.unit}</div>
              </React.Fragment>
            ))}
          </div>
        </Section>
      )}

      {/* Labor / Day Schedule */}
      {labor?.day_schedule?.length > 0 && (
        <Section title="DAY-BY-DAY CREW SCHEDULE">
          <div style={{ marginBottom: 10, display: 'flex', gap: 24 }}>
            <Row label="Crew Size" value={`${labor.crew_size} workers`} />
            <Row label="Total Days" value={`${labor.total_days} days`} />
            <Row label="Total Hours" value={`${labor.total_labor_hours} hrs`} />
            <Row label="Labor Cost" value={fmt(labor.total_labor_cost)} />
          </div>
          {labor.day_schedule.map((day, i) => (
            <div key={i} style={{
              marginBottom: 10, padding: '10px 12px',
              border: `1px solid ${C.border}`, borderRadius: 4,
              background: '#080f18',
            }}>
              <div style={{
                fontFamily: C.font, fontSize: 11, color: C.accent,
                letterSpacing: 1, marginBottom: 6,
              }}>
                DAY {day.day} — {day.crew_focus?.toUpperCase()} · {day.hours}h
              </div>
              {day.tasks?.map((task, j) => (
                <div key={j} style={{
                  fontFamily: C.font, fontSize: 12, color: C.text,
                  padding: '2px 0', display: 'flex', gap: 8,
                }}>
                  <span style={{ color: C.muted }}>·</span>
                  <span>{task}</span>
                </div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {/* Timeline */}
      {proposal?.project_timeline && (
        <Section title="PROJECT TIMELINE">
          <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, lineHeight: 1.8 }}>
            {proposal.project_timeline}
          </div>
        </Section>
      )}

      {/* Warranty & Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {proposal?.warranty_notes && (
          <Section title="WARRANTY NOTES">
            <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, lineHeight: 1.8 }}>
              {proposal.warranty_notes}
            </div>
          </Section>
        )}
        {proposal?.contractor_notes && (
          <Section title="CONTRACTOR NOTES">
            <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, lineHeight: 1.8 }}>
              {proposal.contractor_notes}
            </div>
          </Section>
        )}
      </div>

      {proposal?.payment_terms && (
        <Section title="PAYMENT TERMS">
          <div style={{ fontFamily: C.font, fontSize: 12, color: C.text, lineHeight: 1.8 }}>
            {proposal.payment_terms}
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
    <div style={{ overflowY: 'auto', height: '100%', padding: 16 }}>
      {log.length === 0 ? (
        <div style={{ fontFamily: C.font, color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 40 }}>
          No log entries yet.
        </div>
      ) : (
        log.map((entry, i) => (
          <div key={i} style={{
            fontFamily: C.font, fontSize: 11, color: C.text,
            padding: '4px 0', borderBottom: `1px solid #0a1218`,
            display: 'flex', gap: 12,
          }}>
            <span style={{ color: C.muted, minWidth: 90 }}>
              {entry.time ? entry.time.split('T')[1]?.slice(0, 12) : ''}
            </span>
            <span style={{
              color: entry.status === 'complete' ? C.success
                : entry.status === 'running' ? C.accent
                : entry.status === 'error' ? C.error
                : C.muted,
              minWidth: 80,
            }}>
              [{entry.status?.toUpperCase()}]
            </span>
            <span>{entry.agent}</span>
            {entry.message && <span style={{ color: C.error }}> — {entry.message}</span>}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('CHAT');
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

    const userMsg = { role: 'user', content: desc, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);

    // Poll agent statuses from log
    const pollInterval = setInterval(() => {}, 500);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: desc, laborRate }),
      });
      const json = await res.json();
      clearInterval(pollInterval);

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
          `ESTIMATE RANGE:`,
          `  Low:  $${(cb?.total_low || 0).toLocaleString()}`,
          `  High: $${(cb?.total_high || 0).toLocaleString()}`,
          ``,
          `View the PROPOSAL tab for the full breakdown.`,
        ].join('\n');
        setMessages(prev => [...prev, { role: 'ai', content: summary, time: new Date().toLocaleTimeString() }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: `Pipeline error: ${json.error || 'Unknown error'}`,
          time: new Date().toLocaleTimeString(),
        }]);
      }
    } catch (err) {
      clearInterval(pollInterval);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `Network error: ${err.message}`,
        time: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setRunning(false);
    }
  };

  const tabs = ['CHAT', 'PROPOSAL', 'LOG'];

  return (
    <div style={{
      background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.panel}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        textarea::placeholder { color: ${C.muted}; }
        textarea:focus { border-color: ${C.accent} !important; }
      `}</style>

      {/* Header */}
      <div style={{
        background: C.panel, borderBottom: `2px solid ${C.accent}`,
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ fontFamily: C.font, fontSize: 18, color: C.accent, letterSpacing: 3, fontWeight: 'bold' }}>
          PONDMASTER AI
        </div>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.muted, letterSpacing: 1 }}>
          Professional Pond Construction Estimator · 5-Agent Pipeline
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? C.accent : 'transparent',
              color: tab === t ? '#000' : C.muted,
              border: `1px solid ${tab === t ? C.accent : C.border}`,
              fontFamily: C.font, fontSize: 11, letterSpacing: 2,
              padding: '5px 14px', cursor: 'pointer', borderRadius: 4,
              fontWeight: tab === t ? 'bold' : 'normal',
              transition: 'all 0.15s',
            }}>
              {t}
              {t === 'LOG' && log.length > 0 && (
                <span style={{
                  marginLeft: 6, background: C.border, color: C.text,
                  borderRadius: 10, padding: '1px 6px', fontSize: 9,
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
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'CHAT' && (
          <ChatTab
            messages={messages}
            input={input}
            setInput={setInput}
            onRun={runPipeline}
            running={running}
          />
        )}
        {tab === 'PROPOSAL' && <ProposalTab data={pipelineData} />}
        {tab === 'LOG' && <LogTab log={log} />}
      </div>
    </div>
  );
}
