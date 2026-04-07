import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockArchSpec } from '../data/mockArchSpecs.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';
import { isJiraConnected, getJiraCredentials, listEpics as poListEpics } from './poAgentService.js';
import { fetchStoriesByEpics, addCommentToIssue } from './jiraService.js';
import { pushGeneratedCode } from './gitService.js';

// ── Mock data (fallback when Jira is not connected) ──────────────
const mockInputStories = [
  { id: 'US-001', title: 'Network Slice Provisioning API', story_points: 8, priority: 'High' },
  { id: 'US-002', title: 'Tenant Isolation & Auth Gateway', story_points: 5, priority: 'High' },
  { id: 'US-003', title: 'SLA Monitoring Dashboard', story_points: 5, priority: 'Medium' },
  { id: 'US-004', title: 'Slice Lifecycle Event Bus', story_points: 8, priority: 'High' },
  { id: 'US-005', title: 'Usage Metering & Billing Integration', story_points: 5, priority: 'Medium' },
  { id: 'US-006', title: 'Observability & Trace Correlation', story_points: 8, priority: 'Medium' }
];

// Cache stories fetched from Jira so generateArchSpec can reference them
let jiraStoriesCache = [];

// ── Epics — reuse PO agent's connection ──────────────────────────
export function listEpics() {
  return poListEpics();
}

export function getJiraConnectionStatus() {
  const connected = isJiraConnected();
  const creds = connected ? getJiraCredentials() : null;
  return {
    connected,
    project: creds?.project || null
  };
}

// ── Stories — fetch from Jira or return mock ─────────────────────
export async function listStoriesByEpics(epicKeys) {
  if (!isJiraConnected()) {
    return { source: 'mock', items: mockInputStories };
  }

  const creds = getJiraCredentials();
  try {
    const stories = await fetchStoriesByEpics({ ...creds, epicKeys });
    // Normalise to the shape the frontend expects
    const items = stories.map((s) => ({
      id: s.key,
      title: s.summary,
      description: s.description,
      story_points: s.storyPoints || 0,
      priority: s.priority,
      status: s.status,
      parentKey: s.parentKey
    }));
    jiraStoriesCache = items;
    return { source: 'jira', items };
  } catch (err) {
    console.error('Jira story fetch failed:', err.message);
    return { source: 'mock', items: mockInputStories, message: err.message };
  }
}

// Legacy endpoint — returns mock or cached Jira stories
export function listInputStories() {
  if (jiraStoriesCache.length > 0) {
    return jiraStoriesCache;
  }
  return mockInputStories;
}

// ── Generate Architecture Spec ───────────────────────────────────
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
  // Resolve stories from Jira cache first, then fall back to mock
  const allStories = jiraStoriesCache.length > 0 ? jiraStoriesCache : mockInputStories;
  const stories = storyIds
    ? allStories.filter((s) => storyIds.includes(s.id))
    : allStories;

  if (!stories.length) throw new Error('No stories selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', stories, spec: buildMockArchSpec(stories) };
  }

  try {
    const generated = await callAgentLLM(stories, model);
    return { source: 'llm', stories, spec: normalizeArchSpec(generated) };
  } catch {
    return { source: 'mock', stories, spec: buildMockArchSpec(stories) };
  }
}

