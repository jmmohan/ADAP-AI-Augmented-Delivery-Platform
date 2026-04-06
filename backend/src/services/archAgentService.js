import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockArchSpec } from '../data/mockArchSpecs.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockInputStories = [
  { id: 'US-001', title: 'Network Slice Provisioning API', story_points: 8, priority: 'High' },
  { id: 'US-002', title: 'Tenant Isolation & Auth Gateway', story_points: 5, priority: 'High' },
  { id: 'US-003', title: 'SLA Monitoring Dashboard', story_points: 5, priority: 'Medium' },
  { id: 'US-004', title: 'Slice Lifecycle Event Bus', story_points: 8, priority: 'High' },
  { id: 'US-005', title: 'Usage Metering & Billing Integration', story_points: 5, priority: 'Medium' },
  { id: 'US-006', title: 'Observability & Trace Correlation', story_points: 8, priority: 'Medium' }
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

export async function generateArchSpec({ storyIds, model }) {
  const stories = storyIds
    ? mockInputStories.filter((s) => storyIds.includes(s.id))
    : mockInputStories;

  if (!stories.length) throw new Error('No stories selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', stories, spec: buildMockArchSpec(stories) };
  }

  try {
    const generated = await callAgentLLM(stories, model);
    return { source: 'llm', stories, spec: generated };
  } catch {
    return { source: 'mock', stories, spec: buildMockArchSpec(stories) };
  }
}

async function callAgentLLM(stories, modelName) {
  const storySummary = stories.map((s) => `- ${s.id}: ${s.title} (${s.story_points} pts, ${s.priority})`).join('\n');

  const systemPrompt = getSystemPrompt('arch') || 'You are an expert software architect. Return valid JSON only. Ensure diagrams.system_context and diagrams.sequence contain valid Mermaid syntax.';
  const template = getUserPromptTemplate('arch');
  const prompt = template
    ? template.replace('{{storySummary}}', storySummary)
    : `You are a principal software architect for a large telecom engineering org (800+ engineers). Generate architecture specs for these user stories:\n\n${storySummary}\n\nReturn ONLY valid JSON. Telecom/5G domain specificity required. Include at least 4-6 components and 3-4 modules.`;

  return callLLM(systemPrompt, prompt, modelName);
}
