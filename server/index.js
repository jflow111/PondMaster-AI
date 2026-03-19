const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJSON(text) {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found in response');
  return JSON.parse(text.slice(first, last + 1));
}

async function runAgent(systemPrompt, userContent, log, agentName) {
  log.push({ time: new Date().toISOString(), agent: agentName, status: 'running' });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });
  const text = response.content[0].text;
  const result = extractJSON(text);
  log.push({ time: new Date().toISOString(), agent: agentName, status: 'complete' });
  return result;
}

const INTAKE_SYSTEM = `You are a pond construction intake specialist. Extract structured information from the contractor's job description.
Respond with PURE JSON ONLY — no markdown, no explanation, no code fences.
Return exactly this structure:
{
  "pond_type": "koi|water_garden|natural_swim|fountain|pondless_waterfall",
  "length_ft": number,
  "width_ft": number,
  "depth_ft": number,
  "has_waterfall": boolean,
  "waterfall_width_ft": number,
  "waterfall_height_ft": number,
  "has_fish": boolean,
  "fish_load": "none|light|medium|heavy",
  "shape": "rectangular|freeform|kidney|oval",
  "site_conditions": "flat|sloped|rocky|soft_soil|clay",
  "desired_aesthetic": "natural|formal|japanese|contemporary",
  "special_notes": "string"
}
Use reasonable defaults for any missing info. Never return markdown.`;

const ESTIMATOR_SYSTEM = `You are a pond construction materials estimator. Calculate all quantities from the intake data.
Respond with PURE JSON ONLY — no markdown, no explanation, no code fences.
Return exactly this structure:
{
  "pond_surface_sqft": number,
  "pond_volume_gallons": number,
  "liner_length_ft": number,
  "liner_width_ft": number,
  "liner_sqft": number,
  "underlayment_sqft": number,
  "rock_tons": number,
  "gravel_tons": number,
  "pump_gph_required": number,
  "pvc_pipe_linear_ft": number,
  "num_skimmers": number,
  "num_biofalls": number,
  "needs_uv": boolean,
  "needs_aeration": boolean,
  "bottom_drains": number,
  "excavation_cubic_yards": number
}
Formulas: pond_surface_sqft = length * width, pond_volume_gallons = length * width * depth * 7.48,
liner_length_ft = length + (2 * depth) + 2, liner_width_ft = width + (2 * depth) + 2,
liner_sqft = liner_length * liner_width, underlayment_sqft = liner_sqft * 1.1,
rock_tons = surface_sqft / 40, gravel_tons = surface_sqft / 80,
pump_gph = volume_gallons (+ 20% if has_waterfall), excavation_cubic_yards = (length * width * depth) / 27.
Never return markdown.`;

const EQUIPMENT_SYSTEM = `You are a pond equipment specialist. Recommend specific equipment with model classes and cost ranges.
Respond with PURE JSON ONLY — no markdown, no explanation, no code fences.
Return exactly this structure:
{
  "pump": { "model_class": "string", "gph_rating": number, "cost_low": number, "cost_high": number },
  "skimmer": { "model_class": "string", "qty": number, "cost_low": number, "cost_high": number },
  "biofalls": { "model_class": "string", "qty": number, "cost_low": number, "cost_high": number },
  "uv_clarifier": { "model_class": "string", "watts": number, "cost_low": number, "cost_high": number, "included": boolean },
  "aeration_kit": { "model_class": "string", "cost_low": number, "cost_high": number, "included": boolean },
  "bottom_drain": { "model_class": "string", "qty": number, "cost_low": number, "cost_high": number },
  "liner": { "brand_class": "string", "mil_thickness": number, "cost_per_sqft_low": number, "cost_per_sqft_high": number },
  "underlayment": { "brand_class": "string", "cost_per_sqft_low": number, "cost_per_sqft_high": number },
  "plumbing": { "pipe_type": "string", "fittings_cost_low": number, "fittings_cost_high": number },
  "electrical": { "gfci_outlets": number, "conduit_linear_ft": number, "cost_low": number, "cost_high": number },
  "total_equipment_cost_low": number,
  "total_equipment_cost_high": number
}
Never return markdown.`;

const LABOR_SYSTEM = `You are a pond construction labor planner. Create a realistic crew schedule.
Respond with PURE JSON ONLY — no markdown, no explanation, no code fences.
Return exactly this structure:
{
  "crew_size": number,
  "total_days": number,
  "total_labor_hours": number,
  "total_labor_cost": number,
  "day_schedule": [
    {
      "day": number,
      "tasks": ["string"],
      "crew_focus": "string",
      "hours": number
    }
  ]
}
Never return markdown.`;

