import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockSecurityReport } from '../data/mockSecurityReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'SEC-001', title: 'Architecture Specification (HLD + LLD)', type: 'architecture', status: 'Ready', source: 'Arch Agent' },
  { id: 'SEC-002', title: 'Generated Code — All Modules', type: 'code', status: 'Ready', source: 'Code Agent' },
  { id: 'SEC-003', title: 'Helm Charts & K8s Manifests', type: 'iac', status: 'Ready', source: 'Deploy Agent' },
  { id: 'SEC-004', title: 'Container Images (4 services)', type: 'container', status: 'Ready', source: 'Deploy Agent' },
  { id: 'SEC-005', title: 'API Gateway Configuration (Kong)', type: 'config', status: 'Ready', source: 'Arch Agent' }
];

export function listSecurityItems() {
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

export async function generateSecurityReport({ itemIds, model }) {
  const items = itemIds
    ? mockInputItems.filter((i) => itemIds.includes(i.id))
    : mockInputItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, security: buildMockSecurityReport(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, security: generated };
  } catch {
    return { source: 'mock', items, security: buildMockSecurityReport(items) };
  }
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('security') || 'You are an expert security engineer. Return valid JSON only.';
  const template = getUserPromptTemplate('security');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Senior Security Engineer for a large telecom org. Perform a comprehensive security assessment on these artifacts:\n\n${itemSummary}\n\nReturn ONLY valid JSON with threat_model, sast_results, container_security, owasp_checklist[], iac_review, summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
