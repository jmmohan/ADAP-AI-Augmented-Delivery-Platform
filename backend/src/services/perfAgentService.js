import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockPerfReport } from '../data/mockPerfReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'PERF-001', title: 'Architecture NFRs (Performance, Scalability)', type: 'nfrs', status: 'Ready', source: 'Arch Agent' },
  { id: 'PERF-002', title: 'Generated Code — All Services', type: 'code', status: 'Ready', source: 'Code Agent' },
  { id: 'PERF-003', title: 'OpenAPI Contract (12 endpoints)', type: 'api_spec', status: 'Ready', source: 'Arch Agent' },
  { id: 'PERF-004', title: 'QA Deployment Metrics', type: 'metrics', status: 'Ready', source: 'Deploy Agent' },
  { id: 'PERF-005', title: 'Production Monitoring Data', type: 'monitoring', status: 'Ready', source: 'Monitor Agent' }
];

export function listPerfItems() {
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

export async function generatePerfReport({ itemIds, model }) {
  const items = itemIds
    ? mockInputItems.filter((i) => itemIds.includes(i.id))
    : mockInputItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, performance: buildMockPerfReport(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, performance: generated };
  } catch {
    return { source: 'mock', items, performance: buildMockPerfReport(items) };
  }
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('perf') || 'You are an expert performance engineer. Return valid JSON only.';
  const template = getUserPromptTemplate('perf');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Senior Performance Engineer for a large telecom org. Generate a comprehensive performance analysis and capacity plan from these artifacts:\n\n${itemSummary}\n\nReturn ONLY valid JSON with performance_budget, load_test_results, capacity_plan, bottleneck_analysis, cost_optimization, sla_validation, summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
