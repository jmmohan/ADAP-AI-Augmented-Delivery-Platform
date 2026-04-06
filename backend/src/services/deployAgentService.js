import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockDeployment } from '../data/mockDeployments.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const mockArtifacts = [
  { id: 'ART-001', name: 'slice-provisioning-service', version: 'v1.4.0-rc.1', type: 'container', size: '245 MB', built_at: '2026-03-24T09:15:00Z' },
  { id: 'ART-002', name: 'tenant-auth-gateway', version: 'v1.4.0-rc.1', type: 'container', size: '180 MB', built_at: '2026-03-24T09:18:00Z' },
  { id: 'ART-003', name: 'sla-monitoring-dashboard', version: 'v1.4.0-rc.1', type: 'container', size: '120 MB', built_at: '2026-03-24T09:20:00Z' },
  { id: 'ART-004', name: 'event-bus-broker', version: 'v1.4.0-rc.1', type: 'container', size: '195 MB', built_at: '2026-03-24T09:22:00Z' },
  { id: 'ART-005', name: 'helm-chart-slice-platform', version: '1.4.0-rc.1', type: 'helm', size: '12 KB', built_at: '2026-03-24T09:25:00Z' }
];

export function listArtifacts() {
  return mockArtifacts;
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

export async function generateDeployment({ artifactIds, model }) {
  const artifacts = artifactIds
    ? mockArtifacts.filter((a) => artifactIds.includes(a.id))
    : mockArtifacts;

  if (!artifacts.length) throw new Error('No artifacts selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', artifacts, deployment: buildMockDeployment(artifacts) };
  }

  try {
    const generated = await callAgentLLM(artifacts, model);
    return { source: 'llm', artifacts, deployment: generated };
  } catch {
    return { source: 'mock', artifacts, deployment: buildMockDeployment(artifacts) };
  }
}

async function callAgentLLM(artifacts, modelName) {
  const artifactSummary = artifacts.map((a) => `- ${a.id}: ${a.name} (${a.version}, ${a.type}, ${a.size})`).join('\n');

  const systemPrompt = getSystemPrompt('deploy') || 'You are an expert DevOps engineer. Return valid JSON only.';
  const template = getUserPromptTemplate('deploy');
  const prompt = template
    ? template.replace('{{artifactSummary}}', artifactSummary)
    : `You are a Senior DevOps/SRE engineer for a large telecom org. Generate a deployment report for these artifacts being deployed to QA:\n\n${artifactSummary}\n\nReturn ONLY valid JSON with pipeline, environment, test_results, rollback_plan, summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}
