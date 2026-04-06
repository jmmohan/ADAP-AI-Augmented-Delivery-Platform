import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockReleaseReport } from '../data/mockReleaseReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputItems = [
  { id: 'REL-001', title: 'QA Deployment Report (v1.4.0-rc.1)', type: 'deployment', status: 'Complete', source: 'Deploy Agent' },
  { id: 'REL-002', title: 'Test Execution Results (98 tests)', type: 'test_results', status: 'Complete', source: 'Deploy Agent' },
  { id: 'REL-003', title: 'Architecture Review Verdict', type: 'review', status: 'Approved', source: 'Review Agent' },
  { id: 'REL-004', title: 'Security Assessment Report', type: 'security', status: 'Complete', source: 'Security Agent' },
  { id: 'REL-005', title: 'Code Quality Report (SonarQube)', type: 'quality', status: 'Complete', source: 'Code Agent' },
  { id: 'REL-006', title: 'Compliance Matrix', type: 'compliance', status: 'Complete', source: 'Compliance Agent' }
];

export function listReleaseItems() {
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

export async function generateReleaseReport({ itemIds, model }) {
  const items = itemIds
    ? mockInputItems.filter((i) => itemIds.includes(i.id))
    : mockInputItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, release: buildMockReleaseReport(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, release: generated };
  } catch {
    return { source: 'mock', items, release: buildMockReleaseReport(items) };
  }
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.status}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('release') || 'You are an expert release manager. Return valid JSON only.';
  const template = getUserPromptTemplate('release');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Release Manager for a large telecom org. Generate a release readiness report from these signals:\n\n${itemSummary}\n\nReturn ONLY valid JSON with readiness_checklist, scorecard, changelog, version_recommendation, notification_drafts[], rollback_decision, summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
