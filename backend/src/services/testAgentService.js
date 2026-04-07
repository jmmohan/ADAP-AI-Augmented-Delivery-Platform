import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockTestPlan } from '../data/mockTestPlans.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';
import { isJiraConnected, getJiraCredentials, listEpics as poListEpics } from './poAgentService.js';
import { fetchStoriesByEpics, addCommentToIssue } from './jiraService.js';

// ── Mock data (fallback when Jira not connected) ─────────────────
const mockInputStories = [
  { id: 'US-001', title: 'Network Slice Provisioning API', story_points: 8, priority: 'High', acceptance_criteria: ['Given valid tenant When slice requested Then slice provisioned within 30s'] },
  { id: 'US-002', title: 'Tenant Isolation & Auth Gateway', story_points: 5, priority: 'High', acceptance_criteria: ['Given unauthenticated request When accessing API Then 401 returned'] },
  { id: 'US-003', title: 'SLA Monitoring Dashboard', story_points: 5, priority: 'Medium', acceptance_criteria: ['Given active slice When SLA breached Then alert triggered within 5s'] },
  { id: 'US-004', title: 'Slice Lifecycle Event Bus', story_points: 8, priority: 'High', acceptance_criteria: ['Given slice state change When event published Then all subscribers notified'] },
  { id: 'US-005', title: 'Usage Metering & Billing Integration', story_points: 5, priority: 'Medium', acceptance_criteria: ['Given metered usage When billing cycle ends Then invoice generated accurately'] },
  { id: 'US-006', title: 'Observability & Trace Correlation', story_points: 8, priority: 'Medium', acceptance_criteria: ['Given distributed request When trace queried Then full call chain visible'] }
];

// Cache stories fetched from Jira
let jiraStoriesCache = [];

// ── Epics — reuse PO agent's connection ──────────────────────────
export function listEpics() {
  return poListEpics();
}

export function getJiraConnectionStatus() {
  const connected = isJiraConnected();
  const creds = connected ? getJiraCredentials() : null;
  return { connected, project: creds?.project || null };
}

// ── Stories — fetch from Jira or return mock ─────────────────────
export async function listStoriesByEpics(epicKeys) {
  if (!isJiraConnected()) {
    return { source: 'mock', items: mockInputStories };
  }

  const creds = getJiraCredentials();
  try {
    const stories = await fetchStoriesByEpics({ ...creds, epicKeys });
    const items = stories.map((s) => ({
      id: s.key,
      title: s.summary,
      description: s.description,
      story_points: s.storyPoints || 0,
      priority: s.priority,
      status: s.status,
      parentKey: s.parentKey,
      acceptance_criteria: s.description ? [s.description.slice(0, 200)] : []
    }));
    jiraStoriesCache = items;
    return { source: 'jira', items };
  } catch (err) {
    console.error('Jira story fetch failed:', err.message);
    return { source: 'mock', items: mockInputStories, message: err.message };
  }
}

export function listInputStories() {
  if (jiraStoriesCache.length > 0) return jiraStoriesCache;
  return mockInputStories;
}

// ── Generate Test Plan ───────────────────────────────────────────
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
  const allStories = jiraStoriesCache.length > 0 ? jiraStoriesCache : mockInputStories;
  const stories = storyIds
    ? allStories.filter((s) => storyIds.includes(s.id))
    : allStories;

  if (!stories.length) throw new Error('No stories selected.');

  if (!hasGithubToken()) {
    return { source: 'mock', stories, plan: buildMockTestPlan(stories) };
  }

  try {
    const generated = await callAgentLLM(stories, model);
    return { source: 'llm', stories, plan: normalizeTestPlan(generated) };
  } catch {
    return { source: 'mock', stories, plan: buildMockTestPlan(stories) };
  }
}

