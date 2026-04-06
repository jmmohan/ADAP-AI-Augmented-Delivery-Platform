import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockTriageReport } from '../data/mockMonitoring.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockServices = [
  { id: 'SVC-001', name: 'slice-provisioning-service', status: 'Degraded', uptime: '99.2%', region: 'us-east-1' },
  { id: 'SVC-002', name: 'tenant-auth-gateway', status: 'Healthy', uptime: '99.99%', region: 'us-east-1' },
  { id: 'SVC-003', name: 'sla-monitoring-service', status: 'Healthy', uptime: '99.95%', region: 'us-east-1' },
  { id: 'SVC-004', name: 'event-bus-broker', status: 'Warning', uptime: '99.8%', region: 'us-east-1' },
  { id: 'SVC-005', name: 'billing-metering-service', status: 'Healthy', uptime: '99.97%', region: 'us-east-1' },
  { id: 'SVC-006', name: 'postgres-primary', status: 'Degraded', uptime: '99.5%', region: 'us-east-1' }
];

export function listServices() {
  return mockServices;
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

export async function generateTriageReport({ serviceIds, model }) {
  const services = serviceIds
    ? mockServices.filter((s) => serviceIds.includes(s.id))
    : mockServices;

  if (!services.length) throw new Error('No services selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', services, triage: buildMockTriageReport(services) };
  }

  try {
    const generated = await callAgentLLM(services, model);
    return { source: 'llm', services, triage: generated };
  } catch {
    return { source: 'mock', services, triage: buildMockTriageReport(services) };
  }
}

async function callAgentLLM(services, modelName) {
  const serviceSummary = services.map((s) => `- ${s.id}: ${s.name} (${s.status}, uptime: ${s.uptime})`).join('\n');

  const systemPrompt = getSystemPrompt('monitor') || 'You are an expert SRE engineer. Return valid JSON only.';
  const template = getUserPromptTemplate('monitor');
  const prompt = template
    ? template.replace('{{serviceSummary}}', serviceSummary)
    : `You are a Senior SRE for a large telecom org. Analyse these services and generate an incident triage report:\n\n${serviceSummary}\n\nReturn ONLY valid JSON with anomalies[], traces[], rca, correlations[], recommendations[], jira_defects[], summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