// ── Normalize LLM output to match expected schema ────────────────
function normalizeArchSpec(raw) {
  if (!raw) return raw;

  // Normalize HLD
  if (raw.hld) {
    const h = raw.hld;
    h.title = h.title || h.hld_title || 'High-Level Design';
    h.overview = h.overview || h.description || h.summary || '';
    h.architecture_style = h.architecture_style || h.style || h.pattern || '';
    h.integration_patterns = h.integration_patterns || h.patterns || [];
    if (h.components) {
      h.components = h.components.map((c) => ({
        name: c.name || c.component || c.title || 'Component',
        type: c.type || c.category || 'service',
        responsibility: c.responsibility || c.description || c.purpose || '',
        tech_stack: c.tech_stack || c.technologies || c.stack || []
      }));
    }
    if (h.nfrs) {
      h.nfrs = h.nfrs.map((n) => ({
        category: n.category || n.name || n.type || '',
        requirement: n.requirement || n.description || n.detail || '',
        target: n.target || n.metric || n.value || ''
      }));
    }
  }

  // Normalize LLD
  if (raw.lld?.modules) {
    raw.lld.modules = raw.lld.modules.map((m) => ({
      name: m.name || m.module || m.title || 'Module',
      component: m.component || m.parent || m.service || '',
      classes: m.classes || m.class_list || [],
      endpoints: (m.endpoints || m.apis || []).map((e) => ({
        method: e.method || e.http_method || 'GET',
        path: e.path || e.url || e.endpoint || '',
        description: e.description || e.summary || e.detail || ''
      })),
      database_entities: m.database_entities || m.entities || m.db_entities || m.tables || []
    }));
  }

  // Normalize ADRs
  if (raw.adrs) {
    raw.adrs = raw.adrs.map((a, i) => ({
      id: a.id || a.adr_id || `ADR-${String(i + 1).padStart(3, '0')}`,
      title: a.title || a.name || a.adr_title || 'ADR',
      status: a.status || 'Accepted',
      context: a.context || a.background || '',
      decision: a.decision || a.resolution || '',
      consequences: a.consequences || a.impact || a.outcome || ''
    }));
  }

  // Normalize diagrams
  if (raw.diagrams) {
    raw.diagrams.system_context = raw.diagrams.system_context || raw.diagrams.context || raw.diagrams.systemContext || '';
    raw.diagrams.sequence = raw.diagrams.sequence || raw.diagrams.sequence_diagram || raw.diagrams.sequenceDiagram || '';
  }

  return raw;
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

// ── Publish to Jira — add architecture doc as comment on epics ───
export async function publishArchToJira({ epicKeys, spec }) {
  if (!isJiraConnected()) {
    throw new Error('Not connected to Jira. Please connect via the Product Owner agent first.');
  }

  const creds = getJiraCredentials();
  const markdown = buildArchMarkdown(spec);

  const published = [];
  const failed = [];

  for (const epicKey of epicKeys) {
    try {
      await addCommentToIssue({
        ...creds,
        issueKey: epicKey,
        commentBody: markdown
      });
      published.push(epicKey);
    } catch (err) {
      failed.push({ epicKey, error: err.message });
    }
  }

  return { published, failed, total: epicKeys.length };
}

// ── Push to Git — commit architecture markdown to a repo ─────────
export async function pushArchToGit({ repoUrl, token, branch, spec, storyIds }) {
  if (!repoUrl || !token) {
    throw new Error('Repository URL and token are required.');
  }

  const markdown = buildArchMarkdown(spec);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `docs/architecture/arch-spec-${timestamp}.md`;

  const generatedFiles = { [fileName]: markdown };
  const commitMessage = `docs: AI-generated architecture specification for ${(storyIds || []).join(', ')} [AADP Arch Agent]`;

  const result = await pushGeneratedCode({
    clonedPath: null, // Will need a cloned repo — handled by controller
    storyIds: storyIds || [],
    generatedFiles,
    token,
    repoUrl,
    commitMessage,
    branchPrefix: 'arch-spec'
  });

  return result;
}

// ── Export as Markdown ────────────────────────────────────────────
export function buildArchMarkdown(spec) {
  if (!spec) return '# Architecture Specification\n\nNo data available.';

  const hld = spec.hld || {};
  const lld = spec.lld || {};
  const adrs = spec.adrs || [];
  const diagrams = spec.diagrams || {};

  let md = `# ${hld.title || 'Architecture Specification'}\n\n`;
  md += `${hld.overview || ''}\n\n`;
  md += `**Architecture Style:** ${hld.architecture_style || 'N/A'}\n\n`;

  // Integration patterns
  if (hld.integration_patterns?.length) {
    md += `## Integration Patterns\n`;
    hld.integration_patterns.forEach((p) => { md += `- ${p}\n`; });
    md += '\n';
  }

  // Components
  if (hld.components?.length) {
    md += `## Components (${hld.components.length})\n\n`;
    for (const c of hld.components) {
      md += `### ${c.name} (${(c.type || 'component').toUpperCase()})\n`;
      md += `${c.responsibility || ''}\n\n`;
      md += `**Tech Stack:** ${(c.tech_stack || []).join(', ')}\n\n`;
    }
  }

  // NFRs
  if (hld.nfrs?.length) {
    md += `## Non-Functional Requirements\n\n`;
    md += `| Category | Requirement | Target |\n|---|---|---|\n`;
    for (const n of hld.nfrs) {
      md += `| ${n.category || ''} | ${n.requirement || ''} | ${n.target || ''} |\n`;
    }
    md += '\n';
  }

  // LLD Modules
  if (lld.modules?.length) {
    md += `## Low-Level Design — Modules (${lld.modules.length})\n\n`;
    for (const m of lld.modules) {
      md += `### ${m.name} (${m.component || ''})\n`;
      md += `**Classes:** ${(m.classes || []).join(', ')}\n\n`;
      if (m.endpoints?.length) {
        md += `| Method | Path | Description |\n|---|---|---|\n`;
        for (const e of m.endpoints) {
          md += `| ${e.method || ''} | ${e.path || ''} | ${e.description || ''} |\n`;
        }
        md += '\n';
      }
      md += `**DB Entities:** ${(m.database_entities || []).join(', ')}\n\n`;
    }
  }

  // ADRs
  if (adrs.length) {
    md += `## Architecture Decision Records (${adrs.length})\n\n`;
    for (const a of adrs) {
      md += `### ${a.id}: ${a.title} [${a.status || ''}]\n`;
      md += `**Context:** ${a.context || ''}\n\n`;
      md += `**Decision:** ${a.decision || ''}\n\n`;
      md += `**Consequences:** ${a.consequences || ''}\n\n`;
    }
  }

  // OpenAPI
  if (spec.openapi_snippet) {
    md += `## OpenAPI Contract\n\n\`\`\`yaml\n${spec.openapi_snippet}\n\`\`\`\n\n`;
  }

  // Diagrams
  if (diagrams.system_context) {
    md += `## System Context Diagram\n\n\`\`\`mermaid\n${diagrams.system_context}\n\`\`\`\n\n`;
  }
  if (diagrams.sequence) {
    md += `## Sequence Diagram\n\n\`\`\`mermaid\n${diagrams.sequence}\n\`\`\`\n\n`;
  }

  return md;
}