const PROPOSAL_SYSTEM = `You are a professional pond construction proposal writer. Write a complete contractor proposal.
Respond with PURE JSON ONLY — no markdown, no explanation, no code fences.
Return exactly this structure:
{
  "project_title": "string",
  "executive_summary": "string",
  "scope_of_work": ["string"],
  "pond_specifications": {
    "type": "string",
    "dimensions": "string",
    "volume": "string",
    "liner": "string",
    "filtration": "string"
  },
  "materials_list": [{ "item": "string", "qty": "string", "unit": "string" }],
  "equipment_list": [{ "item": "string", "model_class": "string", "qty": number }],
  "labor_summary": "string",
  "project_timeline": "string",
  "cost_breakdown": {
    "excavation": number,
    "liner_underlayment": number,
    "rock_gravel": number,
    "equipment": number,
    "plumbing": number,
    "electrical": number,
    "labor": number,
    "overhead_profit": number,
    "total_low": number,
    "total_high": number
  },
  "warranty_notes": "string",
  "contractor_notes": "string",
  "payment_terms": "string"
}
Never return markdown.`;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function buildCatalogContext(catalog) {
  if (!catalog || (!catalog.equipment?.length && !catalog.materials?.length)) return '';

  const lines = ['\n\nVENDOR CATALOG (use these exact prices — do not estimate):'];

  if (catalog.equipment?.length) {
    lines.push('\nEQUIPMENT:');
    catalog.equipment.forEach(item => {
      lines.push(`  - ${item.category} | ${item.name}${item.model ? ' (' + item.model + ')' : ''} | $${item.cost} each${item.gph ? ' | ' + item.gph + ' GPH' : ''}${item.watts ? ' | ' + item.watts + 'W' : ''}`);
    });
  }

  if (catalog.materials?.length) {
    lines.push('\nMATERIALS:');
    catalog.materials.forEach(item => {
      lines.push(`  - ${item.category} | ${item.name} | $${item.cost} per ${item.unit}`);
    });
  }

  lines.push('\nWhen catalog items match what is needed, use their exact costs. For items not in the catalog, use market estimates.');
  return lines.join('\n');
}

app.post('/api/pipeline', async (req, res) => {
  const { jobDescription, laborRate = 75, catalog } = req.body;
  if (!jobDescription) {
    return res.status(400).json({ success: false, error: 'jobDescription is required' });
  }

  const catalogContext = buildCatalogContext(catalog);
  const log = [];

  try {
    // Agent 1 — Intake
    const intake = await runAgent(INTAKE_SYSTEM, `Job Description: ${jobDescription}`, log, 'Intake Agent');

    // Agent 2 — Estimator
    const calc = await runAgent(
      ESTIMATOR_SYSTEM,
      `Intake data: ${JSON.stringify(intake)}`,
      log,
      'Estimator Agent'
    );

    // Agent 3 — Equipment (catalog injected here)
    const equipment = await runAgent(
      EQUIPMENT_SYSTEM,
      `Intake: ${JSON.stringify(intake)}\nCalculations: ${JSON.stringify(calc)}${catalogContext}`,
      log,
      'Equipment Agent'
    );

    // Agent 4 — Labor Planner
    const labor = await runAgent(
      LABOR_SYSTEM,
      `Intake: ${JSON.stringify(intake)}\nCalculations: ${JSON.stringify(calc)}\nEquipment: ${JSON.stringify(equipment)}\nLabor Rate: $${laborRate}/hr`,
      log,
      'Labor Planner'
    );

    // Agent 5 — Proposal Writer (catalog injected here too)
    const proposal = await runAgent(
      PROPOSAL_SYSTEM,
      `Intake: ${JSON.stringify(intake)}\nCalculations: ${JSON.stringify(calc)}\nEquipment: ${JSON.stringify(equipment)}\nLabor: ${JSON.stringify(labor)}\nLabor Rate: $${laborRate}/hr${catalogContext}`,
      log,
      'Proposal Writer'
    );

    res.json({ success: true, data: { intake, calc, equipment, labor, proposal }, log });
  } catch (err) {
    log.push({ time: new Date().toISOString(), agent: 'Pipeline', status: 'error', message: err.message });
    res.status(500).json({ success: false, error: err.message, log });
  }
});

// Serve React build
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`PondMaster AI server running on port ${PORT}`);
});
