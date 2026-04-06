import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockComplianceReport } from '../data/mockComplianceReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'CMP-001', title: 'Architecture Specification & ADRs', type: 'architecture', status: 'Ready', source: 'Arch Agent' },
  { id: 'CMP-002', title: 'Generated Code & Dependencies', type: 'code', status: 'Ready', source: 'Code Agent' },
  { id: 'CMP-003', title: 'Security Assessment Report', type: 'security', status: 'Ready', source: 'Security Agent' },
  { id: 'CMP-004', title: 'Test Execution Results', type: 'test_results', status: 'Ready', source: 'Test Agent' },
  { id: 'CMP-005', title: 'Deployment Configuration', type: 'deployment', status: 'Ready', source: 'Deploy Agent' },
  { id: 'CMP-006', title: 'Review Agent Scorecard', type: 'review', status: 'Ready', source: 'Review Agent' }
];

export function listComplianceItems() {
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

export async function generateComplianceReport({ itemIds, model }) {
  const items = itemIds
    ? mockInputItems.filter((i) => itemIds.includes(i.id))
    : mockInputItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, compliance: buildMockComplianceReport(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, compliance: generated };
  } catch {
    return { source: 'mock', items, compliance: buildMockComplianceReport(items) };
  }
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('compliance') || 'You are an expert compliance officer. Return valid JSON only.';
  const template = getUserPromptTemplate('compliance');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Compliance & Governance Officer for a large telecom org. Generate a compliance assessment from these delivery artifacts:\n\n${itemSummary}\n\nReturn ONLY valid JSON with regulatory_mapping, audit_trail, policy_enforcement, license_audit, change_request, evidence_package, summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
