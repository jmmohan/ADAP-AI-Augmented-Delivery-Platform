import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockTestPlan } from '../data/mockTestPlans.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputStories = [
  { id: 'US-001', title: 'Network Slice Provisioning API', story_points: 8, priority: 'High', acceptance_criteria: ['Given valid tenant When slice requested Then slice provisioned within 30s'] },
  { id: 'US-002', title: 'Tenant Isolation & Auth Gateway', story_points: 5, priority: 'High', acceptance_criteria: ['Given unauthenticated request When accessing API Then 401 returned'] },
  { id: 'US-003', title: 'SLA Monitoring Dashboard', story_points: 5, priority: 'Medium', acceptance_criteria: ['Given active slice When SLA breached Then alert triggered within 5s'] },
  { id: 'US-004', title: 'Slice Lifecycle Event Bus', story_points: 8, priority: 'High', acceptance_criteria: ['Given slice state change When event published Then all subscribers notified'] },
  { id: 'US-005', title: 'Usage Metering & Billing Integration', story_points: 5, priority: 'Medium', acceptance_criteria: ['Given metered usage When billing cycle ends Then invoice generated accurately'] },
  { id: 'US-006', title: 'Observability & Trace Correlation', story_points: 8, priority: 'Medium', acceptance_criteria: ['Given distributed request When trace queried Then full call chain visible'] }
];

export function listInputStories() {
  return mockInputStories;
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

export async function generateTestPlan({ storyIds, model }) {
  const stories = storyIds
    ? mockInputStories.filter((s) => storyIds.includes(s.id))
    : mockInputStories;

  if (!stories.length) throw new Error('No stories selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', stories, plan: buildMockTestPlan(stories) };
  }

  try {
    const generated = await callAgentLLM(stories, model);
    return { source: 'llm', stories, plan: generated };
  } catch {
    return { source: 'mock', stories, plan: buildMockTestPlan(stories) };
  }
}

async function callAgentLLM(stories, modelName) {
  const storySummary = stories.map((s) => `- ${s.id}: ${s.title} | AC: ${(s.acceptance_criteria || []).join('; ')}`).join('\n');

  const systemPrompt = getSystemPrompt('test') || 'You are an expert QA architect. Return valid JSON only.';
  const template = getUserPromptTemplate('test');
  const prompt = template
    ? template.replace('{{storySummary}}', storySummary)
    : `You are a Senior QA Architect for a large telecom org. Generate a comprehensive test plan for these stories:\n\n${storySummary}\n\nReturn ONLY valid JSON with strategy, test_suites[], bdd_scenarios[], automation_snippets[], summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
