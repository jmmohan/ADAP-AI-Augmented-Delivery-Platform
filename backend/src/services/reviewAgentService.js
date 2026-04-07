import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockReviewReport } from '../data/mockReviewReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';
import { isJiraConnected, getJiraCredentials, listEpics as poListEpics } from './poAgentService.js';
import { fetchStoriesByEpics, addCommentToIssue } from './jiraService.js';

// ── Mock artifacts (fallback when Jira/Git not connected) ────────
const mockInputItems = [
  { id: 'AREV-001', title: 'Architecture Specification (HLD + LLD)', type: 'architecture', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-002', title: 'ADR-001: Event Sourcing for Slice Lifecycle', type: 'adr', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-003', title: 'ADR-002: Schema-Level Tenant Isolation', type: 'adr', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-004', title: 'ADR-003: Kafka Backbone for Inter-Service Events', type: 'adr', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-005', title: 'OpenAPI 3.0 Contract — Slice Management API', type: 'api-contract', status: 'Ready', source: 'Arch Agent' },
  { id: 'AREV-006', title: 'Sequence Diagrams — Slice Provisioning Flow', type: 'diagram', status: 'Ready', source: 'Arch Agent' }
];

// Cache for artifacts fetched from Jira
let jiraArtifactsCache = [];

// ── Epics — reuse PO agent's connection ──────────────────────────
export function listEpics() {
  return poListEpics();
}

export function getJiraConnectionStatus() {
  const connected = isJiraConnected();
  const creds = connected ? getJiraCredentials() : null;
  return { connected, project: creds?.project || null };
}

// ── Artifacts — fetch from Jira stories or return mock ───────────
export async function listArtifactsByEpics(epicKeys) {
  if (!isJiraConnected()) {
    return { source: 'mock', items: mockInputItems };
  }

  const creds = getJiraCredentials();
  try {
    const stories = await fetchStoriesByEpics({ ...creds, epicKeys });
    // Build review artifacts from Jira stories — each story's arch docs become review items
    const items = stories.map((s, i) => ({
      id: s.key,
      title: s.summary,
      description: s.description,
      type: guessArtifactType(s.summary),
      status: s.status || 'Ready',
      source: 'Jira',
      priority: s.priority,
      parentKey: s.parentKey
    }));
    jiraArtifactsCache = items;
    return { source: 'jira', items };
  } catch (err) {
    console.error('Jira artifact fetch failed:', err.message);
    return { source: 'mock', items: mockInputItems, message: err.message };
  }
}

function guessArtifactType(summary) {
  const lower = (summary || '').toLowerCase();
  if (lower.includes('adr')) return 'adr';
  if (lower.includes('openapi') || lower.includes('api contract') || lower.includes('swagger')) return 'api-contract';
  if (lower.includes('diagram') || lower.includes('sequence') || lower.includes('mermaid')) return 'diagram';
  if (lower.includes('hld') || lower.includes('lld') || lower.includes('architect')) return 'architecture';
  return 'architecture';
}

export function listReviewItems() {
  if (jiraArtifactsCache.length > 0) return jiraArtifactsCache;
  return mockInputItems;
}

// ── Generate Review Report ───────────────────────────────────────
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
  const allItems = jiraArtifactsCache.length > 0 ? jiraArtifactsCache : mockInputItems;
  const items = itemIds
    ? allItems.filter((i) => itemIds.includes(i.id))
    : allItems;

  if (!items.length) throw new Error('No items selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', items, review: buildMockReviewReport(items) };
  }

  try {
    const generated = await callAgentLLM(items, model);
    return { source: 'llm', items, review: normalizeReviewReport(generated) };
  } catch {
    return { source: 'mock', items, review: buildMockReviewReport(items) };
  }
}

