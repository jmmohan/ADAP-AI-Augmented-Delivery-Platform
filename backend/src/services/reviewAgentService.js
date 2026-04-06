import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockReviewReport } from '../data/mockReviewReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'AREV-001', title: 'Architecture Specification (HLD + LLD)', type: 'architecture', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-002', title: 'ADR-001: Event Sourcing for Slice Lifecycle', type: 'adr', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-003', title: 'ADR-002: Schema-Level Tenant Isolation', type: 'adr', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-004', title: 'ADR-003: Kafka Backbone for Inter-Service Events', type: 'adr', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-005', title: 'OpenAPI 3.0 Contract — Slice Management API', type: 'api-contract', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-006', title: 'Sequence Diagrams — Slice Provisioning Flow', type: 'diagram', status: 'Ready', source: 'Arch Agent' }
];

export function listReviewItems() {
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

export async function generateReviewReport({ itemIds, model }) {
  const items = itemIds
    ? mockInputItems.filter((i) => itemIds.includes(i.id))
    : mockInputItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, review: buildMockReviewReport(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, review: generated };
  } catch {
    return { source: 'mock', items, review: buildMockReviewReport(items) };
  }
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('review') || 'You are an expert architect and code reviewer. Return valid JSON only.';
  const template = getUserPromptTemplate('review');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Principal Architect and Senior Code Reviewer for a large telecom engineering org. Review these artifacts and generate a comprehensive review report:\n\n${itemSummary}\n\nReturn ONLY valid JSON with arch_review, code_review, compliance_checks[], summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