// ── Normalize LLM output to match expected schema ────────────────
function normalizeTestPlan(raw) {
  if (!raw) return raw;

  // Normalize strategy.tools — LLM sometimes returns array instead of object
  if (raw.strategy) {
    if (Array.isArray(raw.strategy.tools)) {
      const toolsObj = {};
      raw.strategy.tools.forEach((t, i) => {
        if (typeof t === 'string') toolsObj[`tool_${i + 1}`] = t;
        else if (t.name && t.tool) toolsObj[t.name] = t.tool;
        else if (t.type && t.name) toolsObj[t.type] = t.name;
        else toolsObj[`tool_${i + 1}`] = String(t);
      });
      raw.strategy.tools = toolsObj;
    }
  }

  // Normalize test_suites
  if (raw.test_suites) {
    raw.test_suites = raw.test_suites.map((suite, si) => ({
      id: suite.id || suite.suite_id || `TS-${String(si + 1).padStart(3, '0')}`,
      name: suite.name || suite.suite_name || suite.title || 'Test Suite',
      type: suite.type || suite.category || suite.test_type || 'functional',
      story_ids: suite.story_ids || suite.stories || [],
      test_cases: (suite.test_cases || suite.cases || suite.tests || []).map((tc, ti) => ({
        id: tc.id || tc.test_id || tc.case_id || `TC${String(ti + 1).padStart(3, '0')}`,
        title: tc.title || tc.name || tc.description || tc.test_name || tc.test_title || 'Untitled test case',
        priority: tc.priority || tc.severity || 'P1',
        expected_result: tc.expected_result || tc.expected || tc.result || '',
        automated: tc.automated === true || tc.automated === 'true' || tc.automation === true || tc.type === 'automated' || false
      }))
    }));
  }

  // Normalize bdd_scenarios
  if (raw.bdd_scenarios) {
    raw.bdd_scenarios = raw.bdd_scenarios.map((feature) => ({
      feature: feature.feature || feature.feature_name || feature.name || feature.title || 'Feature',
      story_id: feature.story_id || feature.storyId || feature.story || '',
      scenarios: (feature.scenarios || feature.scenario_list || []).map((sc) => ({
        name: sc.name || sc.title || sc.scenario || sc.scenario_name || 'Scenario',
        given: sc.given || sc.Given || sc.precondition || '',
        when: sc.when || sc.When || sc.action || '',
        then: sc.then || sc.Then || sc.expected || sc.expected_result || '',
        tags: sc.tags || sc.labels || []
      }))
    }));
  }

  // Normalize automation_snippets
  if (raw.automation_snippets) {
    raw.automation_snippets = raw.automation_snippets.map((s) => ({
      framework: s.framework || s.tool || s.type || 'Unknown',
      filename: s.filename || s.file || s.file_name || s.path || 'test.spec.ts',
      language: s.language || s.lang || 'typescript',
      code: s.code || s.snippet || s.source || s.content || ''
    }));
  }

  // Normalize summary
  if (raw.summary) {
    raw.summary = {
      total_test_cases: raw.summary.total_test_cases || raw.summary.total || raw.summary.totalTestCases || 0,
      automated_count: raw.summary.automated_count || raw.summary.automated || raw.summary.automatedCount || 0,
      manual_count: raw.summary.manual_count || raw.summary.manual || raw.summary.manualCount || 0,
      estimated_execution_time: raw.summary.estimated_execution_time || raw.summary.execution_time || raw.summary.estimatedTime || '',
      risk_areas: raw.summary.risk_areas || raw.summary.risks || raw.summary.riskAreas || []
    };
  }

  return raw;
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

// ── Publish to Jira — add test plan as comment on epics ──────────
export async function publishTestPlanToJira({ epicKeys, plan }) {
  if (!isJiraConnected()) {
    throw new Error('Not connected to Jira. Please connect via the Product Owner agent first.');
  }

  const creds = getJiraCredentials();
  const markdown = buildTestPlanMarkdown(plan);

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
export function buildTestPlanMarkdown(plan) {
  if (!plan) return '# Test Plan\n\nNo data available.';

  const strategy = plan.strategy || {};
  const suites = plan.test_suites || [];
  const bdd = plan.bdd_scenarios || [];
  const snippets = plan.automation_snippets || [];
  const summary = plan.summary || {};

  let md = `# Test Plan\n\n`;
  md += `**Total Test Cases:** ${summary.total_test_cases || 0} | **Automated:** ${summary.automated_count || 0} | **Manual:** ${summary.manual_count || 0}\n`;
  md += `**Estimated Execution:** ${summary.execution_time || 'N/A'}\n\n`;

  // Strategy
  md += `## Test Strategy\n`;
  md += `**Approach:** ${strategy.approach || 'Risk-Based Testing'}\n`;
  md += `**Coverage Target:** ${strategy.coverage_target || 'N/A'}\n`;
  md += `**Test Levels:** ${(strategy.test_levels || []).join(', ')}\n`;
  if (strategy.tools) {
    md += `**Tools:** ${Object.entries(strategy.tools).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
  }
  md += `**Environments:** ${(strategy.environments || []).join(', ')}\n\n`;

  // Test Suites
  if (suites.length) {
    md += `## Test Suites (${suites.length})\n\n`;
    for (const suite of suites) {
      md += `### ${suite.id}: ${suite.name} (${suite.type})\n`;
      md += `Stories: ${(suite.story_ids || []).join(', ')}\n\n`;
      if (suite.test_cases?.length) {
        md += `| ID | Priority | Title | Automated |\n|---|---|---|---|\n`;
        for (const tc of suite.test_cases) {
          md += `| ${tc.id} | ${tc.priority} | ${tc.title} | ${tc.automated ? 'Yes' : 'No'} |\n`;
        }
        md += '\n';
      }
    }
  }

  // BDD Scenarios
  if (bdd.length) {
    md += `## BDD Scenarios\n\n`;
    for (const feature of bdd) {
      md += `### Feature: ${feature.feature} (${feature.story_id})\n\n`;
      for (const sc of (feature.scenarios || [])) {
        md += `**Scenario:** ${sc.name}\n`;
        md += `- **Given** ${sc.given}\n`;
        md += `- **When** ${sc.when}\n`;
        md += `- **Then** ${sc.then}\n`;
        md += `Tags: ${(sc.tags || []).join(', ')}\n\n`;
      }
    }
  }

  // Automation Snippets
  if (snippets.length) {
    md += `## Automation Snippets\n\n`;
    for (const s of snippets) {
      md += `### ${s.filename} (${s.framework} / ${s.language})\n\n`;
      md += `\`\`\`${s.language}\n${s.code}\n\`\`\`\n\n`;
    }
  }

  // Risk Areas
  if (summary.risk_areas?.length) {
    md += `## Risk Areas\n`;
    summary.risk_areas.forEach((r) => { md += `- ${r}\n`; });
    md += '\n';
  }

  md += `---\n*Generated by AADP Test Planning Agent*\n`;
  return md;
}