// ── Normalize LLM output to match expected schema ────────────────
function normalizeReviewReport(raw) {
  if (!raw) return raw;

  // Normalize arch_review
  if (raw.arch_review) {
    const ar = raw.arch_review;
    ar.title = ar.title || ar.review_title || 'Architecture Review';
    ar.overall_verdict = ar.overall_verdict || ar.verdict || ar.result || 'N/A';
    ar.score = ar.score || ar.total_score || ar.arch_score || 0;
    ar.max_score = ar.max_score || ar.maxScore || 100;

    if (ar.categories) {
      ar.categories = ar.categories.map((cat) => ({
        name: cat.name || cat.category || cat.title || 'Category',
        score: cat.score || cat.rating || 0,
        status: cat.status || cat.result || (cat.score >= 80 ? 'Pass' : 'Warning'),
        findings: cat.findings || cat.observations || [],
        violations: (cat.violations || cat.issues || []).map((v) => ({
          severity: v.severity || v.level || v.priority || 'Medium',
          description: v.description || v.message || v.issue || v.detail || '',
          recommendation: v.recommendation || v.fix || v.suggestion || v.remediation || ''
        }))
      }));
    }
  }

  // Normalize compliance_checks
  if (raw.compliance_checks) {
    raw.compliance_checks = raw.compliance_checks.map((c) => ({
      check: c.check || c.name || c.title || c.item || 'Check',
      status: c.status || c.result || 'Pass',
      value: c.value || c.details || c.detail || c.description || ''
    }));
  }

  // Normalize summary
  if (raw.summary) {
    const s = raw.summary;
    raw.summary = {
      overall_verdict: s.overall_verdict || s.verdict || raw.arch_review?.overall_verdict || 'N/A',
      arch_score: s.arch_score || s.score || raw.arch_review?.score || 0,
      total_violations: s.total_violations || s.totalViolations || s.violations || 0,
      critical_violations: s.critical_violations || s.critical || 0,
      high_violations: s.high_violations || s.high || 0,
      medium_violations: s.medium_violations || s.medium || 0,
      low_violations: s.low_violations || s.low || 0,
      conditions: s.conditions || s.recommendations || [],
      reviewer: s.reviewer || 'AADP Architecture Review Agent'
    };
  }

  return raw;
}

async function callAgentLLM(items, modelName) {
  const itemSummary = items.map((i) => `- ${i.id}: ${i.title} (${i.type}, ${i.source})`).join('\n');

  const systemPrompt = getSystemPrompt('review') || 'You are an expert architect and code reviewer. Return valid JSON only.';
  const template = getUserPromptTemplate('review');
  const prompt = template
    ? template.replace('{{itemSummary}}', itemSummary)
    : `You are a Principal Architect and Senior Code Reviewer for a large telecom engineering org. Review these artifacts and generate a comprehensive review report:\n\n${itemSummary}\n\nReturn ONLY valid JSON with arch_review, compliance_checks[], summary.`;

  return callLLM(systemPrompt, prompt, modelName);
}

// ── Publish review to Jira — add as comment on epics ─────────────
export async function publishReviewToJira({ epicKeys, review }) {
  if (!isJiraConnected()) {
    throw new Error('Not connected to Jira. Please connect via the Product Owner agent first.');
  }

  const creds = getJiraCredentials();
  const markdown = buildReviewMarkdown(review);

  const published = [];
  const failed = [];

  for (const epicKey of epicKeys) {
    try {
      await addCommentToIssue({ ...creds, issueKey: epicKey, commentBody: markdown });
      published.push(epicKey);
    } catch (err) {
      failed.push({ epicKey, error: err.message });
    }
  }

  return { published, failed, total: epicKeys.length };
}

// ── Export as Markdown ────────────────────────────────────────────
export function buildReviewMarkdown(review) {
  if (!review) return '# Architecture Review Report\n\nNo data available.';

  const arch = review.arch_review || {};
  const checks = review.compliance_checks || [];
  const summary = review.summary || {};

  let md = `# Architecture Review Report\n\n`;
  md += `**Verdict:** ${summary.overall_verdict || arch.overall_verdict || 'N/A'}\n`;
  md += `**Score:** ${summary.arch_score || arch.score || '—'} / ${arch.max_score || 100}\n`;
  md += `**Total Violations:** ${summary.total_violations || 0} (Critical: ${summary.critical_violations || 0}, High: ${summary.high_violations || 0}, Medium: ${summary.medium_violations || 0}, Low: ${summary.low_violations || 0})\n\n`;

  if (summary.conditions?.length) {
    md += `## Conditions\n`;
    summary.conditions.forEach((c) => { md += `- ${c}\n`; });
    md += '\n';
  }

  // Categories
  if (arch.categories?.length) {
    md += `## Review Categories\n\n`;
    for (const cat of arch.categories) {
      md += `### ${cat.name} — ${cat.score}/100 (${cat.status})\n`;
      if (cat.findings?.length) {
        cat.findings.forEach((f) => { md += `- ${f}\n`; });
      }
      if (cat.violations?.length) {
        md += `\n**Violations:**\n`;
        cat.violations.forEach((v) => {
          md += `- [${v.severity}] ${v.description}`;
          if (v.recommendation) md += ` — *Recommendation:* ${v.recommendation}`;
          md += '\n';
        });
      }
      md += '\n';
    }
  }

  // Compliance checks
  if (checks.length) {
    md += `## Compliance Checks\n\n`;
    md += `| Status | Check | Value |\n|---|---|---|\n`;
    for (const c of checks) {
      md += `| ${c.status} | ${c.check} | ${c.value || ''} |\n`;
    }
    md += '\n';
  }

  md += `---\n*Reviewed by: ${summary.reviewer || 'AADP Architecture Review Agent'}*\n`;
  return md;
}
