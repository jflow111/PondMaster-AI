import React, { useState, useRef, useEffect, useCallback } from 'react';

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

// Storage keys
const HISTORY_KEY = 'pondmaster_jobs';
const COMPANY_KEY = 'pondmaster_company';
const WELCOME_KEY = 'pondmaster_welcomed';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistoryToStorage(jobs) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(jobs));
}
function loadCompany() {
  try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || '{}'); } catch { return {}; }
}
function saveCompanyToStorage(s) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(s));
}

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

  .agent-card { transition: all 0.3s ease; }
  .agent-card.running { box-shadow: 0 0 12px rgba(249,115,22,0.4); border-color: ${C.koi} !important; }
  .agent-card.complete { box-shadow: 0 0 8px rgba(16,185,129,0.3); border-color: ${C.success} !important; }
  .run-btn:not(:disabled):hover { box-shadow: 0 0 20px rgba(249,115,22,0.5); transform: translateY(-1px); }
  .run-btn { transition: all 0.2s ease; }
  .tab-btn { transition: all 0.2s ease; }
  .tab-btn:hover { filter: brightness(1.2); }
  .msg-animate { animation: fadeIn 0.3s ease; }
  .job-card-hover:hover { border-color: ${C.borderLight} !important; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  .cost-val-editable:hover { background: rgba(14,165,233,0.08); border-radius: 3px; outline: 1px dashed ${C.accentDim}; cursor: text; }
  .cost-val-editable:focus { background: rgba(14,165,233,0.12); border-radius: 3px; outline: 1px solid ${C.accentDim}; }
`;

function WaterBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 20% 80%, #041e36 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, #031525 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 50%, #020c18 0%, #010810 100%)`,
      }} />
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

function WelcomeScreen({ onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.bg, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: 'float 4s ease-in-out infinite' }}>🐟</div>
        <div style={{ fontFamily: C.sans, fontSize: 28, fontWeight: 800, marginBottom: 8,
          background: `linear-gradient(135deg, ${C.accent} 0%, #38bdf8 50%, ${C.koi} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>Welcome to PondMaster AI</div>
        <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textDim, marginBottom: 32, lineHeight: 1.7 }}>
          Professional pond construction estimating powered by<br/>a 5-agent AI pipeline.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {[
            { icon: '🐟', title: 'Describe your pond project', sub: 'Size, depth, waterfall, fish load, site conditions' },
            { icon: '◈', title: '5 AI agents build the estimate', sub: 'Intake → Estimator → Equipment → Labor → Proposal' },
            { icon: '💬', title: 'Send the proposal', sub: 'Copy, print, or text directly to your client' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: C.depth1, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '14px 18px', textAlign: 'left',
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontFamily: C.sans, fontSize: 12, color: C.muted }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onDismiss} style={{
          width: '100%', fontFamily: C.sans, fontSize: 15, fontWeight: 700,
          color: '#fff', background: `linear-gradient(135deg, ${C.koi} 0%, #ea580c 100%)`,
          border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer',
        }}>Get Started →</button>
        <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 10 }}>This screen won't show again</div>
      </div>
    </div>
  );
}

function AgentBar({ agentStatuses }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '10px 20px',
      background: `linear-gradient(180deg, ${C.depth2} 0%, ${C.depth1} 100%)`,
      borderBottom: `1px solid ${C.border}`, overflowX: 'auto',
    }}>
      {AGENTS.map((a, i) => {
        const st = agentStatuses[agentOrder[i]] || 'idle';
        const isRunning = st === 'running';
        const isComplete = st === 'complete';
        return (
          <div key={a.id} className={`agent-card ${st}`} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            border: `1px solid ${isComplete ? C.success : isRunning ? C.koi : C.border}`,
            borderRadius: 20,
            background: isComplete ? 'rgba(16,185,129,0.08)' : isRunning ? 'rgba(249,115,22,0.1)' : 'rgba(4,20,36,0.8)',
            flex: '0 0 auto',
          }}>
            <span style={{ fontSize: 12, color: isComplete ? C.success : isRunning ? C.koi : C.muted, animation: isRunning ? 'pulse 1s infinite' : 'none' }}>{a.icon}</span>
            <span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 500, color: isComplete ? C.success : isRunning ? C.koi : C.textDim, letterSpacing: 0.3 }}>{a.label}</span>
            <span style={{ fontSize: 9, fontFamily: C.font, color: isComplete ? C.success : isRunning ? C.koi : C.muted, letterSpacing: 1 }}>{st.toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

function SettingsBar({ customerName, setCustomerName, customerAddress, setCustomerAddress, laborRate, setLaborRate, companySettings, setCompanySettings, showCompanyPanel, setShowCompanyPanel }) {
  const inputStyle = {
    background: C.depth2, border: `1px solid ${C.border}`, color: C.text,
    fontFamily: C.font, fontSize: 12, padding: '5px 9px', borderRadius: 6, outline: 'none',
  };

  const saveCompany = (field, value) => {
    const updated = { ...companySettings, [field]: value };
    setCompanySettings(updated);
    saveCompanyToStorage(updated);
  };

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '8px 20px', flexWrap: 'wrap',
        background: `linear-gradient(90deg, rgba(14,165,233,0.05) 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: C.sans, fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: 0.5 }}>LABOR</span>
          <span style={{ color: C.muted, fontSize: 12 }}>$</span>
          <input type="number" value={laborRate} onChange={e => setLaborRate(parseInt(e.target.value) || 75)}
            style={{ ...inputStyle, width: 60, textAlign: 'right' }} />
          <span style={{ color: C.muted, fontSize: 11 }}>/hr</span>
        </div>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: C.sans, fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: 0.5 }}>CLIENT</span>
          <input placeholder="Name" value={customerName} onChange={e => setCustomerName(e.target.value)}
            style={{ ...inputStyle, width: 130 }} />
          <input placeholder="Job address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
            style={{ ...inputStyle, width: 190 }} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowCompanyPanel(p => !p)} style={{
            background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
            fontFamily: C.sans, fontSize: 11, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            borderColor: showCompanyPanel ? C.accent : C.border, color: showCompanyPanel ? C.accent : C.muted,
          }}>⚙ Company Settings</button>
        </div>
      </div>

      {showCompanyPanel && (
        <div style={{
          padding: '14px 20px', background: C.depth1,
          borderTop: `1px solid rgba(14,165,233,0.2)`,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 12 }}>
            ⚙ Company Settings — saved automatically
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { field: 'name', label: 'Company Name', placeholder: 'Your Company Name' },
              { field: 'cert', label: 'License / Cert #', placeholder: 'e.g. C-27 License #' },
              { field: 'phone', label: 'Phone Number', placeholder: '(555) 555-5555' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
                <input
                  placeholder={placeholder}
                  value={companySettings[field] || ''}
                  onChange={e => saveCompany(field, e.target.value)}
                  style={{
                    width: '100%', background: C.depth2, border: `1px solid ${C.border}`,
                    borderRadius: 6, color: C.text, fontFamily: C.sans, fontSize: 12,
                    padding: '7px 10px', outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 8 }}>
            These appear at the top of every printed proposal.
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1, textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid rgba(14,58,92,0.4)` }}>
      <span style={{ fontFamily: C.sans, fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontFamily: C.font, fontSize: 12, color: accent ? C.koi : C.text, fontWeight: accent ? 'bold' : 'normal' }}>{value}</span>
    </div>
  );
}

function EditableCostRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: highlight ? '10px 0' : '6px 0',
      borderBottom: highlight ? 'none' : `1px solid rgba(14,58,92,0.4)`,
      marginTop: highlight ? 4 : 0,
    }}>
      <span style={{
        fontFamily: C.sans, fontSize: highlight ? 14 : 12,
        color: highlight ? C.koi : C.muted, fontWeight: highlight ? 700 : 400,
      }}>{label}</span>
      <span
        className="cost-val-editable"
        contentEditable suppressContentEditableWarning
        style={{
          fontFamily: C.font, fontSize: highlight ? 16 : 12,
          color: highlight ? C.koi : C.text, fontWeight: highlight ? 700 : 400,
          minWidth: 60, textAlign: 'right', outline: 'none',
          padding: '1px 4px', cursor: 'text',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString();
}

const EQUIPMENT_CATEGORIES = ['pump', 'skimmer', 'biofalls', 'uv_clarifier', 'aeration', 'bottom_drain', 'lighting', 'auto_dosing', 'ionizer', 'other_equipment'];
const MATERIAL_CATEGORIES = ['liner', 'underlayment', 'rock', 'gravel', 'sand', 'pipe_pvc', 'fittings', 'electrical', 'concrete', 'other_material'];
const EMPTY_EQUIPMENT = { name: '', category: 'pump', model: '', gph: '', watts: '', cost: '' };
const EMPTY_MATERIAL = { name: '', category: 'liner', unit: 'sq ft', cost: '' };

function RecentJobs({ history, onLoad }) {
  const recent = history.slice(0, 3);
  if (!recent.length) return null;
  return (
    <div style={{ padding: '16px 24px 0', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>
        RECENT JOBS
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {recent.map(job => (
          <button key={job.id} onClick={() => onLoad(job)} className="job-card-hover"
            style={{
              background: C.depth1, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', maxWidth: 280,
            }}>
            <div style={{ fontFamily: C.sans, fontSize: 11, color: C.koi, fontWeight: 600, marginBottom: 3 }}>
              {job.projectTitle || 'Pond Project'}
            </div>
            <div style={{
              fontFamily: C.sans, fontSize: 12, color: C.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 240, marginBottom: 3,
            }}>
              {job.customerName ? job.customerName + ' — ' : ''}{job.description}
            </div>
            <div style={{ fontFamily: C.font, fontSize: 11, color: C.muted }}>
              {fmt(job.totalLow)}–{fmt(job.totalHigh)} · {job.date}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatTab({ messages, input, setInput, onRun, running, history, onLoadJob }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', marginTop: 48, padding: '0 24px', animation: 'fadeIn 0.6s ease' }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'float 4s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(14,165,233,0.3))' }}>🐟</div>
              <div style={{
                fontFamily: C.sans, fontSize: 28, fontWeight: 700,
                background: `linear-gradient(135deg, ${C.accent} 0%, #38bdf8 50%, ${C.koi} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8,
              }}>PondMaster AI</div>
              <div style={{ color: C.textDim, fontFamily: C.sans, fontSize: 14, marginBottom: 6 }}>Professional Pond Construction Estimator</div>
              <div style={{
                color: C.muted, fontFamily: C.sans, fontSize: 13, lineHeight: 1.8,
                maxWidth: 400, margin: '16px auto 0', padding: '16px 20px',
                background: 'rgba(14,165,233,0.04)', border: `1px solid ${C.border}`, borderRadius: 12,
              }}>
                Describe your pond project below.<br />
                The 5-agent AI pipeline will generate a<br />complete estimate and proposal instantly.
              </div>
              <div style={{ marginTop: 16, color: C.muted, fontSize: 12, fontFamily: C.font, letterSpacing: 1 }}>── EXAMPLE ──</div>
              <div style={{ marginTop: 10, color: C.textDim, fontSize: 12, fontFamily: C.font, fontStyle: 'italic', lineHeight: 1.7 }}>
                "16x12 koi pond, 3ft deep, natural rock<br />waterfall, heavy fish load, sloped backyard"
              </div>
            </div>
            <RecentJobs history={history} onLoad={onLoadJob} />
          </div>
        )}

        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} className="msg-animate" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{
                background: m.role === 'user'
                  ? `linear-gradient(135deg, #0c2a45 0%, #0a1e35 100%)`
                  : `linear-gradient(135deg, ${C.depth2} 0%, ${C.depth3} 100%)`,
                border: `1px solid ${m.role === 'user' ? C.accentDim : C.border}`,
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '12px 16px',
                fontFamily: m.role === 'ai' ? C.font : C.sans,
                fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                boxShadow: m.role === 'user' ? '0 4px 20px rgba(14,165,233,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
              }}>
                {m.content}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontFamily: C.sans, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.role === 'user' ? '👷 Contractor' : '🤖 PondMaster AI'} · {m.time}
              </div>
            </div>
          ))}

          {running && (
            <div className="msg-animate" style={{
              alignSelf: 'flex-start', padding: '12px 16px',
              border: `1px solid ${C.koi}`, borderRadius: '16px 16px 16px 4px',
              background: 'rgba(249,115,22,0.08)', fontFamily: C.font, fontSize: 12, color: C.koi,
              boxShadow: '0 0 20px rgba(249,115,22,0.15)', animation: 'pulse 1.5s infinite',
            }}>
              ◈ Running 5-agent pipeline...
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div style={{
        padding: '16px 24px',
        background: `linear-gradient(180deg, transparent 0%, ${C.depth1} 100%)`,
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Describe the pond project... size, depth, waterfall, fish load, site conditions, aesthetic goals"
            disabled={running}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) onRun(); }}
            style={{
              flex: 1, background: C.depth2, border: `1px solid ${C.border}`,
              color: C.text, fontFamily: C.sans, fontSize: 13,
              padding: '12px 16px', borderRadius: 12, resize: 'vertical', minHeight: 72,
              outline: 'none', lineHeight: 1.6, transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
          <button onClick={onRun} disabled={running || !input.trim()} className="run-btn" style={{
            background: running || !input.trim() ? C.depth3 : `linear-gradient(135deg, ${C.koi} 0%, #ea580c 100%)`,
            color: running || !input.trim() ? C.muted : '#fff',
            border: `1px solid ${running || !input.trim() ? C.border : C.koiDim}`,
            fontFamily: C.sans, fontSize: 13, fontWeight: 700,
            padding: '0 24px', height: 72,
            cursor: running || !input.trim() ? 'not-allowed' : 'pointer',
            borderRadius: 12, minWidth: 100, letterSpacing: 0.5,
          }}>
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

function ProposalTab({ data, customerName, customerAddress, companySettings, simpleMode }) {
  const proposalRef = useRef(null);
  const [copyLabel, setCopyLabel] = useState('📋 Copy');

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
        <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 14 }}>No proposal yet — run the pipeline from the Chat tab</div>
      </div>
    );
  }

  const { intake, calc, equipment, labor, proposal } = data;

  const buildProposalText = () => {
    if (!proposalRef.current) return '';
    return proposalRef.current.innerText;
  };

  const handleCopy = () => {
    const text = buildProposalText();
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel('✓ Copied!');
      setTimeout(() => setCopyLabel('📋 Copy'), 2000);
    });
  };

  const handleText = () => {
    const text = buildProposalText();
    window.open('sms:?body=' + encodeURIComponent(text));
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    const co = companySettings || {};
    win.document.write(`<html><head><title>Pond Estimate</title>
      <style>body{font-family:Georgia,serif;font-size:14px;line-height:1.8;padding:60px;color:#222;max-width:800px;margin:0 auto;}
      h2{margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:20px;}
      th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #eee;font-size:13px;}
      .total td{font-weight:700;border-top:2px solid #222;}</style></head><body>`);
    if (co.name) {
      win.document.write(`<div style="margin-bottom:32px;"><strong style="font-size:16px;">${co.name}</strong>`);
      if (co.cert) win.document.write(`<br><span style="color:#888;font-size:12px;">License: ${co.cert}</span>`);
      if (co.phone) win.document.write(`<br><span style="color:#888;font-size:12px;">${co.phone}</span>`);
      win.document.write(`</div>`);
    }
    win.document.write(`<h2>${proposal?.project_title || 'Pond Construction Proposal'}</h2>`);
    win.document.write(`<p style="color:#888;font-size:12px;margin-bottom:32px;">Generated by PondMaster AI</p>`);
    if (customerName || customerAddress) {
      win.document.write(`<p style="margin-bottom:24px;"><strong>${customerName || ''}</strong><br>${customerAddress || ''}</p>`);
    }
    if (proposal?.executive_summary) {
      win.document.write(`<p style="white-space:pre-wrap;margin-bottom:24px;">${proposal.executive_summary}</p>`);
    }
    const cb = proposal?.cost_breakdown;
    if (cb) {
      win.document.write(`<table><tr><td>Excavation</td><td style="text-align:right;">${fmt(cb.excavation)}</td></tr>
        <tr><td>Liner & Underlayment</td><td style="text-align:right;">${fmt(cb.liner_underlayment)}</td></tr>
        <tr><td>Rock & Gravel</td><td style="text-align:right;">${fmt(cb.rock_gravel)}</td></tr>
        <tr><td>Equipment</td><td style="text-align:right;">${fmt(cb.equipment)}</td></tr>
        <tr><td>Plumbing</td><td style="text-align:right;">${fmt(cb.plumbing)}</td></tr>
        <tr><td>Electrical</td><td style="text-align:right;">${fmt(cb.electrical)}</td></tr>
        <tr><td>Labor</td><td style="text-align:right;">${fmt(cb.labor)}</td></tr>
        <tr><td>Overhead & Profit</td><td style="text-align:right;">${fmt(cb.overhead_profit)}</td></tr>
        <tr class="total"><td>Total (Low)</td><td style="text-align:right;">${fmt(cb.total_low)}</td></tr>
        <tr class="total"><td>Total (High)</td><td style="text-align:right;">${fmt(cb.total_high)}</td></tr></table>`);
    }
    win.document.write('</body></html>');
    win.document.close(); win.print();
  };

  const btnStyle = {
    fontFamily: C.sans, fontSize: 12, fontWeight: 500, color: C.textDim,
    background: C.depth2, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
  };

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '24px 28px' }} ref={proposalRef}>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={btnStyle} onClick={handleCopy}>{copyLabel}</button>
        <button style={btnStyle} onClick={handlePrint}>🖨 Print</button>
        <button style={btnStyle} onClick={handleText}>💬 Text to Client</button>
      </div>

      {/* Header */}
      <div style={{
        textAlign: 'center', marginBottom: 32, padding: '24px',
        background: `linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(249,115,22,0.06) 100%)`,
        border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}>
        {(companySettings?.name || customerName) && (
          <div style={{ fontFamily: C.sans, fontSize: 12, color: C.textDim, marginBottom: 12 }}>
            {companySettings?.name && <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{companySettings.name}</div>}
            {companySettings?.cert && <div style={{ color: C.muted }}>License: {companySettings.cert}</div>}
            {companySettings?.phone && <div style={{ color: C.muted }}>{companySettings.phone}</div>}
            {customerName && <div style={{ marginTop: 8, fontWeight: 600, color: C.text }}>Prepared for: {customerName}</div>}
            {customerAddress && <div style={{ color: C.muted }}>{customerAddress}</div>}
          </div>
        )}
        <div style={{ fontSize: 32, marginBottom: 8 }}>🐟</div>
        <div style={{
          fontFamily: C.sans, fontSize: 24, fontWeight: 800,
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.koi} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6,
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
            fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.9, padding: '12px 16px',
            background: 'rgba(14,165,233,0.04)', borderRadius: 8, border: `1px solid rgba(14,58,92,0.5)`,
          }}>
            {proposal.executive_summary}
          </div>
        </Section>
      )}

      {/* Cost Breakdown — editable */}
      {proposal?.cost_breakdown && (
        <Section title="Cost Estimate" icon="💰">
          <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginBottom: 8 }}>
            Click any value to edit before sending to client
          </div>
          <div style={{
            background: `linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.04) 100%)`,
            border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 12, padding: '16px 20px', marginBottom: 8,
          }}>
            <EditableCostRow label="Excavation" value={fmt(proposal.cost_breakdown.excavation)} />
            <EditableCostRow label="Liner & Underlayment" value={fmt(proposal.cost_breakdown.liner_underlayment)} />
            <EditableCostRow label="Rock & Gravel" value={fmt(proposal.cost_breakdown.rock_gravel)} />
            <EditableCostRow label="Equipment" value={fmt(proposal.cost_breakdown.equipment)} />
            <EditableCostRow label="Plumbing" value={fmt(proposal.cost_breakdown.plumbing)} />
            <EditableCostRow label="Electrical" value={fmt(proposal.cost_breakdown.electrical)} />
            <EditableCostRow label="Labor" value={fmt(proposal.cost_breakdown.labor)} />
            <EditableCostRow label="Overhead & Profit" value={fmt(proposal.cost_breakdown.overhead_profit)} />
            <div style={{ borderTop: `1px solid rgba(249,115,22,0.3)`, marginTop: 8 }} />
            <EditableCostRow label="TOTAL (LOW)" value={fmt(proposal.cost_breakdown.total_low)} highlight />
            <EditableCostRow label="TOTAL (HIGH)" value={fmt(proposal.cost_breakdown.total_high)} highlight />
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
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 12px', borderRadius: 6,
                background: i % 2 === 0 ? 'rgba(14,165,233,0.03)' : 'transparent',
              }}>
                <span style={{ color: C.accent, fontSize: 14, marginTop: 1 }}>◈</span>
                <span style={{ fontFamily: C.sans, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Equipment + Materials — hidden in simple mode */}
      {!simpleMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {proposal?.equipment_list?.length > 0 && (
            <Section title="Equipment" icon="⚙️">
              {proposal.equipment_list.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid rgba(14,58,92,0.4)` }}>
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
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid rgba(14,58,92,0.4)` }}>
                  <span style={{ fontFamily: C.sans, fontSize: 12, color: C.text }}>{m.item}</span>
                  <span style={{ fontFamily: C.font, fontSize: 12, color: C.textDim }}>{m.qty} {m.unit}</span>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* Day Schedule — hidden in simple mode */}
      {!simpleMode && labor?.day_schedule?.length > 0 && (
        <Section title="Crew Schedule" icon="👷">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { val: labor.crew_size, label: 'Crew Members', color: C.accent },
              { val: labor.total_days, label: 'Total Days', color: C.accent },
              { val: `${labor.total_labor_hours}h`, label: 'Total Hours', color: C.koi },
              { val: fmt(labor.total_labor_cost), label: 'Labor Cost', color: C.koi },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8, textAlign: 'center',
                background: i < 2 ? 'rgba(14,165,233,0.06)' : 'rgba(249,115,22,0.06)',
                border: `1px solid ${i < 2 ? C.border : 'rgba(249,115,22,0.2)'}`,
              }}>
                <div style={{ fontFamily: C.font, fontSize: 20, color: item.color }}>{item.val}</div>
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {labor.day_schedule.map((day, i) => (
              <div key={i} style={{
                padding: '12px 14px', border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.accent}`, borderRadius: '0 8px 8px 0',
                background: 'rgba(14,165,233,0.03)',
              }}>
                <div style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6 }}>
                  Day {day.day} — {day.crew_focus} · {day.hours}h
                </div>
                {day.tasks?.map((task, j) => (
                  <div key={j} style={{ fontFamily: C.sans, fontSize: 12, color: C.textDim, padding: '2px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: C.muted }}>·</span><span>{task}</span>
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
            <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>{proposal.project_timeline}</div>
          </Section>
        )}
        {proposal?.warranty_notes && (
          <Section title="Warranty" icon="🛡️">
            <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>{proposal.warranty_notes}</div>
          </Section>
        )}
      </div>

      {proposal?.payment_terms && (
        <Section title="Payment Terms" icon="💳">
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>{proposal.payment_terms}</div>
        </Section>
      )}
      {proposal?.contractor_notes && (
        <Section title="Contractor Notes" icon="📌">
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>{proposal.contractor_notes}</div>
        </Section>
      )}
    </div>
  );
}

function HistoryTab({ history, onLoad, onDelete, onDuplicate, onStatusChange }) {
  const STATUS_COLORS = { pending: C.muted, sent: C.accent, won: C.success, lost: C.error };

  if (!history.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <div style={{ fontSize: 36, opacity: 0.2 }}>📂</div>
        <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 14 }}>No jobs saved yet. Run your first estimate to see it here.</div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '24px 28px' }}>
      <div style={{ fontFamily: C.sans, fontSize: 12, color: C.muted, marginBottom: 16 }}>
        {history.length} job{history.length !== 1 ? 's' : ''} saved
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {history.map(job => (
          <div key={job.id} className="job-card-hover" onClick={() => onLoad(job)} style={{
            background: C.depth1, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(249,115,22,0.1)', border: `1px solid rgba(249,115,22,0.2)`,
                color: C.koi, fontSize: 10, fontWeight: 600, borderRadius: 20,
                padding: '2px 8px', marginBottom: 6, letterSpacing: 0.3,
              }}>
                {job.projectTitle || 'Pond Project'}
              </div>
              <div style={{
                fontFamily: C.sans, fontSize: 13, color: C.text, fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
              }}>
                {job.customerName ? job.customerName + ' — ' : ''}{job.description}
              </div>
              <div style={{ fontFamily: C.font, fontSize: 11, color: C.muted }}>
                {job.date} · {job.time}{job.customerAddress ? ' · ' + job.customerAddress : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: C.font, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                {fmt(job.totalLow)}–{fmt(job.totalHigh)}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <select
                  value={job.status || 'pending'}
                  onChange={e => onStatusChange(job.id, e.target.value)}
                  style={{
                    background: C.depth2, border: `1px solid ${C.border}`,
                    color: STATUS_COLORS[job.status] || C.muted,
                    fontFamily: C.sans, fontSize: 11, padding: '3px 8px',
                    borderRadius: 6, cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                {[
                  { action: 'load', label: 'Load', color: C.textDim },
                  { action: 'duplicate', label: 'Duplicate', color: C.accent },
                  { action: 'delete', label: 'Delete', color: C.error },
                ].map(btn => (
                  <button key={btn.action} onClick={e => { e.stopPropagation(); btn.action === 'load' ? onLoad(job) : btn.action === 'duplicate' ? onDuplicate(job) : onDelete(job.id); }} style={{
                    background: 'transparent', border: `1px solid ${C.border}`,
                    color: btn.color, fontFamily: C.sans, fontSize: 11,
                    padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                  }}>{btn.label}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogTab({ log }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);
  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '16px 24px' }}>
      {log.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>📡</div>
          <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 14 }}>No log entries yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', gap: 16, padding: '6px 10px', borderRadius: 6,
              fontFamily: C.font, fontSize: 11, alignItems: 'center',
              background: i % 2 === 0 ? 'rgba(14,165,233,0.02)' : 'transparent',
            }}>
              <span style={{ color: C.muted, minWidth: 95 }}>{entry.time?.split('T')[1]?.slice(0, 12) || ''}</span>
              <span style={{
                minWidth: 90, fontWeight: 600,
                color: entry.status === 'complete' ? C.success : entry.status === 'running' ? C.koi : entry.status === 'error' ? C.error : C.muted,
              }}>[{entry.status?.toUpperCase()}]</span>
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

const EMPTY_CATALOG = { equipment: [], materials: [] };
function loadCatalog() {
  try { return JSON.parse(localStorage.getItem('pondmaster_catalog')) || EMPTY_CATALOG; } catch { return EMPTY_CATALOG; }
}

function CatalogTab({ catalog, setCatalog }) {
  const [eqForm, setEqForm] = useState(EMPTY_EQUIPMENT);
  const [matForm, setMatForm] = useState(EMPTY_MATERIAL);
  const [editEqId, setEditEqId] = useState(null);
  const [editMatId, setEditMatId] = useState(null);
  const [activeSection, setActiveSection] = useState('equipment');

  const saveEquipment = () => {
    if (!eqForm.name || !eqForm.cost) return;
    const item = { ...eqForm, id: editEqId || Date.now().toString(), cost: parseFloat(eqForm.cost), gph: eqForm.gph ? parseInt(eqForm.gph) : null, watts: eqForm.watts ? parseInt(eqForm.watts) : null };
    setCatalog(prev => ({ ...prev, equipment: editEqId ? prev.equipment.map(e => e.id === editEqId ? item : e) : [...(prev.equipment || []), item] }));
    setEqForm(EMPTY_EQUIPMENT); setEditEqId(null);
  };
  const saveMaterial = () => {
    if (!matForm.name || !matForm.cost) return;
    const item = { ...matForm, id: editMatId || Date.now().toString(), cost: parseFloat(matForm.cost) };
    setCatalog(prev => ({ ...prev, materials: editMatId ? prev.materials.map(m => m.id === editMatId ? item : m) : [...(prev.materials || []), item] }));
    setMatForm(EMPTY_MATERIAL); setEditMatId(null);
  };
  const deleteEquipment = id => setCatalog(prev => ({ ...prev, equipment: prev.equipment.filter(e => e.id !== id) }));
  const deleteMaterial = id => setCatalog(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
  const startEditEquipment = item => { setEqForm({ ...item, gph: item.gph || '', watts: item.watts || '' }); setEditEqId(item.id); setActiveSection('equipment'); };
  const startEditMaterial = item => { setMatForm(item); setEditMatId(item.id); setActiveSection('materials'); };

  const inputStyle = { background: C.depth2, border: `1px solid ${C.border}`, color: C.text, fontFamily: C.sans, fontSize: 12, padding: '7px 10px', borderRadius: 6, outline: 'none', width: '100%' };
  const eqCount = catalog.equipment?.length || 0;
  const matCount = catalog.materials?.length || 0;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: C.depth1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '0 16px 12px', fontFamily: C.sans, fontSize: 10, color: C.muted, letterSpacing: 1, fontWeight: 700 }}>CATALOG SECTIONS</div>
        {[{ key: 'equipment', label: 'Equipment', icon: '⚙️', count: eqCount }, { key: 'materials', label: 'Materials', icon: '🪨', count: matCount }].map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: activeSection === s.key ? `rgba(14,165,233,0.1)` : 'transparent',
            border: 'none', borderLeft: `3px solid ${activeSection === s.key ? C.accent : 'transparent'}`,
            color: activeSection === s.key ? C.accent : C.textDim,
            fontFamily: C.sans, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            <span>{s.icon}</span><span style={{ flex: 1 }}>{s.label}</span>
            {s.count > 0 && <span style={{ background: C.depth3, color: C.textDim, borderRadius: 10, padding: '1px 7px', fontSize: 10, fontFamily: C.font }}>{s.count}</span>}
          </button>
        ))}
        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: C.sans, fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
            Catalog is saved locally and used by the AI to price your estimates accurately.
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {activeSection === 'equipment' && (
          <>
            <div style={{ background: C.depth2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', marginBottom: 24 }}>
              <div style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 16, letterSpacing: 0.5 }}>
                {editEqId ? '✏️ Edit Equipment Item' : '+ Add Equipment'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Product Name *</div><input style={inputStyle} placeholder="e.g. Aquascape AquaSurge 3000" value={eqForm.name} onChange={e => setEqForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Category *</div><select style={inputStyle} value={eqForm.category} onChange={e => setEqForm(p => ({ ...p, category: e.target.value }))}>{EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Your Cost ($) *</div><input style={inputStyle} type="number" placeholder="0.00" value={eqForm.cost} onChange={e => setEqForm(p => ({ ...p, cost: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Model / SKU</div><input style={inputStyle} placeholder="e.g. AS-3000" value={eqForm.model} onChange={e => setEqForm(p => ({ ...p, model: e.target.value }))} /></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>GPH Rating</div><input style={inputStyle} type="number" placeholder="e.g. 3000" value={eqForm.gph} onChange={e => setEqForm(p => ({ ...p, gph: e.target.value }))} /></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Watts</div><input style={inputStyle} type="number" placeholder="e.g. 75" value={eqForm.watts} onChange={e => setEqForm(p => ({ ...p, watts: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEquipment} style={{ background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDim} 100%)`, color: '#fff', border: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>{editEqId ? 'Update Item' : 'Add to Catalog'}</button>
                {editEqId && <button onClick={() => { setEqForm(EMPTY_EQUIPMENT); setEditEqId(null); }} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontFamily: C.sans, fontSize: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>}
              </div>
            </div>
            {eqCount === 0 ? <div style={{ textAlign: 'center', color: C.muted, fontFamily: C.sans, fontSize: 13, marginTop: 40 }}>No equipment added yet.</div> : (
              <div>
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>YOUR EQUIPMENT CATALOG ({eqCount} items)</div>
                {EQUIPMENT_CATEGORIES.filter(cat => catalog.equipment?.some(e => e.category === cat)).map(cat => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: C.sans, fontSize: 11, color: C.accent, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{cat.replace(/_/g, ' ')}</div>
                    {catalog.equipment.filter(e => e.category === cat).map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 4, background: C.depth2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ flex: 1 }}><div style={{ fontFamily: C.sans, fontSize: 13, color: C.text, fontWeight: 500 }}>{item.name}</div><div style={{ fontFamily: C.font, fontSize: 10, color: C.muted, marginTop: 2 }}>{item.model && `${item.model} · `}{item.gph && `${item.gph} GPH · `}{item.watts && `${item.watts}W`}</div></div>
                        <div style={{ fontFamily: C.font, fontSize: 15, color: C.koi, fontWeight: 700, minWidth: 80, textAlign: 'right' }}>${item.cost.toLocaleString()}</div>
                        <button onClick={() => startEditEquipment(item)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontFamily: C.sans, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteEquipment(item.id)} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.3)`, color: C.error, fontFamily: C.sans, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === 'materials' && (
          <>
            <div style={{ background: C.depth2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', marginBottom: 24 }}>
              <div style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 16, letterSpacing: 0.5 }}>{editMatId ? '✏️ Edit Material' : '+ Add Material'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Material Name *</div><input style={inputStyle} placeholder="e.g. 45mil EPDM Liner" value={matForm.name} onChange={e => setMatForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Category *</div><select style={inputStyle} value={matForm.category} onChange={e => setMatForm(p => ({ ...p, category: e.target.value }))}>{MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Unit</div><select style={inputStyle} value={matForm.unit} onChange={e => setMatForm(p => ({ ...p, unit: e.target.value }))}>{['sq ft', 'linear ft', 'ton', 'yard', 'bag', 'roll', 'each', 'gallon'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                <div><div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, marginBottom: 4 }}>Cost per Unit ($) *</div><input style={inputStyle} type="number" placeholder="0.00" value={matForm.cost} onChange={e => setMatForm(p => ({ ...p, cost: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveMaterial} style={{ background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDim} 100%)`, color: '#fff', border: 'none', fontFamily: C.sans, fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>{editMatId ? 'Update Material' : 'Add to Catalog'}</button>
                {editMatId && <button onClick={() => { setMatForm(EMPTY_MATERIAL); setEditMatId(null); }} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontFamily: C.sans, fontSize: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>}
              </div>
            </div>
            {matCount === 0 ? <div style={{ textAlign: 'center', color: C.muted, fontFamily: C.sans, fontSize: 13, marginTop: 40 }}>No materials added yet.</div> : (
              <div>
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>YOUR MATERIALS CATALOG ({matCount} items)</div>
                {MATERIAL_CATEGORIES.filter(cat => catalog.materials?.some(m => m.category === cat)).map(cat => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: C.sans, fontSize: 11, color: C.accent, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{cat.replace(/_/g, ' ')}</div>
                    {catalog.materials.filter(m => m.category === cat).map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 4, background: C.depth2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ flex: 1 }}><div style={{ fontFamily: C.sans, fontSize: 13, color: C.text, fontWeight: 500 }}>{item.name}</div><div style={{ fontFamily: C.font, fontSize: 10, color: C.muted, marginTop: 2 }}>per {item.unit}</div></div>
                        <div style={{ fontFamily: C.font, fontSize: 15, color: C.koi, fontWeight: 700, minWidth: 80, textAlign: 'right' }}>${item.cost.toLocaleString()}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>/{item.unit}</span></div>
                        <button onClick={() => startEditMaterial(item)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontFamily: C.sans, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteMaterial(item.id)} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.3)`, color: C.error, fontFamily: C.sans, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('Chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [laborRate, setLaborRate] = useState(() => { const s = loadCompany(); return s.laborRate ? parseInt(s.laborRate) : 75; });
  const [pipelineData, setPipelineData] = useState(null);
  const [log, setLog] = useState([]);
  const [catalog, setCatalogState] = useState(loadCatalog);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [companySettings, setCompanySettings] = useState(loadCompany);
  const [history, setHistory] = useState(loadHistory);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem(WELCOME_KEY));
  const [simpleMode, setSimpleMode] = useState(false);
  const [showCompanyPanel, setShowCompanyPanel] = useState(false);

  const setCatalog = useCallback(updater => {
    setCatalogState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('pondmaster_catalog', JSON.stringify(next));
      return next;
    });
  }, []);

  const saveJobToHistory = useCallback((data, description) => {
    const cb = data.proposal?.cost_breakdown;
    const job = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      description,
      customerName,
      customerAddress,
      projectTitle: data.proposal?.project_title || 'Pond Project',
      totalLow: cb?.total_low || 0,
      totalHigh: cb?.total_high || 0,
      laborRate,
      data,
      status: 'pending',
    };
    setHistory(prev => {
      const updated = [job, ...prev].slice(0, 100);
      saveHistoryToStorage(updated);
      return updated;
    });
  }, [customerName, customerAddress, laborRate]);

  const handleLoadJob = useCallback((job) => {
    setInput(job.description || '');
    if (job.customerName !== undefined) setCustomerName(job.customerName);
    if (job.customerAddress !== undefined) setCustomerAddress(job.customerAddress);
    if (job.laborRate) setLaborRate(job.laborRate);
    if (job.data) {
      setPipelineData(job.data);
      setTab('Proposal');
    } else {
      setTab('Chat');
    }
  }, []);

  const handleDuplicateJob = useCallback((job) => {
    setInput(job.description || '');
    setCustomerName('');
    setCustomerAddress('');
    if (job.laborRate) setLaborRate(job.laborRate);
    setTab('Chat');
  }, []);

  const handleDeleteJob = useCallback((id) => {
    setHistory(prev => {
      const updated = prev.filter(j => j.id !== id);
      saveHistoryToStorage(updated);
      return updated;
    });
  }, []);

  const handleStatusChange = useCallback((id, status) => {
    setHistory(prev => {
      const updated = prev.map(j => j.id === id ? { ...j, status } : j);
      saveHistoryToStorage(updated);
      return updated;
    });
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem(WELCOME_KEY, '1');
  };

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
        body: JSON.stringify({ jobDescription: desc, laborRate, catalog }),
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
        saveJobToHistory(json.data, desc);
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
        setMessages(prev => [...prev, { role: 'ai', content: `Pipeline error: ${json.error || 'Unknown error'}`, time: new Date().toLocaleTimeString() }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `Network error: ${err.message}`, time: new Date().toLocaleTimeString() }]);
    } finally {
      setRunning(false);
    }
  };

  // Save laborRate to company settings when it changes
  useEffect(() => {
    const updated = { ...companySettings, laborRate };
    saveCompanyToStorage(updated);
  }, [laborRate]);

  const allTabs = simpleMode
    ? ['Chat', 'Proposal', 'Catalog', 'History']
    : ['Chat', 'Proposal', 'Catalog', 'History', 'Log'];
  const catalogCount = (catalog.equipment?.length || 0) + (catalog.materials?.length || 0);

  return (
    <div style={{ background: C.bg, height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{globalStyles}</style>
      <WaterBackground />

      {showWelcome && <WelcomeScreen onDismiss={dismissWelcome} />}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(180deg, rgba(4,20,36,0.98) 0%, rgba(6,29,48,0.95) 100%)`,
          borderBottom: `1px solid ${C.border}`, padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 16, height: 58,
          backdropFilter: 'blur(10px)', boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 22, animation: 'float 4s ease-in-out infinite' }}>🐟</span>
          <div>
            <div style={{
              fontFamily: C.sans, fontSize: 17, fontWeight: 800, letterSpacing: 0.5,
              background: `linear-gradient(135deg, ${C.accent} 0%, #38bdf8 60%, ${C.koi} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>PondMaster AI</div>
            <div style={{ fontFamily: C.sans, fontSize: 10, color: C.muted, letterSpacing: 0.5, marginTop: 1 }}>Professional Pond Construction Estimator</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            {allTabs.map(t => (
              <button key={t} onClick={() => setTab(t)} className="tab-btn" style={{
                background: tab === t ? `linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0.1) 100%)` : 'transparent',
                color: tab === t ? C.accent : C.muted,
                border: `1px solid ${tab === t ? C.accentDim : 'transparent'}`,
                fontFamily: C.sans, fontSize: 13, fontWeight: tab === t ? 600 : 400,
                padding: '6px 18px', cursor: 'pointer', borderRadius: 8,
              }}>
                {t}
                {t === 'Log' && log.length > 0 && (
                  <span style={{ marginLeft: 6, background: C.depth3, color: C.textDim, borderRadius: 10, padding: '1px 6px', fontSize: 9, fontFamily: C.font }}>{log.length}</span>
                )}
                {t === 'Catalog' && catalogCount > 0 && (
                  <span style={{ marginLeft: 6, background: 'rgba(249,115,22,0.15)', color: C.koi, borderRadius: 10, padding: '1px 6px', fontSize: 9, fontFamily: C.font }}>{catalogCount}</span>
                )}
                {t === 'History' && history.length > 0 && (
                  <span style={{ marginLeft: 6, background: 'rgba(14,165,233,0.15)', color: C.accent, borderRadius: 10, padding: '1px 6px', fontSize: 9, fontFamily: C.font }}>{history.length}</span>
                )}
              </button>
            ))}
            <button onClick={() => setSimpleMode(p => !p)} style={{
              background: simpleMode ? 'rgba(14,165,233,0.1)' : 'transparent',
              border: `1px solid ${simpleMode ? C.accentDim : C.border}`,
              color: simpleMode ? C.accent : C.muted,
              fontFamily: C.sans, fontSize: 12, padding: '6px 12px',
              borderRadius: 8, cursor: 'pointer', marginLeft: 4,
            }}>
              {simpleMode ? '🔓 Simple' : '🔒 Simple'}
            </button>
          </div>
        </div>

        <AgentBar agentStatuses={agentStatuses} />

        <SettingsBar
          customerName={customerName} setCustomerName={setCustomerName}
          customerAddress={customerAddress} setCustomerAddress={setCustomerAddress}
          laborRate={laborRate} setLaborRate={setLaborRate}
          companySettings={companySettings} setCompanySettings={setCompanySettings}
          showCompanyPanel={showCompanyPanel} setShowCompanyPanel={setShowCompanyPanel}
        />

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {tab === 'Chat' && <ChatTab messages={messages} input={input} setInput={setInput} onRun={runPipeline} running={running} history={history} onLoadJob={handleLoadJob} />}
          {tab === 'Proposal' && <ProposalTab data={pipelineData} customerName={customerName} customerAddress={customerAddress} companySettings={companySettings} simpleMode={simpleMode} />}
          {tab === 'Catalog' && <CatalogTab catalog={catalog} setCatalog={setCatalog} />}
          {tab === 'History' && <HistoryTab history={history} onLoad={handleLoadJob} onDelete={handleDeleteJob} onDuplicate={handleDuplicateJob} onStatusChange={handleStatusChange} />}
          {tab === 'Log' && !simpleMode && <LogTab log={log} />}
        </div>
      </div>
    </div>
  );
}
