import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockIncidentReport } from '../data/mockIncidentReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'INC-001', title: 'INC-2026-0324-001: DB Pool Exhaustion', type: 'incident', severity: 'SEV-2', status: 'Resolved', source: 'Monitor Agent' },
  { id: 'INC-002', title: 'INC-2026-0220-001: Deployment Latency Spike', type: 'incident', severity: 'SEV-2', status: 'Resolved', source: 'Monitor Agent' },
  { id: 'INC-003', title: 'INC-2026-0115-002: Kafka Consumer Lag', type: 'incident', severity: 'SEV-3', status: 'Resolved', source: 'Monitor Agent' },
  { id: 'INC-004', title: 'INC-2026-0108-001: Auth Gateway Timeout', type: 'incident', severity: 'SEV-3', status: 'Resolved', source: 'Monitor Agent' },
  { id: 'INC-005', title: 'INC-2025-1215-001: Certificate Expiry Alert', type: 'incident', severity: 'SEV-4', status: 'Resolved', source: 'Monitor Agent' }
];

export function listIncidents() {
  return mockInputItems;
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]);
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('Could not parse JSON from model.');
  }
}

export async function generateIncidentReport({ incidentIds, model }) {
  const incidents = incidentIds
    ? mockInputItems.filter((i) => incidentIds.includes(i.id))
    : mockInputItems;

  if (!incidents.length) throw new Error('No incidents selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', incidents, incident: buildMockIncidentReport(incidents) };
  }

  try {
    const generated = await callAgentLLM(incidents, model);
    return { source: 'llm', incidents, incident: generated };
  } catch {
    return { source: 'mock', incidents, incident: buildMockIncidentReport(incidents) };
  }
}

async function callAgentLLM(incidents, modelName) {
  const incidentSummary = incidents.map((i) => `- ${i.id}: ${i.title} (${i.severity}, ${i.status})`).join('\n');

  const systemPrompt = getSystemPrompt('incident') || 'You are an expert SRE and incident manager. Return valid JSON only.';
  const template = getUserPromptTemplate('incident');
  const prompt = template
    ? template.replace('{{incidentSummary}}', incidentSummary)
    : `You are a Senior SRE and Incident Manager for a large telecom org. Generate a comprehensive incident postmortem and pattern analysis from these incidents:\n\n${incidentSummary}\n\nReturn ONLY valid JSON with postmortem, action_items[], pattern_analysis, metrics, runbook_updates[], summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
