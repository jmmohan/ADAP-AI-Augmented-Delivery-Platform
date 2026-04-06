import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockDocumentation } from '../data/mockDocumentation.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'DOC-001', title: 'User Stories (US-001 to US-006)', type: 'stories', status: 'Ready', source: 'PO Agent' },
  { id: 'DOC-002', title: 'Architecture Specification (HLD + LLD + ADRs)', type: 'architecture', status: 'Ready', source: 'Arch Agent' },
  { id: 'DOC-003', title: 'OpenAPI Contract (v1.0.0)', type: 'api_spec', status: 'Ready', source: 'Arch Agent' },
  { id: 'DOC-004', title: 'Generated Code & Project Structure', type: 'code', status: 'Ready', source: 'Code Agent' },
  { id: 'DOC-005', title: 'Deployment Configuration (Helm + K8s)', type: 'deployment', status: 'Ready', source: 'Deploy Agent' },
  { id: 'DOC-006', title: 'Monitoring & Triage Reports', type: 'monitoring', status: 'Ready', source: 'Monitor Agent' }
];

export function listDocItems() {
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

export async function generateDocumentation({ itemIds, model }) {
  const items = itemIds
    ? mockInputItems.filter((i) => itemIds.includes(i.id))
    : mockInputItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, documentation: buildMockDocumentation(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, documentation: generated };
  } catch {
    return { source: 'mock', items, documentation: buildMockDocumentation(items) };
  }
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('doc') || 'You are an expert technical writer. Return valid JSON only.';
  const template = getUserPromptTemplate('doc');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Senior Technical Writer for a large telecom org. Generate comprehensive documentation from these delivery artifacts:\n\n${itemSummary}\n\nReturn ONLY valid JSON with api_docs, runbooks[], release_notes, architecture_wiki, decision_log[], summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
