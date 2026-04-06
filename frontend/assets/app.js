// ============================================================
//  AADP Platform — Main Application
// ============================================================

// -------------------- State --------------------
const state = {
  activeAgent: null,
  currentStep: 1,
  po: { jiraConfig: null, epics: [], selectedEpic: null, selectedEpics: [], reportData: null, reportSource: 'mock' },
  arch: { stories: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  review: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  codereview: { mode: null, gitConfig: null, localGit: null, clonedPath: null, fileTree: [], selectedFiles: [], reviewData: null, reviewSource: 'mock', selectedIssues: [], fixes: null, fixSource: 'mock', fixesApplied: false, appliedFiles: [], pushedBranch: null },
  test: { stories: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  code: { stories: [], selectedIds: [], reportData: null, reportSource: 'mock', gitConfig: null, clonedPath: null, pushedBranch: null },
  deploy: { artifacts: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  monitor: { services: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  security: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  doc: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  release: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  compliance: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  perf: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  incident: { items: [], selectedIds: [], reportData: null, reportSource: 'mock' },
  // DE agent state
  de: { currentAgent: null, step: 1 }
};

const THEME_STORAGE_KEY = 'aadp-theme';
const agentIds = ['po', 'arch', 'review', 'codereview', 'test', 'code', 'deploy', 'monitor', 'security', 'doc', 'release', 'compliance', 'perf', 'incident'];
const deAgentIds = ['discovery', 'modelling', 'governance', 'pipeline-design', 'etl-codegen', 'streaming', 'dq', 'query-opt', 'lineage', 'de-monitoring', 'cost'];

// -------------------- Agent Configurations --------------------
const agentConfigs = {
  po: {
    name: 'Product Owner Agent',
    steps: [
      { label: 'Connect', title: 'Configure Jira Connection' },
      { label: 'Select Epic', title: 'Browse & Select Epic' },
      { label: 'Generate', title: 'Generating Stories…' },
      { label: 'Report', title: 'Story Report' }
    ],
    genSteps: [
      { label: 'Reading epic context from Jira', sub: 'Fetching description, comments, linked issues' },
      { label: 'Analysing scope & complexity', sub: 'Identifying domains, dependencies, constraints' },
      { label: 'Decomposing into user stories', sub: 'INVEST criteria · SAFe alignment · narrative structure' },
      { label: 'Estimating story points', sub: 'Fibonacci sequence · historical velocity reference' },
      { label: 'Generating acceptance criteria', sub: 'Gherkin format · Given / When / Then' },
      { label: 'Building sprint plan & risk register', sub: 'Critical path analysis · likelihood/impact matrix' },
      { label: 'Syncing artifacts back to Jira', sub: 'Creating child issues · updating epic fields' }
    ]
  },
  arch: {
    name: 'Arch & Tech Spec Agent',
    steps: [
      { label: 'Select Stories', title: 'Select User Stories' },
      { label: 'Generate', title: 'Generating Architecture…' },
      { label: 'Report', title: 'Architecture Specification' }
    ],
    genSteps: [
      { label: 'Analysing story scope & dependencies', sub: 'Mapping domains, integrations, NFRs' },
      { label: 'Designing high-level architecture', sub: 'Component identification · technology selection' },
      { label: 'Detailing low-level module design', sub: 'Class design · endpoint mapping · data models' },
      { label: 'Drafting architecture decision records', sub: 'ADR format · trade-off analysis · rationale' },
      { label: 'Generating OpenAPI contracts', sub: 'REST endpoints · request/response schemas' },
      { label: 'Rendering architecture diagrams', sub: 'System context · sequence flows · Mermaid syntax' }
    ]
  },
  review: {
    name: 'Architecture Review Agent',
    steps: [
      { label: 'Select Artifacts', title: 'Select Architecture Artifacts to Review' },
      { label: 'Review', title: 'Reviewing Architecture…' },
      { label: 'Report', title: 'Architecture Review Report' }
    ],
    genSteps: [
      { label: 'Loading architecture specifications', sub: 'HLD · LLD · ADRs · OpenAPI contracts' },
      { label: 'Checking component boundary compliance', sub: 'Service boundaries · cross-boundary access · event patterns' },
      { label: 'Validating ADR adherence', sub: 'Event sourcing · schema isolation · Kafka backbone' },
      { label: 'Reviewing API contract conformance', sub: 'Endpoint matching · schema validation · HTTP codes' },
      { label: 'Evaluating design pattern correctness', sub: 'DI patterns · repository layer · CQRS separation' },
      { label: 'Generating architecture review scorecard', sub: 'Arch score · compliance checks · verdict' }
    ]
  },
  codereview: {
    name: 'Code Review Agent',
    steps: [
      { label: 'Git Config', title: 'Connect to GitHub Repository' },
      { label: 'Select Files', title: 'Select Files to Review' },
      { label: 'Review', title: 'Code Review Report' },
      { label: 'Fix Issues', title: 'Fix Selected Issues' },
      { label: 'Commit', title: 'Commit & Push Fixes' }
    ],
    genSteps: [
      { label: 'Reading source file contents', sub: 'Services · controllers · models · tests' },
      { label: 'Analyzing code patterns', sub: 'Complexity · duplication · naming conventions' },
      { label: 'Scanning for security vulnerabilities', sub: 'SQL injection · XSS · insecure crypto' },
      { label: 'Evaluating reliability & performance', sub: 'Error handling · memory leaks · N+1 queries' },
      { label: 'Checking coding standards', sub: 'Conventions · best practices · dead code' },
      { label: 'Generating review scorecard', sub: 'Score · issues · severity breakdown · verdict' }
    ]
  },
  test: {
    name: 'Test Planning Agent',
    steps: [
      { label: 'Select Stories', title: 'Select Stories to Test' },
      { label: 'Generate', title: 'Generating Test Plan…' },
      { label: 'Report', title: 'Test Plan Report' }
    ],
    genSteps: [
      { label: 'Analysing acceptance criteria', sub: 'Extracting testable conditions from each story' },
      { label: 'Designing test strategy', sub: 'Risk-based approach · test levels · tool selection' },
      { label: 'Generating test suites & cases', sub: 'Unit · integration · E2E · performance · security' },
      { label: 'Writing BDD scenarios', sub: 'Gherkin format · Given / When / Then' },
      { label: 'Scaffolding automation scripts', sub: 'Playwright · Pytest · Jest test code' },
      { label: 'Calculating coverage metrics', sub: 'Coverage targets · execution time estimates' }
    ]
  },
  code: {
    name: 'Code Generation Agent',
    steps: [
      { label: 'Git Config', title: 'Connect to GitHub Repository' },
      { label: 'Select Stories', title: 'Select Stories to Implement' },
      { label: 'Generate', title: 'Generating Code…' },
      { label: 'Report', title: 'Code Generation Report' }
    ],
    genSteps: [
      { label: 'Analysing story requirements', sub: 'Extracting interfaces, contracts, data models' },
      { label: 'Scaffolding project structure', sub: 'NestJS modules · Prisma schema · config files' },
      { label: 'Generating service implementations', sub: 'Business logic · error handling · validation' },
      { label: 'Writing unit test suites', sub: 'Jest specs · mocks · coverage targets' },
      { label: 'Running static analysis', sub: 'SonarQube scan · code smells · vulnerability check' },
      { label: 'Preparing pull request', sub: 'PR description · reviewers · labels · diff summary' }
    ]
  },
  deploy: {
    name: 'Deployment Agent',
    steps: [
      { label: 'Select Artifacts', title: 'Select Build Artifacts' },
      { label: 'Deploy', title: 'Deploying to QA…' },
      { label: 'Report', title: 'Deployment Report' }
    ],
    genSteps: [
      { label: 'Validating build artifacts', sub: 'Container images · Helm charts · checksums' },
      { label: 'Configuring CI/CD pipeline', sub: 'GitHub Actions · environment variables · secrets' },
      { label: 'Running build & test stages', sub: 'npm build · Jest coverage · Trivy security scan' },
      { label: 'Deploying to QA environment', sub: 'Helm upgrade · K8s rollout · health checks' },
      { label: 'Executing smoke & regression tests', sub: 'Playwright suite · API validation · 98 test cases' },
      { label: 'Generating deployment report', sub: 'Test results · performance metrics · rollback plan' }
    ]
  },
  monitor: {
    name: 'Monitoring & Triage Agent',
    steps: [
      { label: 'Select Services', title: 'Select Services to Analyse' },
      { label: 'Analyse', title: 'Analysing Anomalies…' },
      { label: 'Report', title: 'Incident Triage Report' }
    ],
    genSteps: [
      { label: 'Collecting telemetry signals', sub: 'Metrics · logs · traces from Datadog, ELK, Jaeger' },
      { label: 'Detecting anomalies', sub: 'Statistical analysis · threshold breaches · pattern matching' },
      { label: 'Correlating across sources', sub: 'Cross-referencing metrics, logs, and distributed traces' },
      { label: 'Performing root cause analysis', sub: 'Causal chain analysis · blast radius assessment' },
      { label: 'Generating fix recommendations', sub: 'Config changes · code fixes · scaling suggestions' },
      { label: 'Creating Jira defects', sub: 'Auto-filing tickets · severity assignment · triage notes' }
    ]
  },
  security: {
    name: 'Security Agent',
    steps: [
      { label: 'Select Artifacts', title: 'Select Artifacts to Scan' },
      { label: 'Scan', title: 'Running Security Assessment…' },
      { label: 'Report', title: 'Security Assessment Report' }
    ],
    genSteps: [
      { label: 'Building STRIDE threat model', sub: 'Spoofing · Tampering · Repudiation · Info Disclosure · DoS · EoP' },
      { label: 'Running SAST analysis', sub: 'Semgrep · SonarQube SAST · CWE mapping' },
      { label: 'Scanning container images', sub: 'Trivy · Docker Scout · base image CVEs' },
      { label: 'Checking OWASP Top 10 compliance', sub: 'Injection · Auth · Access Control · Crypto · SSRF' },
      { label: 'Reviewing infrastructure-as-code', sub: 'Checkov · KubeLinter · Helm chart security' },
      { label: 'Generating security scorecard', sub: 'Risk scoring · remediation plan · sign-off gate' }
    ]
  },
  doc: {
    name: 'Documentation Agent',
    steps: [
      { label: 'Select Sources', title: 'Select Documentation Sources' },
      { label: 'Generate', title: 'Generating Documentation…' },
      { label: 'Report', title: 'Documentation Report' }
    ],
    genSteps: [
      { label: 'Extracting API specifications', sub: 'OpenAPI contracts · endpoint catalog · auth details' },
      { label: 'Generating operational runbooks', sub: 'Startup procedures · troubleshooting · recovery steps' },
      { label: 'Building architecture wiki pages', sub: 'Component catalog · ADR register · deployment guide' },
      { label: 'Writing release notes', sub: 'Features · fixes · breaking changes · known issues' },
      { label: 'Creating onboarding guide', sub: 'Local setup · dev workflow · testing · PR process' },
      { label: 'Compiling decision log', sub: 'ADR timeline · status tracking · impact assessment' }
    ]
  },
  release: {
    name: 'Release Management Agent',
    steps: [
      { label: 'Select Signals', title: 'Select Release Signals' },
      { label: 'Assess', title: 'Assessing Release Readiness…' },
      { label: 'Report', title: 'Release Readiness Report' }
    ],
    genSteps: [
      { label: 'Aggregating quality gate signals', sub: 'Test results · coverage · static analysis · reviews' },
      { label: 'Evaluating security posture', sub: 'SAST findings · CVE scan · OWASP compliance' },
      { label: 'Scoring release readiness', sub: 'Weighted criteria · blocking items · conditions' },
      { label: 'Generating changelog', sub: 'Added · Changed · Fixed · Security · Breaking changes' },
      { label: 'Preparing stakeholder notifications', sub: 'Engineering · QA · Product Management drafts' },
      { label: 'Validating rollback strategy', sub: 'Blue-green config · canary setup · auto-triggers' }
    ]
  },
  compliance: {
    name: 'Compliance & Governance Agent',
    steps: [
      { label: 'Select Artifacts', title: 'Select Compliance Sources' },
      { label: 'Assess', title: 'Assessing Compliance…' },
      { label: 'Report', title: 'Compliance Report' }
    ],
    genSteps: [
      { label: 'Mapping regulatory frameworks', sub: 'SOC 2 · GDPR · FCC / 3GPP controls assessment' },
      { label: 'Generating audit trail', sub: 'Delivery lifecycle events · approvals · evidence' },
      { label: 'Enforcing organizational policies', sub: 'Data retention · PII handling · encryption · access control' },
      { label: 'Auditing open-source licenses', sub: 'License compatibility · copyleft detection · legal review' },
      { label: 'Preparing change request', sub: 'CAB-ready documentation · implementation & rollback plan' },
      { label: 'Packaging audit evidence', sub: 'PDF bundle · Jira attachments · compliance matrix' }
    ]
  },
  perf: {
    name: 'Performance Engineering Agent',
    steps: [
      { label: 'Select Sources', title: 'Select Performance Sources' },
      { label: 'Analyse', title: 'Analysing Performance…' },
      { label: 'Report', title: 'Performance Report' }
    ],
    genSteps: [
      { label: 'Defining performance budgets', sub: 'P50 · P95 · P99 latency targets per endpoint' },
      { label: 'Generating load test scripts', sub: 'k6 scenarios · ramp-up · steady state · thresholds' },
      { label: 'Modelling capacity requirements', sub: 'Pods · CPU · memory · DB connections · Kafka partitions' },
      { label: 'Detecting code-level bottlenecks', sub: 'N+1 queries · missing indexes · unbounded results' },
      { label: 'Analysing cost optimization', sub: 'Right-sizing · connection pooling · compression' },
      { label: 'Validating SLA compliance', sub: 'NFR targets vs actual measurements · headroom analysis' }
    ]
  },
  incident: {
    name: 'Incident Management Agent',
    steps: [
      { label: 'Select Incidents', title: 'Select Incidents to Analyse' },
      { label: 'Analyse', title: 'Analysing Incidents…' },
      { label: 'Report', title: 'Incident Report' }
    ],
    genSteps: [
      { label: 'Reconstructing incident timeline', sub: 'Deployment · alert · escalation · mitigation events' },
      { label: 'Generating blameless postmortem', sub: 'Root cause · contributing factors · impact assessment' },
      { label: 'Extracting action items', sub: 'P0/P1/P2 priorities · owners · due dates · Jira tickets' },
      { label: 'Analysing incident patterns', sub: 'Recurring themes · trend detection · root cause clustering' },
      { label: 'Calculating response metrics', sub: 'MTTD · MTTR · MTTA · severity distribution · trends' },
      { label: 'Suggesting runbook updates', sub: 'New failure modes · remediation steps · escalation paths' }
    ]
  }
};

// -------------------- API Helpers --------------------
async function parseResponse(response) {
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Request failed.');
  return json;
}

async function apiGet(path) {
  const response = await fetch(path);
  return parseResponse(response);
}

async function apiPost(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -------------------- Theme --------------------
function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.textContent = isLight ? '🌙 Dark' : '☀ Light';
}

function initializeTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(stored === 'light' ? 'light' : 'dark');
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

// -------------------- Panel Management --------------------
function selectAgent(domainOrIndex, index) {
  // Support legacy calls (single number) for backwards compat
  let domain, idx;
  if (typeof domainOrIndex === 'number') {
    domain = 'se';
    idx = domainOrIndex;
  } else {
    domain = domainOrIndex;
    idx = index;
  }

  if (domain === 'de') {
    // Switch to DE tab first
    switchDomain('de');
    // Highlight the correct nav link
    const deLinks = document.querySelectorAll('.de-link');
    deLinks.forEach((link, i) => link.classList.toggle('active', i === idx));
    // Clear SE active
    document.querySelectorAll('#content-se .nav-link').forEach(l => l.classList.remove('active'));
    openDePanel(deAgentIds[idx]);
  } else {
    // Switch to SE tab first
    switchDomain('se');
    const navLinks = document.querySelectorAll('#content-se .nav-link');
    navLinks.forEach((link, i) => link.classList.toggle('active', i === idx));
    // Clear DE active
    document.querySelectorAll('.de-link').forEach(l => l.classList.remove('active'));
    openPanel(agentIds[idx]);
  }
}

function switchDomain(domain) {
  const sePanel = document.getElementById('panel-se');
  const dePanel = document.getElementById('panel-de');
  const seTab = document.getElementById('tab-se');
  const deTab = document.getElementById('tab-de');
  if (domain === 'de') {
    sePanel.style.display = 'none';
    dePanel.style.display = '';
    seTab.classList.remove('active');
    deTab.classList.add('active');
  } else {
    sePanel.style.display = '';
    dePanel.style.display = 'none';
    seTab.classList.add('active');
    deTab.classList.remove('active');
  }
}

function toggleFolder(id) {
  const content = document.getElementById(`content-${id}`);
  const arrow = document.getElementById(`arrow-${id}`);
  if (!content) return;
  content.classList.toggle('collapsed');
  if (arrow) arrow.classList.toggle('collapsed');
}

function openPanel(agentId) {
  state.activeAgent = agentId;
  const agent = agentConfigs[agentId];

  document.getElementById('panel-eyebrow').textContent = agent.name;

  const stepBar = document.getElementById('step-bar');
  stepBar.innerHTML = agent.steps
    .map(
      (step, i) =>
        `<div class="stp ${i === 0 ? 'active' : 'pending'}" id="stp${i + 1}"><div class="stp-dot">${i + 1}</div><span class="stp-label">${step.label}</span></div>${i < agent.steps.length - 1 ? '<div class="stp-line"></div>' : ''}`
    )
    .join('');

  document.getElementById('overlay').classList.add('open');
  setTimeout(() => goToStep(1), 50);
}

function closePanel() {
  document.getElementById('overlay').classList.remove('open');
  setTimeout(() => {
    state.currentStep = 1;
    if (state.activeAgent && state[state.activeAgent]) {
      const s = state[state.activeAgent];
      s.reportData = null;
      if (s.selectedIds) s.selectedIds = [];
      if (s.selectedEpic !== undefined) s.selectedEpic = null;
      if (s.selectedEpics) s.selectedEpics = [];
      if ('gitConfig' in s) s.gitConfig = null;
      if ('clonedPath' in s) s.clonedPath = null;
      if ('pushedBranch' in s) s.pushedBranch = null;
      if ('localGit' in s) s.localGit = null;
      if ('mode' in s) s.mode = null;
      if ('fixesApplied' in s) s.fixesApplied = false;
      if ('appliedFiles' in s) s.appliedFiles = [];
    }
  }, 350);
}

function setStepState(id, stepState) {
  const el = document.getElementById(`stp${id}`);
  if (!el) return;
  el.className = `stp ${stepState}`;
  el.querySelector('.stp-dot').textContent = stepState === 'done' ? '✓' : String(id);
}

function goToStep(nextStep) {
  const agent = agentConfigs[state.activeAgent];
  state.currentStep = nextStep;
  for (let i = 1; i <= agent.steps.length; i++) {
    if (i < nextStep) setStepState(i, 'done');
    else if (i === nextStep) setStepState(i, 'active');
    else setStepState(i, 'pending');
  }
  document.getElementById('panel-title').textContent = agent.steps[nextStep - 1].title;

  const renderers = {
    po: [renderPoStep1, renderPoStep2, renderPoStep3, renderPoStep4],
    arch: [renderArchStep1, renderArchStep2, renderArchStep3],
    review: [renderReviewStep1, renderReviewStep2, renderReviewStep3],
    codereview: [renderCodeReviewStep1, renderCodeReviewStep2, renderCodeReviewStep3, renderCodeReviewStep4, renderCodeReviewStep5],
    test: [renderTestStep1, renderTestStep2, renderTestStep3],
    code: [renderCodeStep1, renderCodeStep2, renderCodeStep3, renderCodeStep4],
    deploy: [renderDeployStep1, renderDeployStep2, renderDeployStep3],
    monitor: [renderMonitorStep1, renderMonitorStep2, renderMonitorStep3],
    security: [renderSecurityStep1, renderSecurityStep2, renderSecurityStep3],
    doc: [renderDocStep1, renderDocStep2, renderDocStep3],
    release: [renderReleaseStep1, renderReleaseStep2, renderReleaseStep3],
    compliance: [renderComplianceStep1, renderComplianceStep2, renderComplianceStep3],
    perf: [renderPerfStep1, renderPerfStep2, renderPerfStep3],
    incident: [renderIncidentStep1, renderIncidentStep2, renderIncidentStep3]
  };
  renderers[state.activeAgent][nextStep - 1]();
}

// -------------------- Shared Generation --------------------
function renderProgressList(agentId, headerHtml) {
  const genSteps = agentConfigs[agentId].genSteps;
  const html = genSteps
    .map(
      (step, i) =>
        `<div class="prog-item ${i === 0 ? 'running' : 'pending'}" id="pg${i}"><div class="prog-dot">${i === 0 ? '' : i + 1}</div><div><div class="prog-label">${step.label}</div><div class="prog-sublabel">${step.sub}</div></div></div>`
    )
    .join('');

  document.getElementById('panel-body').innerHTML = `<div class="fadein">${headerHtml}<div class="prog-list">${html}</div><div id="gen-error"></div></div>`;
  document.getElementById('panel-ftr').innerHTML =
    '<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">AI generation in progress…</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">Please wait</span>';
}

async function runGenAnimation(agentId, apiCall, onSuccess) {
  const genSteps = agentConfigs[agentId].genSteps;
  const delays = genSteps.map(() => 600 + Math.random() * 500);

  const setProgress = (i, s) => {
    const row = document.getElementById(`pg${i}`);
    if (!row) return;
    row.className = `prog-item ${s}`;
    row.querySelector('.prog-dot').textContent = s === 'done' ? '✓' : s === 'running' ? '' : String(i + 1);
  };

  const animate = async () => {
    for (let i = 0; i < genSteps.length; i++) {
      setProgress(i, 'running');
      if (i > 0) setProgress(i - 1, 'done');
      await sleep(delays[i]);
    }
  };

  try {
    const [_, result] = await Promise.all([animate(), apiCall()]);
    for (let i = 0; i < genSteps.length; i++) setProgress(i, 'done');
    onSuccess(result);
    await sleep(300);
    goToStep(agentConfigs[agentId].steps.length);
  } catch (error) {
    document.getElementById('gen-error').innerHTML = `<div class="error-box">⚠ ${error.message}</div>`;
    document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(1)">← Back</button><button class="btn btn-primary" onclick="goToStep(${state.currentStep})">Retry →</button>`;
  }
}

// -------------------- Shared Selection Helpers --------------------
function toggleItemSelection(agentId, id) {
  const s = state[agentId];
  const idx = s.selectedIds.indexOf(id);
  if (idx >= 0) s.selectedIds.splice(idx, 1);
  else s.selectedIds.push(id);
  updateSelectionUI(agentId, id);
}

function updateSelectionUI(agentId, id) {
  const s = state[agentId];
  const el = document.getElementById(`${agentId}-${id}`);
  const chk = document.getElementById(`${agentId}-chk-${id}`);
  if (!el) return;
  const selected = s.selectedIds.includes(id);
  el.classList.toggle('sel', selected);
  if (chk) {
    chk.innerHTML = selected
      ? '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#090B0F" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '';
  }
  const btn = document.getElementById('gen-btn');
  if (btn) btn.disabled = s.selectedIds.length === 0;
}

function selectAllItems(agentId) {
  const s = state[agentId];
  const items = s.stories || s.artifacts || s.services || s.items || [];
  const allIds = items.map((item) => item.id);
  const allSelected = allIds.every((id) => s.selectedIds.includes(id));
  s.selectedIds = allSelected ? [] : [...allIds];
  allIds.forEach((id) => updateSelectionUI(agentId, id));
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================
//  PROMPT EDITOR
// ============================================================
let promptEditorAgentId = null;

async function openPromptEditor(agentId) {
  promptEditorAgentId = agentId;
  const overlay = document.getElementById('prompt-overlay');
  overlay.classList.add('open');
  const agentName = agentConfigs[agentId]?.name || agentId;
  document.getElementById('prompt-editor-eyebrow').textContent = agentName;
  document.getElementById('prompt-editor-title').textContent = 'Edit Agent Prompt';
  document.getElementById('prompt-editor-body').innerHTML = '<div class="info-box">Loading prompt…</div>';
  document.getElementById('prompt-editor-ftr').innerHTML = '';

  try {
    const data = await apiGet(`/api/prompts/${agentId}`);
    renderPromptForm(data);
  } catch (err) {
    document.getElementById('prompt-editor-body').innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
  }
}

function renderPromptForm(data) {
  const modified = data.lastModified ? new Date(data.lastModified).toLocaleString() : '—';
  document.getElementById('prompt-editor-body').innerHTML = `
    <div class="fadein">
      <div class="prompt-meta">Last saved: <strong>${modified}</strong></div>
      <div class="fgrp">
        <label class="flabel">Role &amp; Persona</label>
        <div class="flabel-hint">Describe the AI's role in plain English — e.g. "You are a senior architect who specialises in telecom systems."</div>
        <textarea class="finput prompt-textarea" id="pe-system" rows="4" placeholder="e.g. You are an expert SAFe Product Owner. Always return valid JSON.">${escapeHtml(data.systemPrompt || '')}</textarea>
      </div>
      <div class="fgrp">
        <label class="flabel">Instructions</label>
        <div class="flabel-hint">Write the detailed instructions this agent should follow. Use <code>{{variableName}}</code> where dynamic data will be inserted at runtime.</div>
        <textarea class="finput prompt-textarea" id="pe-user" rows="16" placeholder="Write your instructions here in plain English…">${escapeHtml(data.userPromptTemplate || '')}</textarea>
      </div>
      <div id="pe-status"></div>
    </div>`;
  document.getElementById('prompt-editor-ftr').innerHTML = `
    <button class="btn btn-ghost" onclick="resetAgentPrompt()">↺ Reset to Default</button>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost" onclick="closePromptEditor()">Cancel</button>
      <button class="btn btn-primary" onclick="saveAgentPrompt()">Save Changes</button>
    </div>`;
}

async function saveAgentPrompt() {
  const systemPrompt = document.getElementById('pe-system').value;
  const userPromptTemplate = document.getElementById('pe-user').value;
  const statusEl = document.getElementById('pe-status');
  statusEl.innerHTML = '<div class="info-box">Saving…</div>';

  try {
    const updated = await apiPut(`/api/prompts/${promptEditorAgentId}`, { systemPrompt, userPromptTemplate });
    statusEl.innerHTML = '<div class="success-box">✓ Prompt saved successfully. Changes will apply to the next generation.</div>';
    setTimeout(() => { statusEl.innerHTML = ''; }, 3000);
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
  }
}

async function resetAgentPrompt() {
  const statusEl = document.getElementById('pe-status');
  if (!confirm('Reset this agent\'s prompt to its original default?')) return;
  statusEl.innerHTML = '<div class="info-box">Resetting…</div>';

  try {
    const data = await apiPost(`/api/prompts/${promptEditorAgentId}/reset`, {});
    renderPromptForm(data);
    const newStatusEl = document.getElementById('pe-status');
    newStatusEl.innerHTML = '<div class="success-box">✓ Prompt reset to default.</div>';
    setTimeout(() => { newStatusEl.innerHTML = ''; }, 3000);
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
  }
}

function closePromptEditor() {
  document.getElementById('prompt-overlay').classList.remove('open');
  promptEditorAgentId = null;
}

async function apiPut(path, body) {
  const response = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

// ============================================================
//  PO AGENT
// ============================================================
function renderPoStep1() {
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box"><strong>Platform Mode:</strong> Connects to your Jira instance to fetch real epics. AI generation powered by GitHub Models (GPT-4o) when server key is configured. Falls back to mock data if Jira is unreachable.</div>
      <div class="frow">
        <div class="fgrp"><label class="flabel">Jira Instance URL</label><input class="finput" id="jira-url" placeholder="https://yourorg.atlassian.net" value="https://telecom-eng.atlassian.net"></div>
        <div class="fgrp"><label class="flabel">Project Key</label><input class="finput" id="jira-project" placeholder="PLAT" value="PLAT"></div>
      </div>
      <div class="fgrp"><label class="flabel">Email</label><input class="finput" id="jira-email" placeholder="you@company.com" value="murali.josyula@intl.att.com"></div>
      <div class="fgrp"><label class="flabel">API Token</label><input class="finput" id="jira-token" type="password" placeholder="••••••••••••••••" value="ATATT3xFfGF0mock_token_poc"></div>
      <div class="fgrp"><label class="flabel">AI Model</label>
        <select class="finput" id="ai-model">
          <option value="gpt-4o">GPT-4o (Recommended)</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
        </select>
      </div>
      <div id="connect-status"></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `
    <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">Node.js API · Service Layer · Adapter Ready</span>
    <button class="btn btn-primary" onclick="handleConnect()">Connect to Jira →</button>`;
}

async function handleConnect() {
  const payload = {
    url: document.getElementById('jira-url').value.trim(),
    project: document.getElementById('jira-project').value.trim(),
    email: document.getElementById('jira-email').value.trim(),
    token: document.getElementById('jira-token').value.trim(),
    model: document.getElementById('ai-model').value
  };
  if (!payload.url || !payload.project || !payload.email || !payload.token) {
    document.getElementById('connect-status').innerHTML = '<div class="error-box">⚠ Please fill in all fields.</div>';
    return;
  }
  state.po.jiraConfig = payload;
  document.getElementById('connect-status').innerHTML = '<div class="info-box">🔄 Connecting to Jira and loading epics…</div>';
  const btn = document.querySelector('#panel-ftr .btn-primary');
  btn.disabled = true;
  try {
    const conn = await apiPost('/api/po-agent/connect', payload);
    const epics = await apiGet('/api/po-agent/epics');
    state.po.epics = epics.items || [];
    const sourceLabel = conn.source === 'jira'
      ? `✓ Connected to Jira as <strong>${conn.user || payload.email}</strong> — found <strong>${conn.epicsCount}</strong> epics in project ${payload.project}`
      : `✓ Connected (mock mode) — ${conn.message || 'using mock data'} — showing <strong>${conn.epicsCount}</strong> sample epics`;
    const boxClass = conn.source === 'jira' ? 'success-box' : 'info-box';
    document.getElementById('connect-status').innerHTML = `<div class="${boxClass}">${sourceLabel}</div>`;
    btn.disabled = false;
    btn.textContent = 'Browse Epics →';
    btn.onclick = () => goToStep(2);
  } catch (error) {
    btn.disabled = false;
    document.getElementById('connect-status').innerHTML = `<div class="error-box">⚠ ${error.message}</div>`;
  }
}

function renderPoStep2() {
  const priorityClass = { Critical: 'p-critical', High: 'p-high', Medium: 'p-medium', Low: 'p-low' };
  state.po.selectedEpics = [];
  const epicHtml = state.po.epics
    .map(
      (epic) => `
      <div class="epic-item" id="epic-${epic.key}" onclick="selectEpic('${epic.key}')">
        <div class="epic-chk" id="chk-${epic.key}"></div>
        <div style="flex:1">
          <div class="epic-key">${epic.key}</div>
          <div class="epic-summary">${epic.summary}</div>
          <div class="epic-desc">${epic.description}</div>
          <div class="epic-meta"><span class="epill ${priorityClass[epic.priority] || 'p-medium'}">${epic.priority}</span><span class="status-pill">${epic.status}</span></div>
        </div>
      </div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="success-box">✓ Connected to ${state.po.jiraConfig.url} · Project: ${state.po.jiraConfig.project}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.po.epics.length} EPICS FOUND</span>
        <button class="btn-exp" onclick="selectAllEpics()" style="padding:4px 10px;font-size:10px;">Select All</button>
      </div>
      ${epicHtml}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(1)">← Back</button><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(3)">Generate Stories →</button>`;
}

function selectEpic(key) {
  const idx = state.po.selectedEpics.findIndex((e) => e.key === key);
  const el = document.getElementById(`epic-${key}`);
  const chk = document.getElementById(`chk-${key}`);
  if (idx >= 0) {
    state.po.selectedEpics.splice(idx, 1);
    el?.classList.remove('sel');
    if (chk) chk.innerHTML = '';
  } else {
    const epic = state.po.epics.find((e) => e.key === key);
    if (epic) state.po.selectedEpics.push(epic);
    el?.classList.add('sel');
    if (chk) chk.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#090B0F" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  state.po.selectedEpic = state.po.selectedEpics[0] || null;
  const btn = document.getElementById('gen-btn');
  if (btn) btn.disabled = state.po.selectedEpics.length === 0;
}

function selectAllEpics() {
  const allSelected = state.po.selectedEpics.length === state.po.epics.length;
  state.po.selectedEpics = allSelected ? [] : [...state.po.epics];
  state.po.selectedEpic = state.po.selectedEpics[0] || null;
  state.po.epics.forEach((epic) => {
    const el = document.getElementById(`epic-${epic.key}`);
    const chk = document.getElementById(`chk-${epic.key}`);
    const selected = !allSelected;
    el?.classList.toggle('sel', selected);
    if (chk) chk.innerHTML = selected ? '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#090B0F" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
  });
  const btn = document.getElementById('gen-btn');
  if (btn) btn.disabled = state.po.selectedEpics.length === 0;
}

function renderPoStep3() {
  const epics = state.po.selectedEpics.length > 0 ? state.po.selectedEpics : (state.po.selectedEpic ? [state.po.selectedEpic] : []);
  const headerHtml = `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${epics.map((e) => e.key).join(' · ')}</div><div class="epic-summary">${epics.length === 1 ? epics[0].summary : epics.length + ' epics selected'}</div></div>`;
  renderProgressList('po', headerHtml);
  runGenAnimation(
    'po',
    () => apiPost('/api/po-agent/generate', { epicKey: epics[0].key, model: state.po.jiraConfig?.model }),
    (result) => {
      state.po.reportData = result.report;
      state.po.reportSource = result.source;
    }
  );
}

function renderPoStep4() {
  const report = state.po.reportData;
  const estimates = report.estimates || {};
  const stories = report.user_stories || [];
  const sprints = report.project_plan?.sprints || [];
  const risks = report.risks || [];

  const storiesHtml = stories
    .map((story) => {
      const acHtml = (story.acceptance_criteria || [])
        .map((c) => {
          const h = c
            .replace(/^Given /i, '<span class="kw">Given</span> ')
            .replace(/ When /gi, ' <span class="kw">When</span> ')
            .replace(/ Then /gi, ' <span class="kw">Then</span> ');
          return `<div class="ac-item">${h}</div>`;
        })
        .join('');
      return `<div class="story-card"><div class="story-top"><div><div class="story-id">${story.id}</div><div class="story-title">${story.title}</div></div><div style="display:flex;gap:5px;flex-shrink:0;"><span class="sp-badge">${story.story_points} pts</span></div></div><div class="story-narrative">As a <strong>${story.as_a}</strong>, I want ${story.i_want}, so that ${story.so_that}.</div><div class="story-toggle" onclick="toggleAC(this)">▼ Acceptance Criteria (${(story.acceptance_criteria || []).length})</div><div class="ac-list">${acHtml}</div></div>`;
    })
    .join('');

  const sprintsHtml = sprints
    .map(
      (s) =>
        `<div class="sprint-row"><span class="sprint-num">Sprint ${s.number}</span><div><div class="sprint-goal">${s.goal}</div><div class="sprint-stories">${(s.story_ids || []).join(' · ')}</div></div></div>`
    )
    .join('');

  const risksHtml = risks
    .map(
      (r) =>
        `<div class="risk-row"><div class="risk-bar ${r.likelihood}"></div><div><div class="risk-pills"><span class="risk-pill">Likelihood: ${r.likelihood}</span><span class="risk-pill">Impact: ${r.impact}</span></div><div class="risk-title">${r.title}</div><div class="risk-mit">↳ ${r.mitigation}</div></div></div>`
    )
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Generation complete (${state.po.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${stories.length} child issues prepared under ${state.po.selectedEpic.key}</div>
      <div class="report-sec"><div class="report-sec-hdr">Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${estimates.total_story_points || '—'}</div><div class="stat-lbl">Story Points</div></div>
          <div class="stat-card"><div class="stat-val">${estimates.sprints || '—'}</div><div class="stat-lbl">Sprints</div></div>
          <div class="stat-card"><div class="stat-val">${estimates.duration_weeks || '—'}w</div><div class="stat-lbl">Duration</div></div>
          <div class="stat-card"><div class="stat-val">${stories.length}</div><div class="stat-lbl">Stories</div></div>
        </div>
      </div>
      <div class="report-sec"><div class="report-sec-hdr">User Stories (${stories.length})</div>${storiesHtml}</div>
      <div class="report-sec"><div class="report-sec-hdr">Sprint Plan</div><div class="sprint-rows">${sprintsHtml || '<div style="padding:14px;color:var(--text3);font-size:12px;">No sprint data.</div>'}</div></div>
      <div class="report-sec"><div class="report-sec-hdr">Risk Register (${risks.length})</div>${risksHtml || '<div style="color:var(--text3);font-size:12px;">No risks identified.</div>'}</div>
      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div>
        <div class="report-actions">
          <button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF Report</button>
          <button class="btn-exp" onclick="copyPoMarkdown()">📋 Copy as Markdown</button>
          <button class="btn-exp" onclick="publishStoriesToJira()" id="btn-publish-jira">🔗 Publish to Jira</button>
          <button class="btn-exp" onclick="alert('Email sent to stakeholders (simulated in PoC)')">✉ Email to Stakeholders</button>
        </div>
      </div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(2)">← Select another epic</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

function toggleAC(button) {
  const list = button.nextElementSibling;
  const visible = list.style.display !== 'none';
  list.style.display = visible ? 'none' : 'flex';
  button.textContent = `${visible ? '▶' : '▼'}${button.textContent.slice(1)}`;
}

async function publishStoriesToJira() {
  const btn = document.getElementById('btn-publish-jira');
  const stories = state.po.reportData?.user_stories;
  const epicKey = state.po.selectedEpic?.key;
  if (!epicKey || !stories?.length) {
    alert('No stories to publish.');
    return;
  }
  btn.disabled = true;
  btn.textContent = '🔄 Publishing…';
  try {
    const result = await apiPost('/api/po-agent/publish', { epicKey, stories });
    const msg = `Published ${result.created.length} of ${result.total} stories to Jira.` +
      (result.failed.length ? `\n${result.failed.length} failed.` : '') +
      `\n\nCreated: ${result.created.map(s => s.jiraKey).join(', ')}`;
    btn.textContent = `✓ Published ${result.created.length} stories`;
    btn.style.background = 'var(--green)';
    btn.style.color = '#fff';
    alert(msg);
  } catch (error) {
    btn.textContent = '🔗 Publish to Jira';
    btn.disabled = false;
    alert(`Failed to publish: ${error.message}`);
  }
}

function exportPDF() {
  window.print();
}

async function copyPoMarkdown() {
  try {
    const result = await apiPost('/api/po-agent/export/markdown', { epic: state.po.selectedEpic, report: state.po.reportData });
    await navigator.clipboard.writeText(result.markdown);
    alert('Markdown copied to clipboard.');
  } catch (error) {
    alert(`Copy failed: ${error.message}`);
  }
}

// ============================================================
//  ARCH & TECH SPEC AGENT
// ============================================================
async function renderArchStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading user stories…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/arch-agent/stories');
    state.arch.stories = result.items || [];
  } catch {
    state.arch.stories = [];
  }
  state.arch.selectedIds = [];
  const html = state.arch.stories
    .map(
      (s) =>
        `<div class="epic-item" id="arch-${s.id}" onclick="toggleItemSelection('arch','${s.id}')"><div class="epic-chk" id="arch-chk-${s.id}"></div><div style="flex:1"><div class="epic-key">${s.id}</div><div class="epic-summary">${s.title}</div><div class="epic-meta"><span class="sp-badge">${s.story_points} pts</span><span class="epill ${s.priority === 'High' ? 'p-high' : 'p-medium'}">${s.priority}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select user stories from PO Agent output to generate architecture specs — HLD, LLD, ADRs, OpenAPI contracts, and Mermaid diagrams.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.arch.stories.length} STORIES</span><button class="btn-exp" onclick="selectAllItems('arch')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">HLD · LLD · ADR · OpenAPI · Mermaid</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Generate Architecture →</button>`;
}

function renderArchStep2() {
  const ids = state.arch.selectedIds;
  renderProgressList('arch', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} stories selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'arch',
    () => apiPost('/api/arch-agent/generate', { storyIds: ids }),
    (result) => {
      state.arch.reportData = result.spec;
      state.arch.reportSource = result.source;
    }
  );
}

function renderArchStep3() {
  const data = state.arch.reportData;
  if (!data) return;
  const hld = data.hld || {};
  const lld = data.lld || {};
  const adrs = data.adrs || [];
  const diagrams = data.diagrams || {};

  const componentsHtml = (hld.components || [])
    .map(
      (c) =>
        `<div class="story-card"><div class="story-top"><div><div class="story-id">${(c.type || 'component').toUpperCase()}</div><div class="story-title">${c.name || ''}</div></div></div><div class="story-narrative">${c.responsibility || ''}</div><div class="epic-meta">${(c.tech_stack || []).map((t) => `<span class="card-tag">${t}</span>`).join('')}</div></div>`
    )
    .join('');

  const nfrsHtml = (hld.nfrs || [])
    .map(
      (n) =>
        `<div class="sprint-row"><span class="sprint-num" style="min-width:90px;">${n.category || ''}</span><div><div class="sprint-goal">${n.requirement || ''}</div><div class="sprint-stories">Target: ${n.target || ''}</div></div></div>`
    )
    .join('');

  const modulesHtml = (lld.modules || [])
    .map((m) => {
      const endpoints = (m.endpoints || []).map((e) => `<div class="ac-item"><span class="kw">${e.method || ''}</span> ${e.path || ''} — ${e.description || ''}</div>`).join('');
      return `<div class="story-card"><div class="story-top"><div><div class="story-id">${m.component || ''}</div><div class="story-title">${m.name || ''}</div></div></div><div class="epic-meta" style="margin-bottom:6px">${(m.classes || []).map((c) => `<span class="card-tag">${c}</span>`).join('')}</div><div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:4px">ENDPOINTS</div><div class="ac-list" style="display:flex">${endpoints}</div><div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:8px">DB ENTITIES: ${(m.database_entities || []).join(', ')}</div></div>`;
    })
    .join('');

  const adrsHtml = adrs
    .map(
      (a) =>
        `<div class="story-card"><div class="story-top"><div><div class="story-id">${a.id || ''}</div><div class="story-title">${a.title || ''}</div></div><span class="sp-badge">${a.status || ''}</span></div><div class="story-narrative"><strong>Context:</strong> ${a.context || ''}</div><div class="story-narrative"><strong>Decision:</strong> ${a.decision || ''}</div><div class="story-narrative"><strong>Consequences:</strong> ${a.consequences || ''}</div></div>`
    )
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Architecture generated (${state.arch.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${(hld.components || []).length} components, ${(lld.modules || []).length} modules, ${adrs.length} ADRs</div>

      <div class="report-sec"><div class="report-sec-hdr">High-Level Design</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${(hld.components || []).length}</div><div class="stat-lbl">Components</div></div>
          <div class="stat-card"><div class="stat-val">${(lld.modules || []).length}</div><div class="stat-lbl">Modules</div></div>
          <div class="stat-card"><div class="stat-val">${adrs.length}</div><div class="stat-lbl">ADRs</div></div>
          <div class="stat-card"><div class="stat-val">${(hld.nfrs || []).length}</div><div class="stat-lbl">NFRs</div></div>
        </div>
        <div class="story-card"><div class="story-title">${hld.title || 'Architecture Overview'}</div><div class="story-narrative">${hld.overview || ''}</div><div class="epic-meta"><span class="card-tag">${hld.architecture_style || ''}</span>${(hld.integration_patterns || []).map((p) => `<span class="card-tag">${p}</span>`).join('')}</div></div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Components (${(hld.components || []).length})</div>${componentsHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Non-Functional Requirements</div><div class="sprint-rows">${nfrsHtml}</div></div>

      <div class="report-sec"><div class="report-sec-hdr">Low-Level Design — Modules</div>${modulesHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Architecture Decision Records (${adrs.length})</div>${adrsHtml}</div>

      ${data.openapi_snippet ? `<div class="report-sec"><div class="report-sec-hdr">OpenAPI Contract (Snippet)</div><div class="code-block-hdr"><span>openapi.yaml</span></div><pre class="code-block">${escapeHtml(data.openapi_snippet)}</pre></div>` : ''}

      ${diagrams.system_context ? `<div class="report-sec"><div class="report-sec-hdr">System Context Diagram (Mermaid)</div><div class="code-block-hdr"><span>System Context</span></div><pre class="code-block">${escapeHtml(diagrams.system_context)}</pre></div>` : ''}

      ${diagrams.sequence ? `<div class="report-sec"><div class="report-sec-hdr">Sequence Diagram (Mermaid)</div><div class="code-block-hdr"><span>Sequence Flow</span></div><pre class="code-block">${escapeHtml(diagrams.sequence)}</pre></div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Published to Confluence (simulated)')">📄 Publish to Confluence</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to Stakeholders</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Select different stories</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  TEST PLANNING AGENT
// ============================================================
async function renderTestStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading stories with acceptance criteria…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/test-agent/stories');
    state.test.stories = result.items || [];
  } catch {
    state.test.stories = [];
  }
  state.test.selectedIds = [];
  const html = state.test.stories
    .map(
      (s) =>
        `<div class="epic-item" id="test-${s.id}" onclick="toggleItemSelection('test','${s.id}')"><div class="epic-chk" id="test-chk-${s.id}"></div><div style="flex:1"><div class="epic-key">${s.id}</div><div class="epic-summary">${s.title}</div>${s.acceptance_criteria ? `<div class="epic-desc">${(s.acceptance_criteria || []).slice(0, 1).join('')}</div>` : ''}<div class="epic-meta"><span class="sp-badge">${s.story_points} pts</span><span class="epill ${s.priority === 'High' ? 'p-high' : 'p-medium'}">${s.priority}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select stories with acceptance criteria to generate a comprehensive test plan — strategy, BDD scenarios, and automation scripts.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.test.stories.length} STORIES</span><button class="btn-exp" onclick="selectAllItems('test')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">BDD · Playwright · Pytest · Jest</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Generate Test Plan →</button>`;
}

function renderTestStep2() {
  const ids = state.test.selectedIds;
  renderProgressList('test', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} stories selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'test',
    () => apiPost('/api/test-agent/generate', { storyIds: ids }),
    (result) => {
      state.test.reportData = result.plan;
      state.test.reportSource = result.source;
    }
  );
}

function renderTestStep3() {
  const data = state.test.reportData;
  if (!data) return;
  const strategy = data.strategy || {};
  const suites = data.test_suites || [];
  const bdd = data.bdd_scenarios || [];
  const snippets = data.automation_snippets || [];
  const summary = data.summary || {};

  const suitesHtml = suites
    .map((suite) => {
      const casesHtml = (suite.test_cases || [])
        .map(
          (tc) =>
            `<div class="ac-item"><span class="kw">${tc.id}</span> [${tc.priority}] ${tc.title} ${tc.automated ? '<span style="color:var(--accent)">● Auto</span>' : '<span style="color:var(--amber)">● Manual</span>'}</div>`
        )
        .join('');
      return `<div class="story-card"><div class="story-top"><div><div class="story-id">${suite.id}</div><div class="story-title">${suite.name}</div></div><span class="sp-badge">${suite.type}</span></div><div class="epic-meta" style="margin-bottom:6px"><span class="card-tag">Stories: ${(suite.story_ids || []).join(', ')}</span></div><div class="ac-list" style="display:flex">${casesHtml}</div></div>`;
    })
    .join('');

  const bddHtml = bdd
    .map((feature) => {
      const scenariosHtml = (feature.scenarios || [])
        .map(
          (sc) =>
            `<div class="ac-item" style="display:block"><div style="font-weight:500;margin-bottom:4px">${sc.name}</div><div><span class="kw">Given</span> ${sc.given}</div><div><span class="kw">When</span> ${sc.when}</div><div><span class="kw">Then</span> ${sc.then}</div><div style="margin-top:4px">${(sc.tags || []).map((t) => `<span class="card-tag">${t}</span>`).join(' ')}</div></div>`
        )
        .join('');
      return `<div class="story-card"><div class="story-top"><div><div class="story-id">${feature.story_id}</div><div class="story-title">${feature.feature}</div></div></div>${scenariosHtml}</div>`;
    })
    .join('');

  const snippetsHtml = snippets
    .map((s) => `<div class="report-sec"><div class="code-block-hdr"><span>${s.filename}</span><span>${s.framework} · ${s.language}</span></div><pre class="code-block">${escapeHtml(s.code)}</pre></div>`)
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Test plan generated (${state.test.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${summary.total_test_cases || 0} test cases, ${summary.automated_count || 0} automated</div>

      <div class="report-sec"><div class="report-sec-hdr">Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${summary.total_test_cases || 0}</div><div class="stat-lbl">Test Cases</div></div>
          <div class="stat-card"><div class="stat-val">${summary.automated_count || 0}</div><div class="stat-lbl">Automated</div></div>
          <div class="stat-card"><div class="stat-val">${summary.manual_count || 0}</div><div class="stat-lbl">Manual</div></div>
          <div class="stat-card"><div class="stat-val">${strategy.coverage_target || '—'}</div><div class="stat-lbl">Coverage</div></div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Test Strategy</div>
        <div class="story-card">
          <div class="story-title">${strategy.approach || 'Risk-Based Testing'}</div>
          <div class="epic-meta" style="margin-bottom:8px">${(strategy.test_levels || []).map((l) => `<span class="card-tag">${l}</span>`).join('')}</div>
          <div class="epic-meta">${Object.entries(strategy.tools || {}).map(([k, v]) => `<span class="card-tag">${k}: ${v}</span>`).join('')}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:8px">ENVIRONMENTS: ${(strategy.environments || []).join(' · ')}</div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Test Suites (${suites.length})</div>${suitesHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">BDD Scenarios (${bdd.length} features)</div>${bddHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Automation Snippets</div>${snippetsHtml}</div>

      ${summary.risk_areas ? `<div class="report-sec"><div class="report-sec-hdr">Risk Areas</div>${(summary.risk_areas || []).map((r) => `<div class="risk-row"><div class="risk-bar Medium"></div><div><div class="risk-title">${r}</div></div></div>`).join('')}</div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Test plan published to Jira (simulated)')">🔗 Publish to Jira</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to QA Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Select different stories</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  CODE GENERATION AGENT
// ============================================================
function renderCodeStep1() {
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box"><strong>Git Integration:</strong> Connect to your GitHub repository. The agent will clone it locally, write the generated code into it, open VS Code, then push a new branch and open a PR.</div>
      <div class="frow">
        <div class="fgrp"><label class="flabel">Repository URL</label><input class="finput" id="git-repo-url" placeholder="https://github.com/org/repo" value="${state.code.gitConfig?.repoUrl || ''}"></div>
        <div class="fgrp"><label class="flabel">Base Branch</label><input class="finput" id="git-branch" placeholder="main" value="${state.code.gitConfig?.branch || 'main'}"></div>
      </div>
      <div class="fgrp"><label class="flabel">Personal Access Token (PAT)</label><input class="finput" id="git-token" type="password" placeholder="ghp_••••••••••••••••" value="${state.code.gitConfig?.token || ''}"><div style="font-size:10px;color:var(--text3);margin-top:4px">Requires <strong>repo</strong> scope. Token is held in memory only and never stored.</div></div>
      <div id="git-connect-status"></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `
    <button class="btn btn-ghost" onclick="skipGitConfig()">Skip — Generate Only →</button>
    <button class="btn btn-primary" onclick="handleGitConnect()">Connect &amp; Validate →</button>`;
}

async function handleGitConnect() {
  const repoUrl = document.getElementById('git-repo-url').value.trim();
  const token = document.getElementById('git-token').value.trim();
  const branch = document.getElementById('git-branch').value.trim() || 'main';
  const statusEl = document.getElementById('git-connect-status');

  if (!repoUrl || !token) {
    statusEl.innerHTML = '<div class="error-box">⚠ Repository URL and Personal Access Token are required.</div>';
    return;
  }

  statusEl.innerHTML = '<div class="info-box">🔄 Validating repository access…</div>';
  const btn = document.querySelector('#panel-ftr .btn-primary');
  btn.disabled = true;

  try {
    const result = await apiPost('/api/git/validate', { repoUrl, token });
    state.code.gitConfig = { repoUrl, token, branch };
    statusEl.innerHTML = `<div class="success-box">✓ Connected to <strong>${result.repoName}</strong> — access confirmed</div>`;
    btn.disabled = false;
    btn.textContent = 'Select Stories →';
    btn.onclick = () => goToStep(2);
  } catch (err) {
    btn.disabled = false;
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
  }
}

function skipGitConfig() {
  state.code.gitConfig = null;
  goToStep(2);
}

async function renderCodeStep2() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading stories for implementation…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/code-agent/stories');
    state.code.stories = result.items || [];
  } catch {
    state.code.stories = [];
  }
  state.code.selectedIds = [];
  const html = state.code.stories
    .map(
      (s) =>
        `<div class="epic-item" id="code-${s.id}" onclick="toggleItemSelection('code','${s.id}')"><div class="epic-chk" id="code-chk-${s.id}"></div><div style="flex:1"><div class="epic-key">${s.id}</div><div class="epic-summary">${s.title}</div><div class="epic-meta"><span class="sp-badge">${s.story_points} pts</span><span class="epill ${s.priority === 'High' ? 'p-high' : 'p-medium'}">${s.priority}</span></div></div></div>`
    )
    .join('');
  const gitStatus = state.code.gitConfig
    ? `<div class="info-box">🔗 Git connected: <strong>${state.code.gitConfig.repoUrl}</strong> · Branch: <strong>${state.code.gitConfig.branch}</strong></div>`
    : `<div class="info-box" style="border-color:var(--amber)">⚠ No Git connection — code will be generated for preview only (no clone or push).</div>`;
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      ${gitStatus}
      <div class="info-box" style="margin-top:8px">Select stories to scaffold — generates NestJS services, Prisma models, unit tests, and a PR.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.code.stories.length} STORIES</span><button class="btn-exp" onclick="selectAllItems('code')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(1)">← Back</button><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(3)">Generate Code →</button>`;
}

function renderCodeStep3() {
  const ids = state.code.selectedIds;
  renderProgressList('code', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} stories selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'code',
    () => apiPost('/api/code-agent/generate', { storyIds: ids }),
    (result) => {
      state.code.reportData = result.code;
      state.code.reportSource = result.source;
    }
  );
}

function renderCodeStep4() {
  const data = state.code.reportData;
  if (!data) return;
  const scaffold = data.scaffold || {};
  const snippets = data.code_snippets || [];
  const tests = data.unit_tests || [];
  const pr = data.pr_summary || {};
  const sa = data.static_analysis || {};
  const hasGit = !!state.code.gitConfig;

  const filesHtml = (scaffold.project_structure || [])
    .map(
      (f) =>
        `<div class="file-tree-item"><span class="file-icon">${f.type === 'service' ? '⚙' : f.type === 'controller' ? '🔌' : f.type === 'model' ? '📦' : f.type === 'config' ? '⚡' : f.type === 'test' ? '🧪' : '📄'}</span><span style="flex:1">${f.path}</span><span style="color:var(--text3);font-size:10px">${f.lines} lines</span></div>`
    )
    .join('');

  const snippetsHtml = snippets
    .map((s) => `<div style="margin-bottom:12px"><div class="code-block-hdr"><span>${s.file}</span><span>${s.language}</span></div><pre class="code-block">${escapeHtml(s.code)}</pre><div style="font-size:11px;color:var(--text3);padding:4px 0">${s.description}</div></div>`)
    .join('');

  const testsHtml = tests
    .map((t) => `<div style="margin-bottom:12px"><div class="code-block-hdr"><span>${t.file}</span><span>${t.framework} · ${t.test_count} tests</span></div><pre class="code-block">${escapeHtml(t.code)}</pre></div>`)
    .join('');

  const issuesHtml = (sa.issues || [])
    .map(
      (issue) =>
        `<div class="ac-item"><span class="kw">${issue.severity}</span> ${issue.rule} — ${issue.file}: ${issue.message}</div>`
    )
    .join('');

  const metrics = sa.metrics || {};

  const gitActionsHtml = hasGit ? `
    <div class="report-sec">
      <div class="report-sec-hdr">🔗 GitHub Integration</div>
      <div class="story-card">
        <div class="story-narrative" style="margin-bottom:12px">Repository: <strong>${state.code.gitConfig.repoUrl}</strong> · Base branch: <strong>${state.code.gitConfig.branch}</strong></div>
        <div id="git-action-status"></div>
        <div class="report-actions" style="margin-top:10px">
          <button class="btn-exp primary" id="btn-clone-open" onclick="handleCloneAndOpen()">⬇ Clone &amp; Open in VS Code</button>
          <button class="btn-exp" id="btn-push" onclick="handlePushCode()" ${state.code.clonedPath ? '' : 'disabled'}>🚀 Push Generated Code</button>
          <button class="btn-exp" id="btn-create-pr" onclick="handleCreatePR()" ${state.code.pushedBranch ? '' : 'disabled'}>🔁 Create Pull Request</button>
        </div>
        ${state.code.pushedBranch ? `<div class="success-box" style="margin-top:8px">✓ Branch <strong>${state.code.pushedBranch}</strong> pushed</div>` : ''}
      </div>
    </div>` : `
    <div class="report-sec">
      <div class="report-sec-hdr">🔗 GitHub Integration</div>
      <div class="story-card"><div class="story-narrative">No Git connection configured. <a href="#" onclick="goToStep(1)" style="color:var(--accent)">Go back to Step 1</a> to connect a repository and enable clone, push &amp; PR creation.</div></div>
    </div>`;

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Code generated (${state.code.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${scaffold.total_files || 0} files, ${scaffold.total_lines || 0} lines</div>

      <div class="report-sec"><div class="report-sec-hdr">Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${scaffold.total_files || 0}</div><div class="stat-lbl">Files</div></div>
          <div class="stat-card"><div class="stat-val">${scaffold.total_lines || 0}</div><div class="stat-lbl">Lines</div></div>
          <div class="stat-card"><div class="stat-val">${metrics.coverage || '—'}</div><div class="stat-lbl">Coverage</div></div>
          <div class="stat-card"><div class="stat-val">${sa.quality_gate || '—'}</div><div class="stat-lbl">Quality Gate</div></div>
        </div>
      </div>

      ${gitActionsHtml}

      <div class="report-sec"><div class="report-sec-hdr">Project Structure</div>
        <div class="story-card">
          <div class="epic-meta" style="margin-bottom:10px">${Object.entries(scaffold.tech_stack || {}).map(([k, v]) => `<span class="card-tag">${k}: ${v}</span>`).join('')}</div>
          <div class="file-tree">${filesHtml}</div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Code Snippets (${snippets.length})</div>${snippetsHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Unit Tests (${tests.length})</div>${testsHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Pull Request</div>
        <div class="story-card">
          <div class="story-title">${pr.title || ''}</div>
          <div class="story-narrative">${pr.description || ''}</div>
          <div class="epic-meta"><span class="card-tag">+${pr.additions || 0} / -${pr.deletions || 0}</span><span class="card-tag">${pr.files_changed || 0} files</span>${(pr.labels || []).map((l) => `<span class="card-tag">${l}</span>`).join('')}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:6px">REVIEWERS: ${(pr.reviewers || []).join(', ')}</div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Static Analysis — ${sa.tool || 'SonarQube'}</div>
        <div class="stats-grid" style="margin-bottom:10px">
          <div class="stat-card"><div class="stat-val">${metrics.bugs || 0}</div><div class="stat-lbl">Bugs</div></div>
          <div class="stat-card"><div class="stat-val">${metrics.vulnerabilities || 0}</div><div class="stat-lbl">Vulnerabilities</div></div>
          <div class="stat-card"><div class="stat-val">${metrics.code_smells || 0}</div><div class="stat-lbl">Code Smells</div></div>
          <div class="stat-card"><div class="stat-val">${metrics.duplications || '—'}</div><div class="stat-lbl">Duplications</div></div>
        </div>
        ${issuesHtml ? `<div class="ac-list" style="display:flex">${issuesHtml}</div>` : ''}
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Export</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(2)">← Select different stories</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

async function handleCloneAndOpen() {
  const btn = document.getElementById('btn-clone-open');
  const statusEl = document.getElementById('git-action-status');
  if (!btn || !statusEl) return;
  btn.disabled = true;
  btn.textContent = '⏳ Cloning…';
  statusEl.innerHTML = '<div class="info-box">🔄 Cloning repository and launching VS Code…</div>';
  try {
    const result = await apiPost('/api/git/clone', {
      repoUrl: state.code.gitConfig.repoUrl,
      token: state.code.gitConfig.token,
      branch: state.code.gitConfig.branch,
      storyIds: state.code.selectedIds
    });
    state.code.clonedPath = result.clonedPath;
    const note = result.isEmptyRepo
      ? ' <em>(Empty repo — generated code will be the first commit.)</em>'
      : '';
    statusEl.innerHTML = `<div class="success-box">✓ Cloned to <strong>${result.clonedPath}</strong> — VS Code should open momentarily.${note}</div>`;
    btn.textContent = '✓ Cloned';
    // Enable push button
    const pushBtn = document.getElementById('btn-push');
    if (pushBtn) pushBtn.disabled = false;
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '⬇ Clone & Open in VS Code';
  }
}

async function handlePushCode() {
  const btn = document.getElementById('btn-push');
  const statusEl = document.getElementById('git-action-status');
  if (!btn || !statusEl) return;
  btn.disabled = true;
  btn.textContent = '⏳ Pushing…';
  statusEl.innerHTML = '<div class="info-box">🔄 Writing generated files and pushing branch…</div>';

  // Build a flat map of generated files from reportData
  const data = state.code.reportData || {};
  const generatedFiles = {};
  for (const snippet of (data.code_snippets || [])) {
    if (snippet.file && snippet.code) generatedFiles[snippet.file] = snippet.code;
  }
  for (const test of (data.unit_tests || [])) {
    if (test.file && test.code) generatedFiles[test.file] = test.code;
  }

  try {
    const result = await apiPost('/api/git/push', {
      clonedPath: state.code.clonedPath,
      storyIds: state.code.selectedIds,
      generatedFiles,
      token: state.code.gitConfig.token,
      repoUrl: state.code.gitConfig.repoUrl,
      commitMessage: `feat: AI-generated code for ${state.code.selectedIds.join(', ')} [AADP]`
    });
    state.code.pushedBranch = result.branch;
    statusEl.innerHTML = `<div class="success-box">✓ Branch <strong>${result.branch}</strong> pushed to origin.</div>`;
    btn.textContent = '✓ Pushed';
    // Enable PR button
    const prBtn = document.getElementById('btn-create-pr');
    if (prBtn) prBtn.disabled = false;
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '🚀 Push Generated Code';
  }
}

async function handleCreatePR() {
  const btn = document.getElementById('btn-create-pr');
  const statusEl = document.getElementById('git-action-status');
  if (!btn || !statusEl) return;
  btn.disabled = true;
  btn.textContent = '⏳ Creating PR…';
  statusEl.innerHTML = '<div class="info-box">🔄 Opening pull request on GitHub…</div>';

  const pr = (state.code.reportData || {}).pr_summary || {};
  try {
    const result = await apiPost('/api/git/pr', {
      repoUrl: state.code.gitConfig.repoUrl,
      token: state.code.gitConfig.token,
      branch: state.code.pushedBranch,
      baseBranch: state.code.gitConfig.branch,
      title: pr.title || `feat: AI-generated code for ${state.code.selectedIds.join(', ')}`,
      body: pr.description || 'Generated by AADP Code Generation Agent.'
    });
    statusEl.innerHTML = `<div class="success-box">✓ PR <strong>#${result.prNumber}</strong> created — <a href="${result.prUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${result.prUrl}</a></div>`;
    btn.textContent = `✓ PR #${result.prNumber}`;
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '🔁 Create Pull Request';
  }
}

// ============================================================
//  DEPLOYMENT AGENT
// ============================================================
async function renderDeployStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading build artifacts…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/deploy-agent/artifacts');
    state.deploy.artifacts = result.items || [];
  } catch {
    state.deploy.artifacts = [];
  }
  state.deploy.selectedIds = [];
  const html = state.deploy.artifacts
    .map(
      (a) =>
        `<div class="epic-item" id="deploy-${a.id}" onclick="toggleItemSelection('deploy','${a.id}')"><div class="epic-chk" id="deploy-chk-${a.id}"></div><div style="flex:1"><div class="epic-key">${a.id}</div><div class="epic-summary">${a.name}</div><div class="epic-desc">${a.version} · ${a.type} · ${a.size}</div><div class="epic-meta"><span class="card-tag">${a.type}</span><span class="status-pill">${a.version}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select build artifacts to deploy — orchestrates CI/CD pipeline, deploys to QA, runs smoke &amp; regression tests.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.deploy.artifacts.length} ARTIFACTS</span><button class="btn-exp" onclick="selectAllItems('deploy')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">GitHub Actions · Helm · K8s · Playwright</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Deploy to QA →</button>`;
}

function renderDeployStep2() {
  const ids = state.deploy.selectedIds;
  renderProgressList('deploy', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} artifacts selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'deploy',
    () => apiPost('/api/deploy-agent/generate', { artifactIds: ids }),
    (result) => {
      state.deploy.reportData = result.deployment;
      state.deploy.reportSource = result.source;
    }
  );
}

function renderDeployStep3() {
  const data = state.deploy.reportData;
  if (!data) return;
  const pipeline = data.pipeline || {};
  const env = data.environment || {};
  const tests = data.test_results || {};
  const rollback = data.rollback_plan || {};
  const summary = data.summary || {};

  const stagesHtml = (pipeline.stages || [])
    .map(
      (stage) =>
        `<div class="sprint-row"><div class="stage-dot ${stage.status === 'Passed' ? 'passed' : 'failed'}">${stage.status === 'Passed' ? '✓' : '✗'}</div><div style="flex:1"><div class="sprint-goal">${stage.name}</div><div class="sprint-stories">${(stage.steps || []).join(' → ')}</div></div><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${stage.duration}</span></div>`
    )
    .join('');

  const failuresHtml = (tests.failures || [])
    .map(
      (f) =>
        `<div class="risk-row"><div class="risk-bar ${f.severity === 'High' ? 'High' : 'Medium'}"></div><div><div class="risk-pills"><span class="risk-pill">${f.severity}</span><span class="risk-pill">${f.jira_ticket}</span></div><div class="risk-title">${f.test}</div><div class="risk-mit">↳ ${f.error}</div></div></div>`
    )
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ ${summary.status || 'Deployed'} (${state.deploy.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${summary.version || ''} · ${summary.pass_rate || ''} pass rate</div>

      <div class="report-sec"><div class="report-sec-hdr">Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val" style="font-size:16px">${summary.status || '—'}</div><div class="stat-lbl">Status</div></div>
          <div class="stat-card"><div class="stat-val">${summary.total_tests || 0}</div><div class="stat-lbl">Tests Run</div></div>
          <div class="stat-card"><div class="stat-val">${summary.pass_rate || '—'}</div><div class="stat-lbl">Pass Rate</div></div>
          <div class="stat-card"><div class="stat-val">${summary.open_defects || 0}</div><div class="stat-lbl">Defects</div></div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Pipeline — ${pipeline.name || ''}</div>
        <div class="story-card" style="padding:0"><div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${pipeline.id || ''} · ${pipeline.trigger || ''}</span><span class="sp-badge">${pipeline.status || ''}</span></div>${stagesHtml}</div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Environment</div>
        <div class="story-card">
          <div class="story-title">${env.name || 'QA'} — ${env.cluster || ''}</div>
          <div class="epic-meta" style="margin-bottom:6px"><span class="card-tag">Namespace: ${env.namespace || ''}</span><span class="card-tag">Replicas: ${env.replicas || ''}</span><span class="card-tag">Image: ${env.image_tag || ''}</span></div>
          ${env.endpoints ? `<div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:6px">${Object.entries(env.endpoints).map(([k, v]) => `${k}: ${v}`).join('<br>')}</div>` : ''}
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Test Results</div>
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px">
          <div class="stat-card"><div class="stat-val">${tests.smoke?.passed || 0}/${tests.smoke?.total || 0}</div><div class="stat-lbl">Smoke</div></div>
          <div class="stat-card"><div class="stat-val">${tests.regression?.passed || 0}/${tests.regression?.total || 0}</div><div class="stat-lbl">Regression</div></div>
          <div class="stat-card"><div class="stat-val">${tests.performance?.p95_ms || 0}ms</div><div class="stat-lbl">P95 Latency</div></div>
        </div>
        ${failuresHtml ? `<div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:6px">FAILURES (${(tests.failures || []).length})</div>${failuresHtml}` : ''}
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Rollback Plan</div>
        <div class="story-card">
          <div class="story-title">${rollback.strategy || ''}</div>
          <div class="story-narrative">Previous version: ${rollback.previous_version || ''} · Estimated time: ${rollback.estimated_time || ''}</div>
          <div style="margin-top:6px">${(rollback.auto_rollback_triggers || []).map((t) => `<div class="ac-item">${t}</div>`).join('')}</div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Deployment log shared (simulated)')">📋 Share Deploy Log</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Notify Stakeholders</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(1)">← Select different artifacts</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>`;
}

// ============================================================
//  MONITORING & TRIAGE AGENT
// ============================================================
async function renderMonitorStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading monitored services…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/monitor-agent/services');
    state.monitor.services = result.items || [];
  } catch {
    state.monitor.services = [];
  }
  state.monitor.selectedIds = [];
  const statusColors = { Healthy: 'var(--accent)', Degraded: 'var(--red)', Warning: 'var(--amber)' };
  const html = state.monitor.services
    .map(
      (s) =>
        `<div class="epic-item" id="monitor-${s.id}" onclick="toggleItemSelection('monitor','${s.id}')"><div class="epic-chk" id="monitor-chk-${s.id}"></div><div style="flex:1"><div class="epic-key">${s.id}</div><div class="epic-summary">${s.name}</div><div class="epic-meta"><span class="epill" style="background:${statusColors[s.status] || 'var(--text3)'}22;color:${statusColors[s.status] || 'var(--text3)'}">${s.status}</span><span class="card-tag">Uptime: ${s.uptime}</span><span class="card-tag">${s.region}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select services to analyse — detects anomalies, correlates traces across Datadog / ELK / Jaeger, performs RCA, and generates fix recommendations.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.monitor.services.length} SERVICES</span><button class="btn-exp" onclick="selectAllItems('monitor')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">Datadog · Jaeger · ELK · RCA</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Analyse Services →</button>`;
}

function renderMonitorStep2() {
  const ids = state.monitor.selectedIds;
  renderProgressList('monitor', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} services selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'monitor',
    () => apiPost('/api/monitor-agent/generate', { serviceIds: ids }),
    (result) => {
      state.monitor.reportData = result.triage;
      state.monitor.reportSource = result.source;
    }
  );
}

function renderMonitorStep3() {
  const data = state.monitor.reportData;
  if (!data) return;
  const anomalies = data.anomalies || [];
  const traces = data.traces || [];
  const rca = data.rca || {};
  const correlations = data.correlations || [];
  const recommendations = data.recommendations || [];
  const defects = data.jira_defects || [];
  const summary = data.summary || {};

  const severityColors = { Critical: 'var(--red)', High: 'var(--amber)', Medium: 'var(--purple)', Low: 'var(--blue)' };

  const anomaliesHtml = anomalies
    .map(
      (a) =>
        `<div class="risk-row"><div class="risk-bar ${a.severity}"></div><div style="flex:1"><div class="risk-pills"><span class="risk-pill">${a.severity}</span><span class="risk-pill">${a.status}</span><span class="risk-pill">${a.duration}</span></div><div class="risk-title">${a.service} — ${a.metric}</div><div class="risk-mit">Current: ${a.current_value} · Threshold: ${a.threshold}</div></div></div>`
    )
    .join('');

  const tracesHtml = traces
    .map(
      (t) =>
        `<div class="story-card"><div class="story-top"><div><div class="story-id">TRACE</div><div class="story-title" style="font-size:11px;word-break:break-all">${t.trace_id}</div></div><span class="sp-badge">${t.total_duration_ms}ms</span></div><div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0">${(t.service_chain || []).map((s, i) => `<span class="card-tag">${s}${i < t.service_chain.length - 1 ? ' →' : ''}</span>`).join('')}</div><div class="story-narrative">Bottleneck: <strong>${t.bottleneck}</strong> · Error span: ${t.error_span}</div></div>`
    )
    .join('');

  const timelineHtml = (rca.timeline || [])
    .map(
      (e) =>
        `<div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-time">${e.time ? new Date(e.time).toLocaleTimeString() : ''}</div><div class="timeline-event">${e.event}</div></div></div>`
    )
    .join('');

  const correlationsHtml = correlations
    .map(
      (c) =>
        `<div class="ac-item" style="display:block"><div style="display:flex;gap:6px;align-items:center;margin-bottom:2px"><span class="kw">${c.source}</span><span class="card-tag">${c.type}</span></div><div>${c.description}</div></div>`
    )
    .join('');

  const recsHtml = recommendations
    .map(
      (r) =>
        `<div class="story-card"><div class="story-top"><div><div class="story-id">${r.id}</div><div class="story-title">${r.title}</div></div><span class="sp-badge">${r.priority}</span></div><div class="story-narrative">${r.description}</div><div class="epic-meta"><span class="card-tag">${r.fix_type}</span><span class="card-tag">${r.estimated_effort}</span></div>${r.code_suggestion ? `<pre class="code-block" style="margin-top:8px;font-size:10px">${escapeHtml(r.code_suggestion)}</pre>` : ''}</div>`
    )
    .join('');

  const defectsHtml = defects
    .map(
      (d) =>
        `<div class="sprint-row"><span class="sprint-num" style="min-width:70px">${d.key}</span><div style="flex:1"><div class="sprint-goal">${d.summary}</div><div class="epic-meta" style="margin-top:4px"><span class="epill ${d.priority === 'Critical' ? 'p-critical' : d.priority === 'High' ? 'p-high' : 'p-medium'}">${d.priority}</span>${(d.labels || []).map((l) => `<span class="card-tag">${l}</span>`).join('')}</div></div></div>`
    )
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner" style="${summary.critical_count > 0 ? 'background:rgba(255,85,85,0.06);border-color:rgba(255,85,85,0.2);color:var(--red)' : ''}">⚠ ${summary.total_anomalies || 0} anomalies detected (${summary.critical_count || 0} critical) — ${summary.services_affected || 0} services affected · MTTR estimate: ${summary.mttr_estimate || '—'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val" style="color:var(--red)">${summary.total_anomalies || 0}</div><div class="stat-lbl">Anomalies</div></div>
          <div class="stat-card"><div class="stat-val" style="color:var(--red)">${summary.critical_count || 0}</div><div class="stat-lbl">Critical</div></div>
          <div class="stat-card"><div class="stat-val">${summary.services_affected || 0}</div><div class="stat-lbl">Services</div></div>
          <div class="stat-card"><div class="stat-val">${summary.mttr_estimate || '—'}</div><div class="stat-lbl">Est. MTTR</div></div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Anomalies (${anomalies.length})</div>${anomaliesHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Distributed Traces (${traces.length})</div>${tracesHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Root Cause Analysis</div>
        <div class="story-card">
          <div class="story-top"><div><div class="story-id">RCA · ${rca.confidence || ''} confidence</div><div class="story-title">${rca.probable_cause || ''}</div></div></div>
          <div class="story-narrative">Blast radius: ${rca.blast_radius || ''}</div>
          <div style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--text3)">EVIDENCE</div>
          <div class="ac-list" style="display:flex;margin-top:4px">${(rca.evidence || []).map((e) => `<div class="ac-item">${e}</div>`).join('')}</div>
          ${timelineHtml ? `<div style="margin-top:12px;font-family:var(--mono);font-size:10px;color:var(--text3)">TIMELINE</div><div class="timeline" style="margin-top:6px">${timelineHtml}</div>` : ''}
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Signal Correlations (${correlations.length})</div><div class="ac-list" style="display:flex">${correlationsHtml}</div></div>

      <div class="report-sec"><div class="report-sec-hdr">Fix Recommendations (${recommendations.length})</div>${recsHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Auto-Created Jira Defects (${defects.length})</div><div class="sprint-rows">${defectsHtml}</div></div>

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Incident posted to Slack (simulated)')">💬 Post to Slack</button><button class="btn-exp" onclick="alert('PagerDuty incident created (simulated)')">🚨 Create PagerDuty Incident</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to SRE Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Analyse different services</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  REVIEW AGENT
// ============================================================
async function renderReviewStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading review artifacts…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/review-agent/items');
    state.review.items = result.items || [];
  } catch {
    state.review.items = [];
  }
  state.review.selectedIds = [];
  const typeIcon = { architecture: '🏗️', adr: '📋', code: '⚙️', tests: '🧪', 'api-contract': '📜', diagram: '📊' };
  const html = state.review.items
    .map(
      (item) =>
        `<div class="epic-item" id="review-${item.id}" onclick="toggleItemSelection('review','${item.id}')"><div class="epic-chk" id="review-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="card-tag">${typeIcon[item.type] || '📄'} ${item.type}</span><span class="card-tag">${item.source}</span><span class="epill p-medium">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select architecture artifacts to review — checks component boundary conformance, ADR adherence, API contract compliance, and design pattern correctness.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.review.items.length} ARTIFACTS</span><button class="btn-exp" onclick="selectAllItems('review')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">ADR Check · OpenAPI Validation · Design Patterns</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Review Architecture →</button>`;
}

function renderReviewStep2() {
  const ids = state.review.selectedIds;
  renderProgressList('review', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} artifacts selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'review',
    () => apiPost('/api/review-agent/generate', { itemIds: ids }),
    (result) => {
      state.review.reportData = result.review;
      state.review.reportSource = result.source;
    }
  );
}

function renderReviewStep3() {
  const data = state.review.reportData;
  if (!data) return;
  const arch = data.arch_review || {};
  const checks = data.compliance_checks || [];
  const summary = data.summary || {};

  const archCatsHtml = (arch.categories || [])
    .map((cat) => `<div class="story-card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><div class="story-title">${cat.name}</div><div style="display:flex;gap:6px"><span class="sp-badge">${cat.score}/100</span><span class="epill ${cat.status === 'Pass' ? 'p-medium' : 'p-high'}">${cat.status}</span></div></div>${(cat.violations || []).map((v) => `<div class="ac-item" style="margin-top:6px"><span class="kw">${v.severity}</span> ${escapeHtml(v.description)}</div>`).join('')}</div>`)
    .join('');

  const checksHtml = checks
    .map((c) => `<div class="sprint-row"><span class="epill ${c.status === 'Pass' ? 'p-medium' : c.status === 'Warning' ? 'p-high' : 'p-critical'}">${c.status}</span><span style="flex:1;margin-left:8px">${c.check}</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${c.value}</span></div>`)
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Architecture review complete (${state.review.reportSource === 'llm' ? 'LLM' : 'Mock'}) — Verdict: ${summary.overall_verdict || '—'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Review Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${summary.arch_score || arch.score || '—'}</div><div class="stat-lbl">Arch Score</div></div>
          <div class="stat-card"><div class="stat-val">${summary.medium_violations || 0}</div><div class="stat-lbl">Medium Issues</div></div>
          <div class="stat-card"><div class="stat-val">${summary.low_violations || 0}</div><div class="stat-lbl">Low Issues</div></div>
          <div class="stat-card"><div class="stat-val">${summary.total_violations || 0}</div><div class="stat-lbl">Total Issues</div></div>
        </div>
        ${(summary.conditions || []).length ? `<div class="ac-list" style="margin-top:8px">${(summary.conditions || []).map((c) => `<div class="ac-item">⚠ ${escapeHtml(c)}</div>`).join('')}</div>` : ''}
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Architecture Review — ${arch.overall_verdict || ''} (${arch.score || '—'}/${arch.max_score || 100})</div>${archCatsHtml}</div>

      <div class="report-sec"><div class="report-sec-hdr">Compliance Checks (${checks.length})</div><div class="sprint-rows">${checksHtml}</div></div>

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Review posted to GitHub PR (simulated)')">🔗 Post to GitHub PR</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Review different artifacts</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  CODE REVIEW AGENT
// ============================================================

// -- Step 1: Git Config + Clone OR Select Local Folder --
function renderCodeReviewStep1() {
  const activeTab = state.codereview.mode || 'git';
  const gitActive = activeTab === 'git' ? 'active' : '';
  const localActive = activeTab === 'local' ? 'active' : '';

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:1px solid var(--border)">
        <button class="btn-exp ${gitActive}" id="cr-tab-git" onclick="switchCRTab('git')" style="flex:1;border-radius:6px 0 0 0;padding:10px;font-size:11px;${gitActive ? 'background:var(--accent);color:#090b0f;font-weight:700' : ''}">⬇ Clone from GitHub</button>
        <button class="btn-exp ${localActive}" id="cr-tab-local" onclick="switchCRTab('local')" style="flex:1;border-radius:0 6px 0 0;padding:10px;font-size:11px;${localActive ? 'background:var(--accent);color:#090b0f;font-weight:700' : ''}">📁 Select Local Folder</button>
      </div>
      <div id="cr-tab-content"></div>
      <div id="cr-connect-status"></div>
    </div>`;

  renderCRTabContent(activeTab);
  document.getElementById('panel-ftr').innerHTML = activeTab === 'git'
    ? `<button class="btn btn-primary" onclick="handleCRGitConnect()">Connect &amp; Clone →</button>`
    : `<button class="btn btn-primary" onclick="handleCRLocalFolder()">Open &amp; Continue →</button>`;
}

function switchCRTab(tab) {
  state.codereview.mode = tab;
  renderCodeReviewStep1();
}

function renderCRTabContent(tab) {
  const el = document.getElementById('cr-tab-content');
  if (tab === 'git') {
    el.innerHTML = `
      <div class="info-box"><strong>Clone from GitHub:</strong> The agent will clone the repository, open it in VS Code, then review the source code with AI.</div>
      <div class="frow">
        <div class="fgrp"><label class="flabel">Repository URL</label><input class="finput" id="cr-repo-url" placeholder="https://github.com/org/repo" value="${state.codereview.gitConfig?.repoUrl || ''}"></div>
        <div class="fgrp"><label class="flabel">Base Branch</label><input class="finput" id="cr-branch" placeholder="main" value="${state.codereview.gitConfig?.branch || 'main'}"></div>
      </div>
      <div class="fgrp"><label class="flabel">Personal Access Token (PAT)</label><input class="finput" id="cr-token" type="password" placeholder="ghp_••••••••••••••••" value="${state.codereview.gitConfig?.token || ''}"><div style="font-size:10px;color:var(--text3);margin-top:4px">Requires <strong>repo</strong> scope. Token is held in memory only and never stored.</div></div>`;
  } else {
    el.innerHTML = `
      <div class="info-box"><strong>Local Folder:</strong> Point to an existing project on your machine. The agent will open it in VS Code and review the source code. If a Git remote is detected, you can push fixes afterwards.</div>
      <div class="fgrp"><label class="flabel">Project Folder Path</label><input class="finput" id="cr-local-path" placeholder="C:\\Projects\\my-app  or  /home/user/projects/my-app" value="${state.codereview.clonedPath || ''}"></div>
      <div class="fgrp"><label class="flabel">Git PAT (optional — needed only if you want to push fixes)</label><input class="finput" id="cr-local-token" type="password" placeholder="ghp_•••••••••• (leave blank for review-only)" value="${state.codereview.gitConfig?.token || ''}"></div>`;
  }
}

async function handleCRGitConnect() {
  const repoUrl = document.getElementById('cr-repo-url').value.trim();
  const token = document.getElementById('cr-token').value.trim();
  const branch = document.getElementById('cr-branch').value.trim() || 'main';
  const statusEl = document.getElementById('cr-connect-status');
  if (!repoUrl || !token) { statusEl.innerHTML = '<div class="error-box">⚠ Repository URL and Personal Access Token are required.</div>'; return; }

  const btn = document.querySelector('#panel-ftr .btn-primary');
  btn.disabled = true;
  statusEl.innerHTML = '<div class="info-box">🔄 Validating repository access…</div>';

  try {
    const valResult = await apiPost('/api/git/validate', { repoUrl, token });
    statusEl.innerHTML = `<div class="success-box">✓ Connected to <strong>${valResult.repoName}</strong> — cloning…</div>`;

    const cloneResult = await apiPost('/api/git/clone', { repoUrl, token, branch, storyIds: ['codereview'] });
    state.codereview.mode = 'git';
    state.codereview.gitConfig = { repoUrl, token, branch };
    state.codereview.clonedPath = cloneResult.clonedPath;
    state.codereview.localGit = { hasGit: true, remote: repoUrl, branch };
    const note = cloneResult.isEmptyRepo ? ' <em>(Empty repo)</em>' : '';
    statusEl.innerHTML = `<div class="success-box">✓ Cloned to <strong>${cloneResult.clonedPath}</strong> — VS Code opening.${note}</div>`;

    btn.disabled = false;
    btn.textContent = 'Select Files →';
    btn.onclick = () => goToStep(2);
  } catch (err) {
    btn.disabled = false;
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
  }
}

async function handleCRLocalFolder() {
  const folderPath = document.getElementById('cr-local-path').value.trim();
  const token = document.getElementById('cr-local-token')?.value.trim() || '';
  const statusEl = document.getElementById('cr-connect-status');
  if (!folderPath) { statusEl.innerHTML = '<div class="error-box">⚠ Please enter a folder path.</div>'; return; }

  const btn = document.querySelector('#panel-ftr .btn-primary');
  btn.disabled = true;
  statusEl.innerHTML = '<div class="info-box">🔄 Validating folder…</div>';

  try {
    const result = await apiPost('/api/codereview-agent/validate-local', { folderPath });
    state.codereview.mode = 'local';
    state.codereview.clonedPath = result.folderPath;
    state.codereview.localGit = { hasGit: result.hasGit, remote: result.remote, branch: result.branch };
    state.codereview.gitConfig = result.hasGit && token ? { repoUrl: result.remote, token, branch: result.branch } : null;

    const gitLabel = result.hasGit
      ? `Git: <strong>${result.branch || '—'}</strong>${result.remote ? ' · ' + result.remote : ' · no remote'}`
      : 'No Git repository detected — review only, push unavailable';
    statusEl.innerHTML = `<div class="success-box">✓ ${escapeHtml(result.folderPath)}<br><span style="font-size:10px">${gitLabel}</span></div>`;

    btn.disabled = false;
    btn.textContent = 'Select Files →';
    btn.onclick = () => goToStep(2);
  } catch (err) {
    btn.disabled = false;
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
  }
}

// -- Step 2: Select Files to Review --
async function renderCodeReviewStep2() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">🔄 Scanning repository files…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';

  try {
    const result = await apiPost('/api/codereview-agent/scan-files', { clonedPath: state.codereview.clonedPath });
    state.codereview.fileTree = result.files || [];
  } catch {
    state.codereview.fileTree = [];
  }
  state.codereview.selectedFiles = [];

  const extIcon = (ext) => {
    if (['.ts','.tsx','.js','.jsx'].includes(ext)) return '📜';
    if (['.py'].includes(ext)) return '🐍';
    if (['.java','.kt','.scala'].includes(ext)) return '☕';
    if (['.go'].includes(ext)) return '🔷';
    if (['.css','.scss','.less'].includes(ext)) return '🎨';
    if (['.html','.vue','.svelte'].includes(ext)) return '🌐';
    if (['.json','.yaml','.yml','.toml'].includes(ext)) return '⚙️';
    if (['.sql','.prisma'].includes(ext)) return '🗄️';
    if (['.md'].includes(ext)) return '📝';
    if (['.sh','.bash'].includes(ext)) return '🐚';
    return '📄';
  };

  const html = state.codereview.fileTree
    .map((f, i) =>
      `<div class="epic-item" id="crfile-${i}" onclick="toggleCRFile(${i})"><div class="epic-chk" id="crfile-chk-${i}"></div><div style="flex:1"><div class="epic-key" style="font-size:11px">${extIcon(f.extension)} ${f.path}</div><div class="epic-meta"><span class="card-tag">${f.extension}</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${(f.size / 1024).toFixed(1)} KB</span></div></div></div>`
    ).join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">🔗 Repository: <strong>${state.codereview.gitConfig?.repoUrl || ''}</strong> · Branch: <strong>${state.codereview.gitConfig?.branch || 'main'}</strong></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.codereview.fileTree.length} FILES</span>
        <button class="btn-exp" onclick="selectAllCRFiles()" style="padding:4px 10px;font-size:10px;">Select All</button>
      </div>
      ${html || '<div class="info-box" style="border-color:var(--amber)">No reviewable files found in repository.</div>'}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(1)">← Back</button><button class="btn btn-primary" id="cr-review-btn" disabled onclick="goToStep(3)">Review Selected Files →</button>`;
}

function toggleCRFile(idx) {
  const s = state.codereview;
  const pos = s.selectedFiles.indexOf(idx);
  if (pos >= 0) s.selectedFiles.splice(pos, 1); else s.selectedFiles.push(idx);
  const el = document.getElementById(`crfile-${idx}`);
  const chk = document.getElementById(`crfile-chk-${idx}`);
  if (el) el.classList.toggle('selected', s.selectedFiles.includes(idx));
  if (chk) chk.textContent = s.selectedFiles.includes(idx) ? '✓' : '';
  const btn = document.getElementById('cr-review-btn');
  if (btn) btn.disabled = s.selectedFiles.length === 0;
}

function selectAllCRFiles() {
  const s = state.codereview;
  const allSelected = s.selectedFiles.length === s.fileTree.length;
  s.selectedFiles = allSelected ? [] : s.fileTree.map((_, i) => i);
  s.fileTree.forEach((_, i) => {
    const el = document.getElementById(`crfile-${i}`);
    const chk = document.getElementById(`crfile-chk-${i}`);
    if (el) el.classList.toggle('selected', !allSelected);
    if (chk) chk.textContent = allSelected ? '' : '✓';
  });
  const btn = document.getElementById('cr-review-btn');
  if (btn) btn.disabled = s.selectedFiles.length === 0;
}

// -- Step 3: Review animation → Report with selectable issues --
async function renderCodeReviewStep3() {
  const filePaths = state.codereview.selectedFiles.map((i) => state.codereview.fileTree[i]?.path).filter(Boolean);
  if (!filePaths.length) { goToStep(2); return; }

  // Show progress animation
  const genSteps = agentConfigs.codereview.genSteps;
  const progHtml = genSteps.map((step, i) =>
    `<div class="prog-item ${i === 0 ? 'running' : 'pending'}" id="crpg${i}"><div class="prog-dot">${i === 0 ? '' : i + 1}</div><div><div class="prog-label">${step.label}</div><div class="prog-sublabel">${step.sub}</div></div></div>`
  ).join('');

  document.getElementById('panel-body').innerHTML = `<div class="fadein"><div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${filePaths.length} files selected for review</div></div><div class="prog-list">${progHtml}</div><div id="cr-gen-error"></div></div>`;
  document.getElementById('panel-ftr').innerHTML = '<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">AI review in progress…</span>';

  const setCRProg = (i, s) => { const r = document.getElementById(`crpg${i}`); if (!r) return; r.className = `prog-item ${s}`; r.querySelector('.prog-dot').textContent = s === 'done' ? '✓' : s === 'running' ? '' : String(i + 1); };

  try {
    const animate = async () => { for (let i = 0; i < genSteps.length; i++) { setCRProg(i, 'running'); if (i > 0) setCRProg(i - 1, 'done'); await sleep(600 + Math.random() * 500); } };
    const [_, result] = await Promise.all([animate(), apiPost('/api/codereview-agent/review', { clonedPath: state.codereview.clonedPath, filePaths })]);
    for (let i = 0; i < genSteps.length; i++) setCRProg(i, 'done');
    state.codereview.reviewData = result.review;
    state.codereview.reviewSource = result.source;
    state.codereview.selectedIssues = [];
    await sleep(300);
    renderCRReport();
  } catch (err) {
    document.getElementById('cr-gen-error').innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(2)">← Back</button><button class="btn btn-primary" onclick="goToStep(3)">Retry →</button>`;
  }
}

function renderCRReport() {
  const data = state.codereview.reviewData;
  if (!data) return;
  const code = data.code_review || {};
  const toArr = (v) => Array.isArray(v) ? v : [];
  const issues = toArr(code.issues);
  const summary = data.summary || {};

  const sevClass = (s) => s === 'Critical' || s === 'High' ? 'p-critical' : s === 'Medium' ? 'p-high' : 'p-medium';

  const issuesHtml = issues.map((v, i) =>
    `<div class="epic-item" id="criss-${i}" onclick="toggleCRIssue(${i})" style="cursor:pointer">
      <div class="epic-chk" id="criss-chk-${i}"></div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <span class="epill ${sevClass(v.severity)}">${v.severity}</span>
          <span class="card-tag">${v.category || ''}</span>
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${v.id || ''}</span>
        </div>
        <div class="epic-summary">${escapeHtml(v.message || '')}</div>
        <div class="epic-meta"><span style="font-family:var(--mono);font-size:10px">${escapeHtml(v.file || '')}:${v.line || ''}</span></div>
        ${v.recommendation ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">↳ ${escapeHtml(v.recommendation)}</div>` : ''}
        ${v.code_snippet ? `<pre class="code-block" style="margin-top:4px;padding:6px 8px;font-size:10px">${escapeHtml(v.code_snippet)}</pre>` : ''}
      </div>
    </div>`
  ).join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Code review complete (${state.codereview.reviewSource === 'llm' ? 'LLM' : 'Mock'}) — Verdict: ${summary.overall_verdict || code.overall_verdict || '—'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Review Summary</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${summary.code_score || code.score || '—'}</div><div class="stat-lbl">Code Score</div></div>
          <div class="stat-card"><div class="stat-val">${summary.high_issues || 0}</div><div class="stat-lbl">High</div></div>
          <div class="stat-card"><div class="stat-val">${summary.medium_issues || 0}</div><div class="stat-lbl">Medium</div></div>
          <div class="stat-card"><div class="stat-val">${summary.total_issues || issues.length}</div><div class="stat-lbl">Total</div></div>
        </div>
      </div>

      <div class="report-sec">
        <div class="report-sec-hdr">Issues Found (${issues.length}) — select issues to fix</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">Check issues to include in AI fix</span>
          <button class="btn-exp" onclick="selectAllCRIssues()" style="padding:4px 10px;font-size:10px;">Select All</button>
        </div>
        ${issuesHtml || '<div class="info-box">No issues found — code looks clean!</div>'}
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Export</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button></div></div>
    </div>`;

  const hasIssues = issues.length > 0;
  document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(2)">← Select different files</button>${hasIssues ? '<button class="btn btn-primary" id="cr-fix-btn" disabled onclick="goToStep(4)">Fix Selected Issues →</button>' : '<button class="btn btn-primary" onclick="closePanel()">Done ✓</button>'}`;
}

function toggleCRIssue(idx) {
  const s = state.codereview;
  const pos = s.selectedIssues.indexOf(idx);
  if (pos >= 0) s.selectedIssues.splice(pos, 1); else s.selectedIssues.push(idx);
  const el = document.getElementById(`criss-${idx}`);
  const chk = document.getElementById(`criss-chk-${idx}`);
  if (el) el.classList.toggle('selected', s.selectedIssues.includes(idx));
  if (chk) chk.textContent = s.selectedIssues.includes(idx) ? '✓' : '';
  const btn = document.getElementById('cr-fix-btn');
  if (btn) btn.disabled = s.selectedIssues.length === 0;
}

function selectAllCRIssues() {
  const s = state.codereview;
  const issues = Array.isArray(s.reviewData?.code_review?.issues) ? s.reviewData.code_review.issues : [];
  const allSelected = s.selectedIssues.length === issues.length;
  s.selectedIssues = allSelected ? [] : issues.map((_, i) => i);
  issues.forEach((_, i) => {
    const el = document.getElementById(`criss-${i}`);
    const chk = document.getElementById(`criss-chk-${i}`);
    if (el) el.classList.toggle('selected', !allSelected);
    if (chk) chk.textContent = allSelected ? '' : '✓';
  });
  const btn = document.getElementById('cr-fix-btn');
  if (btn) btn.disabled = s.selectedIssues.length === 0;
}

// -- Step 4: Fix selected issues via LLM --
async function renderCodeReviewStep4() {
  const allIssues = Array.isArray(state.codereview.reviewData?.code_review?.issues) ? state.codereview.reviewData.code_review.issues : [];
  const issuesToFix = state.codereview.selectedIssues.map((i) => allIssues[i]).filter(Boolean);
  if (!issuesToFix.length) { goToStep(3); return; }

  const fixSteps = [
    { label: 'Analysing selected issues', sub: `${issuesToFix.length} issues across ${[...new Set(issuesToFix.map(i => i.file))].length} files` },
    { label: 'Reading affected source files', sub: 'Loading current file contents' },
    { label: 'Generating code fixes', sub: 'Applying best practices · security patches' },
    { label: 'Validating fixes', sub: 'Ensuring no regressions · syntax check' }
  ];
  const progHtml = fixSteps.map((step, i) =>
    `<div class="prog-item ${i === 0 ? 'running' : 'pending'}" id="crfix${i}"><div class="prog-dot">${i === 0 ? '' : i + 1}</div><div><div class="prog-label">${step.label}</div><div class="prog-sublabel">${step.sub}</div></div></div>`
  ).join('');

  document.getElementById('panel-body').innerHTML = `<div class="fadein"><div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${issuesToFix.length} issues selected for fixing</div></div><div class="prog-list">${progHtml}</div><div id="cr-fix-error"></div></div>`;
  document.getElementById('panel-ftr').innerHTML = '<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">AI fixing in progress…</span>';

  const setFixProg = (i, s) => { const r = document.getElementById(`crfix${i}`); if (!r) return; r.className = `prog-item ${s}`; r.querySelector('.prog-dot').textContent = s === 'done' ? '✓' : s === 'running' ? '' : String(i + 1); };

  try {
    const animate = async () => { for (let i = 0; i < fixSteps.length; i++) { setFixProg(i, 'running'); if (i > 0) setFixProg(i - 1, 'done'); await sleep(800 + Math.random() * 600); } };
    const [_, result] = await Promise.all([animate(), apiPost('/api/codereview-agent/fix', { clonedPath: state.codereview.clonedPath, issues: issuesToFix })]);
    for (let i = 0; i < fixSteps.length; i++) setFixProg(i, 'done');
    state.codereview.fixes = Array.isArray(result.fixes) ? result.fixes : [];
    state.codereview.fixSource = result.source;

    // Apply fixes to workspace immediately so they appear in VS Code
    state.codereview.fixesApplied = false;
    state.codereview.appliedFiles = [];
    if (state.codereview.fixes.length > 0) {
      try {
        const applyResult = await apiPost('/api/codereview-agent/apply-fixes', { clonedPath: state.codereview.clonedPath, fixes: state.codereview.fixes });
        state.codereview.appliedFiles = applyResult.applied || [];
        state.codereview.fixesApplied = state.codereview.appliedFiles.length > 0;
      } catch { /* will show warning in UI */ }
    }

    await sleep(300);
    renderCRFixes();
  } catch (err) {
    document.getElementById('cr-fix-error').innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(3)">← Back to Report</button><button class="btn btn-primary" onclick="goToStep(4)">Retry →</button>`;
  }
}

function renderCRFixes() {
  const fixes = state.codereview.fixes || [];
  const applied = state.codereview.fixesApplied;

  const appliedFiles = state.codereview.appliedFiles || [];
  const ideNotice = applied
    ? `<div class="success-box" style="margin-bottom:14px">✓ ${appliedFiles.length} file(s) updated in workspace — <strong>switch to VS Code</strong> to review changes, run tests, and verify before committing.<br><span style="font-family:var(--mono);font-size:10px">${appliedFiles.map(f => '• ' + f).join('<br>')}</span></div>`
    : `<div class="info-box" style="margin-bottom:14px;border-color:var(--amber)">⚠ Could not write fixes to workspace automatically. You can apply them manually from the diffs below.</div>`;

  const fixesHtml = fixes.map((f) =>
    `<div class="story-card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="story-title" style="font-size:12px">📄 ${escapeHtml(f.file)}</div>
        <span class="epill p-medium">${(f.issues_fixed || []).length} fix${(f.issues_fixed || []).length !== 1 ? 'es' : ''}</span>
      </div>
      <div style="font-size:10px;color:var(--text3);margin-bottom:6px">Issues fixed: ${(f.issues_fixed || []).join(', ')}</div>
      ${f.original_snippet ? `<div style="font-size:10px;color:var(--text3);margin-bottom:2px">Before:</div><pre class="code-block" style="padding:6px 8px;font-size:10px;border-left:3px solid #e74c3c;margin-bottom:6px">${escapeHtml(f.original_snippet)}</pre>` : ''}
      ${f.fixed_snippet ? `<div style="font-size:10px;color:var(--text3);margin-bottom:2px">After:</div><pre class="code-block" style="padding:6px 8px;font-size:10px;border-left:3px solid #00d9a6">${escapeHtml(f.fixed_snippet)}</pre>` : ''}
    </div>`
  ).join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ ${fixes.length} file(s) fixed (${state.codereview.fixSource === 'llm' ? 'LLM' : 'Mock'})</div>
      ${ideNotice}
      <div class="report-sec"><div class="report-sec-hdr">Fixes Applied</div>${fixesHtml || '<div class="info-box">No fixes generated.</div>'}</div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<button class="btn btn-ghost" onclick="goToStep(3)">← Back to Report</button><button class="btn btn-primary" onclick="goToStep(5)">Commit &amp; Push →</button>`;
}

// -- Step 5: Commit & Push --
async function renderCodeReviewStep5() {
  const fixes = state.codereview.fixes || [];
  const gc = state.codereview.gitConfig;
  const lg = state.codereview.localGit || {};
  const issueIds = fixes.flatMap((f) => f.issues_fixed || []);
  const canPush = lg.hasGit && lg.remote && gc?.token;

  let repoLabel = '';
  if (gc?.repoUrl) repoLabel = `🔗 Repository: <strong>${gc.repoUrl}</strong> · Branch: <strong>${gc.branch || lg.branch || 'main'}</strong>`;
  else if (lg.hasGit && lg.remote) repoLabel = `🔗 Git remote: <strong>${lg.remote}</strong> · Branch: <strong>${lg.branch || 'main'}</strong>`;
  else if (lg.hasGit) repoLabel = `📁 Local Git repo · Branch: <strong>${lg.branch || 'main'}</strong> · No remote configured`;
  else repoLabel = `📁 Local folder — no Git repository`;

  const pushSection = canPush ? `
    <div class="report-actions" style="margin-top:10px">
      <button class="btn-exp primary" id="cr-btn-push" onclick="handleCRPush()">🚀 Commit &amp; Push Branch</button>
      <button class="btn-exp" id="cr-btn-pr" onclick="handleCRCreatePR()" disabled>🔁 Create Pull Request</button>
    </div>
    ${state.codereview.pushedBranch ? `<div class="success-box" style="margin-top:8px">✓ Branch <strong>${state.codereview.pushedBranch}</strong> pushed</div>` : ''}
  ` : lg.hasGit && lg.remote && !gc?.token ? `
    <div class="info-box" style="border-color:var(--amber);margin-top:10px">⚠ Git remote detected but no PAT provided. Go back to Step 1 and enter a token to enable push.</div>
  ` : `
    <div class="info-box" style="margin-top:10px">Fixes have been applied to your local workspace. No Git remote available for push — test and commit manually.</div>
  `;

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">${repoLabel}</div>
      <div class="report-sec"><div class="report-sec-hdr">${canPush ? 'Commit & Push Fixes' : 'Review Complete'}</div>
        <div class="story-card">
          <div class="story-narrative" style="margin-bottom:8px">${fixes.length} file(s) modified in workspace with ${issueIds.length} fixes. Changes are visible in VS Code.</div>
          <div id="cr-commit-status"></div>
          ${pushSection}
        </div>
      </div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(4)">← Back to Fixes</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

async function handleCRPush() {
  const btn = document.getElementById('cr-btn-push');
  const statusEl = document.getElementById('cr-commit-status');
  if (!btn || !statusEl) return;
  btn.disabled = true;
  btn.textContent = '⏳ Pushing…';
  statusEl.innerHTML = '<div class="info-box">🔄 Committing and pushing branch…</div>';

  const gc = state.codereview.gitConfig || {};
  const issueIds = (state.codereview.fixes || []).flatMap((f) => f.issues_fixed || []);

  try {
    const result = await apiPost('/api/git/push', {
      clonedPath: state.codereview.clonedPath,
      storyIds: issueIds,
      generatedFiles: {},
      token: gc.token,
      repoUrl: gc.repoUrl,
      commitMessage: `fix: AI code review fixes for ${issueIds.join(', ')} [AADP Code Review Agent]`,
      branchPrefix: 'codereview'
    });
    state.codereview.pushedBranch = result.branch;
    statusEl.innerHTML = `<div class="success-box">✓ Branch <strong>${result.branch}</strong> pushed to origin.</div>`;
    btn.textContent = '✓ Pushed';
    const prBtn = document.getElementById('cr-btn-pr');
    if (prBtn) prBtn.disabled = false;
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '🚀 Push Branch';
  }
}

async function handleCRCreatePR() {
  const btn = document.getElementById('cr-btn-pr');
  const statusEl = document.getElementById('cr-commit-status');
  if (!btn || !statusEl) return;
  btn.disabled = true;
  btn.textContent = '⏳ Creating PR…';
  statusEl.innerHTML = '<div class="info-box">🔄 Opening pull request on GitHub…</div>';

  const gc = state.codereview.gitConfig || {};
  const issueIds = (state.codereview.fixes || []).flatMap((f) => f.issues_fixed || []);

  try {
    const result = await apiPost('/api/git/pr', {
      repoUrl: gc.repoUrl,
      token: gc.token,
      branch: state.codereview.pushedBranch,
      baseBranch: gc.branch,
      title: `fix: AI code review fixes — ${issueIds.length} issues resolved`,
      body: `## Code Review Fixes\n\nAutomatically generated by AADP Code Review Agent.\n\n### Issues Fixed\n${issueIds.map(id => `- ${id}`).join('\n')}\n`
    });
    statusEl.innerHTML = `<div class="success-box">✓ PR <strong>#${result.prNumber}</strong> created — <a href="${result.prUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${result.prUrl}</a></div>`;
    btn.textContent = `✓ PR #${result.prNumber}`;
  } catch (err) {
    statusEl.innerHTML = `<div class="error-box">⚠ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = '🔁 Create Pull Request';
  }
}

// ============================================================
//  SECURITY AGENT
// ============================================================
async function renderSecurityStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading security scan targets…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/security-agent/items');
    state.security.items = result.items || [];
  } catch {
    state.security.items = [];
  }
  state.security.selectedIds = [];
  const typeIcon = { architecture: '🏗️', code: '⚙️', iac: '☸', container: '🐳', config: '⚡' };
  const html = state.security.items
    .map(
      (item) =>
        `<div class="epic-item" id="security-${item.id}" onclick="toggleItemSelection('security','${item.id}')"><div class="epic-chk" id="security-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="card-tag">${typeIcon[item.type] || '🔒'} ${item.type}</span><span class="card-tag">${item.source}</span><span class="epill p-medium">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select artifacts to scan — performs STRIDE threat modeling, SAST/DAST, container CVE scanning, OWASP Top 10 checks, and IaC security review.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.security.items.length} TARGETS</span><button class="btn-exp" onclick="selectAllItems('security')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">STRIDE · Semgrep · Trivy · OWASP</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Run Security Scan →</button>`;
}

function renderSecurityStep2() {
  const ids = state.security.selectedIds;
  renderProgressList('security', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} targets selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'security',
    () => apiPost('/api/security-agent/generate', { itemIds: ids }),
    (result) => {
      state.security.reportData = result.security;
      state.security.reportSource = result.source;
    }
  );
}

function renderSecurityStep3() {
  const data = state.security.reportData;
  if (!data) return;
  const tm = data.threat_model || {};
  const scorecard = data.scorecard || {};
  const sast = data.sast_findings || {};
  const container = data.container_scan || {};
  const owasp = data.owasp_compliance || {};

  const threatsHtml = (tm.threats || [])
    .map((t) => `<div class="story-card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="story-id">${t.id}</div><div style="display:flex;gap:4px"><span class="epill ${t.risk_level === 'High' ? 'p-high' : t.risk_level === 'Critical' ? 'p-critical' : 'p-medium'}">${t.risk_level}</span><span class="card-tag">${t.category}</span></div></div><div class="story-title">${t.component}</div><div class="story-narrative">${escapeHtml(t.description)}</div><div class="ac-item" style="margin-top:4px">✓ ${escapeHtml(t.mitigation)}</div></div>`)
    .join('');

  const owaspHtml = (owasp.checks || [])
    .map((c) => `<div class="sprint-row"><span class="epill ${c.status === 'Pass' ? 'p-medium' : c.status === 'Warning' ? 'p-high' : 'p-critical'}">${c.status}</span><span style="flex:1;margin-left:8px">${c.category}</span></div>`)
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Security assessment complete (${state.security.reportSource === 'llm' ? 'LLM' : 'Mock'}) — Risk: ${scorecard.risk_level || scorecard.overall_risk || '—'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Security Scorecard</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${scorecard.overall_score || '—'}</div><div class="stat-lbl">Score</div></div>
          <div class="stat-card"><div class="stat-val">${(tm.threats || []).filter((t) => t.risk_level === 'High' || t.risk_level === 'Critical').length}</div><div class="stat-lbl">High/Crit Threats</div></div>
          <div class="stat-card"><div class="stat-val">${sast.critical_findings || sast.findings?.filter?.((f) => f.severity === 'Critical')?.length || 0}</div><div class="stat-lbl">SAST Critical</div></div>
          <div class="stat-card"><div class="stat-val">${container.critical_cves || 0}</div><div class="stat-lbl">Critical CVEs</div></div>
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">STRIDE Threat Model — ${tm.title || ''} (${(tm.threats || []).length} threats)</div>${threatsHtml}</div>

      ${owaspHtml ? `<div class="report-sec"><div class="report-sec-hdr">OWASP Top 10 Compliance</div><div class="sprint-rows">${owaspHtml}</div></div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Security report filed to Jira (simulated)')">🔗 File to Jira</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email Security Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Scan different artifacts</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  DOCUMENTATION AGENT
// ============================================================
async function renderDocStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading documentation sources…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/doc-agent/items');
    state.doc.items = result.items || [];
  } catch {
    state.doc.items = [];
  }
  state.doc.selectedIds = [];
  const typeIcon = { stories: '📋', architecture: '🏗️', api_spec: '📡', code: '⚙️', deployment: '🚀', monitoring: '🔎' };
  const html = state.doc.items
    .map(
      (item) =>
        `<div class="epic-item" id="doc-${item.id}" onclick="toggleItemSelection('doc','${item.id}')"><div class="epic-chk" id="doc-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="card-tag">${typeIcon[item.type] || '📄'} ${item.type}</span><span class="card-tag">${item.source}</span><span class="epill p-medium">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select sources to document — generates API reference, runbooks, architecture wiki pages, release notes, and onboarding guides.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.doc.items.length} SOURCES</span><button class="btn-exp" onclick="selectAllItems('doc')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">Confluence · Markdown · OpenAPI Docs</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Generate Docs →</button>`;
}

function renderDocStep2() {
  const ids = state.doc.selectedIds;
  renderProgressList('doc', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} sources selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'doc',
    () => apiPost('/api/doc-agent/generate', { itemIds: ids }),
    (result) => {
      state.doc.reportData = result.documentation;
      state.doc.reportSource = result.source;
    }
  );
}

function renderDocStep3() {
  const data = state.doc.reportData;
  if (!data) return;
  const api = data.api_docs || {};
  const runbooks = data.runbooks || [];
  const wikiPages = data.wiki_pages || [];
  const releaseNotes = data.release_notes || {};
  const onboarding = data.onboarding || {};

  const endpointsHtml = (api.endpoints || [])
    .map((group) => `<div style="margin-bottom:10px"><div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:4px">${group.group}</div>${(group.endpoints || []).map((ep) => `<div class="sprint-row"><span class="kw" style="min-width:45px;text-align:center">${ep.method}</span><span style="flex:1;margin-left:8px;font-family:var(--mono);font-size:11px">${ep.path}</span><span style="font-size:10px;color:var(--text3)">${ep.summary}</span></div>`).join('')}</div>`)
    .join('');

  const runbooksHtml = runbooks
    .map((rb) => `<div class="story-card" style="margin-bottom:8px"><div class="story-id">${rb.id}</div><div class="story-title">${rb.title}</div><div class="epic-meta"><span class="card-tag">${rb.service}</span></div></div>`)
    .join('');

  const wikiHtml = wikiPages
    .map((p) => `<div class="sprint-row"><span class="card-tag">${p.type || p.space || 'Wiki'}</span><span style="flex:1;margin-left:8px">${p.title || p.page_title}</span></div>`)
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Documentation generated (${state.doc.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${runbooks.length} runbooks · ${wikiPages.length} wiki pages</div>

      <div class="report-sec"><div class="report-sec-hdr">API Reference — ${api.title || ''} (${api.version || ''})</div>
        <div class="story-card" style="margin-bottom:10px"><div class="epic-meta"><span class="card-tag">Base URL: ${api.base_url || '—'}</span><span class="card-tag">Auth: ${api.authentication || '—'}</span></div></div>
        ${endpointsHtml}
      </div>

      ${runbooksHtml ? `<div class="report-sec"><div class="report-sec-hdr">Operational Runbooks (${runbooks.length})</div>${runbooksHtml}</div>` : ''}

      ${wikiHtml ? `<div class="report-sec"><div class="report-sec-hdr">Architecture Wiki Pages (${wikiPages.length})</div><div class="sprint-rows">${wikiHtml}</div></div>` : ''}

      ${releaseNotes.version ? `<div class="report-sec"><div class="report-sec-hdr">Release Notes — ${releaseNotes.version || ''}</div><div class="story-card"><div class="story-narrative">${releaseNotes.summary || ''}</div></div></div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Published to Confluence (simulated)')">📄 Publish to Confluence</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Select different sources</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  RELEASE MANAGEMENT AGENT
// ============================================================
async function renderReleaseStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading release signals…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/release-agent/items');
    state.release.items = result.items || [];
  } catch {
    state.release.items = [];
  }
  state.release.selectedIds = [];
  const statusColor = { Complete: 'var(--accent)', Approved: 'var(--accent)', 'In Progress': 'var(--amber)' };
  const html = state.release.items
    .map(
      (item) =>
        `<div class="epic-item" id="release-${item.id}" onclick="toggleItemSelection('release','${item.id}')"><div class="epic-chk" id="release-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="card-tag">${item.type}</span><span class="card-tag">${item.source}</span><span class="epill" style="background:${(statusColor[item.status] || 'var(--text3)')}22;color:${statusColor[item.status] || 'var(--text3)'}">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select release signals — aggregates quality gates, security posture, readiness checklist and generates changelog, go/no-go decision, and stakeholder notifications.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.release.items.length} SIGNALS</span><button class="btn-exp" onclick="selectAllItems('release')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">SemVer · Changelog · Canary · Blue-Green</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Assess Release Readiness →</button>`;
}

function renderReleaseStep2() {
  const ids = state.release.selectedIds;
  renderProgressList('release', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} signals selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'release',
    () => apiPost('/api/release-agent/generate', { itemIds: ids }),
    (result) => {
      state.release.reportData = result.release;
      state.release.reportSource = result.source;
    }
  );
}

function renderReleaseStep3() {
  const data = state.release.reportData;
  if (!data) return;
  const checklist = data.readiness_checklist || {};
  const scorecard = data.scorecard || {};
  const changelog = data.changelog || {};
  const rollback = data.rollback_strategy || {};

  const checkCatsHtml = (checklist.categories || [])
    .map((cat) => {
      const itemsHtml = (cat.items || [])
        .map((item) => `<div class="sprint-row"><span class="epill ${item.status === 'Pass' ? 'p-medium' : item.status === 'Warning' ? 'p-high' : 'p-critical'}">${item.status}</span><span style="flex:1;margin-left:8px">${item.check}</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${item.value}</span></div>`)
        .join('');
      return `<div style="margin-bottom:12px"><div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:6px">${cat.name}</div><div class="sprint-rows">${itemsHtml}</div></div>`;
    })
    .join('');

  const breakdownHtml = (scorecard.breakdown || [])
    .map((b) => `<div class="sprint-row"><span style="flex:1">${b.category}</span><span class="sp-badge">${b.score}/100</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-left:6px">×${b.weight}%</span></div>`)
    .join('');

  const blockersHtml = (scorecard.blocking_items || [])
    .map((b) => `<div class="ac-item"><span class="kw">${b.severity}</span> ${escapeHtml(b.description)} — <em>${b.owner}</em></div>`)
    .join('');

  const changelogHtml = Object.entries(changelog)
    .filter(([k, v]) => Array.isArray(v) && v.length > 0 && k !== 'version' && k !== 'release_date')
    .map(([key, items]) => `<div style="margin-bottom:8px"><div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">${key}</div>${items.map((i) => `<div class="ac-item">${escapeHtml(typeof i === 'string' ? i : i.description || JSON.stringify(i))}</div>`).join('')}</div>`)
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Release assessed (${state.release.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${checklist.version || ''} · Verdict: ${scorecard.verdict || '—'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Release Scorecard</div>
        <div class="stats-grid" style="margin-bottom:10px">
          <div class="stat-card"><div class="stat-val">${scorecard.overall_score || '—'}</div><div class="stat-lbl">Overall Score</div></div>
          <div class="stat-card"><div class="stat-val">${scorecard.verdict || '—'}</div><div class="stat-lbl">Verdict</div></div>
          <div class="stat-card"><div class="stat-val">${(scorecard.blocking_items || []).length}</div><div class="stat-lbl">Blockers</div></div>
          <div class="stat-card"><div class="stat-val">${checklist.target_date || '—'}</div><div class="stat-lbl">Target Date</div></div>
        </div>
        ${blockersHtml ? `<div class="ac-list">${blockersHtml}</div>` : ''}
        <div class="sprint-rows" style="margin-top:8px">${breakdownHtml}</div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Readiness Checklist — ${checklist.title || ''}</div>${checkCatsHtml}</div>

      ${changelogHtml ? `<div class="report-sec"><div class="report-sec-hdr">Changelog — ${changelog.version || ''}</div>${changelogHtml}</div>` : ''}

      ${rollback.strategy ? `<div class="report-sec"><div class="report-sec-hdr">Rollback Strategy</div><div class="story-card"><div class="story-title">${rollback.strategy || ''}</div><div class="story-narrative">${rollback.description || ''}</div></div></div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export PDF</button><button class="btn-exp" onclick="alert('Stakeholders notified (simulated)')">✉ Notify Stakeholders</button><button class="btn-exp" onclick="alert('Release tagged in GitHub (simulated)')">🏷 Tag Release</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Select different signals</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  COMPLIANCE AGENT
// ============================================================
async function renderComplianceStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading compliance sources…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/compliance-agent/items');
    state.compliance.items = result.items || [];
  } catch {
    state.compliance.items = [];
  }
  state.compliance.selectedIds = [];
  const typeIcon = { architecture: '🏗️', code: '⚙️', security: '🔒', test_results: '🧪', deployment: '🚀', review: '✅' };
  const html = state.compliance.items
    .map(
      (item) =>
        `<div class="epic-item" id="compliance-${item.id}" onclick="toggleItemSelection('compliance','${item.id}')"><div class="epic-chk" id="compliance-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="card-tag">${typeIcon[item.type] || '📄'} ${item.type}</span><span class="card-tag">${item.source}</span><span class="epill p-medium">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select compliance sources — maps to SOC 2, GDPR, FCC/3GPP regulations, generates audit trail, enforces policies, and packages evidence.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.compliance.items.length} SOURCES</span><button class="btn-exp" onclick="selectAllItems('compliance')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">SOC 2 · GDPR · 3GPP · Audit</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Assess Compliance →</button>`;
}

function renderComplianceStep2() {
  const ids = state.compliance.selectedIds;
  renderProgressList('compliance', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} sources selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'compliance',
    () => apiPost('/api/compliance-agent/generate', { itemIds: ids }),
    (result) => {
      state.compliance.reportData = result.compliance;
      state.compliance.reportSource = result.source;
    }
  );
}

function renderComplianceStep3() {
  const data = state.compliance.reportData;
  if (!data) return;
  const regMap = data.regulatory_mapping || {};
  const auditTrail = data.audit_trail || {};

  const frameworksHtml = (regMap.frameworks || [])
    .map((fw) => {
      const controlsHtml = (fw.controls || [])
        .map((c) => `<div class="sprint-row"><span class="epill ${c.status === 'Pass' ? 'p-medium' : c.status === 'Warning' ? 'p-high' : 'p-critical'}">${c.status}</span><span style="flex:1;margin-left:8px"><strong>${c.id}</strong> ${c.name}</span><span style="font-size:10px;color:var(--text3);max-width:200px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.evidence || '')}</span></div>`)
        .join('');
      return `<div class="story-card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div class="story-title">${fw.name}</div><div style="display:flex;gap:6px"><span class="epill ${fw.status === 'Compliant' ? 'p-medium' : 'p-high'}">${fw.status}</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${fw.controls_passed}/${fw.controls_assessed} controls</span></div></div><div class="sprint-rows">${controlsHtml}</div></div>`;
    })
    .join('');

  const auditHtml = (auditTrail.entries || [])
    .map((e) => `<div class="sprint-row"><span style="font-family:var(--mono);font-size:10px;color:var(--text3);min-width:160px">${e.timestamp?.replace('T', ' ').replace('Z', '')}</span><span class="card-tag" style="margin:0 6px">${e.actor}</span><span style="flex:1">${e.action}</span><span class="epill p-medium" style="font-size:9px">${e.approval || '—'}</span></div>`)
    .join('');

  const passedFrameworks = (regMap.frameworks || []).filter((f) => f.status === 'Compliant').length;
  const totalFrameworks = (regMap.frameworks || []).length;

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Compliance assessed (${state.compliance.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${passedFrameworks}/${totalFrameworks} frameworks compliant</div>

      <div class="report-sec"><div class="report-sec-hdr">Compliance Summary</div>
        <div class="stats-grid">
          ${(regMap.frameworks || []).map((fw) => `<div class="stat-card"><div class="stat-val" style="font-size:14px">${fw.status === 'Compliant' ? '✓' : '⚠'}</div><div class="stat-lbl">${fw.name}</div></div>`).join('')}
        </div>
      </div>

      <div class="report-sec"><div class="report-sec-hdr">Regulatory Mapping — ${regMap.title || ''}</div>${frameworksHtml}</div>

      ${auditHtml ? `<div class="report-sec"><div class="report-sec-hdr">Audit Trail — ${auditTrail.title || ''}</div><div class="sprint-rows">${auditHtml}</div></div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export Audit Bundle</button><button class="btn-exp" onclick="alert('Compliance report filed (simulated)')">📋 File Compliance Report</button><button class="btn-exp" onclick="alert('CAB notification sent (simulated)')">🏛 Notify CAB</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Select different sources</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  PERFORMANCE ENGINEERING AGENT
// ============================================================
async function renderPerfStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading performance sources…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/perf-agent/items');
    state.perf.items = result.items || [];
  } catch {
    state.perf.items = [];
  }
  state.perf.selectedIds = [];
  const typeIcon = { nfrs: '📊', code: '⚙️', api_spec: '📡', metrics: '📈', monitoring: '🔎' };
  const html = state.perf.items
    .map(
      (item) =>
        `<div class="epic-item" id="perf-${item.id}" onclick="toggleItemSelection('perf','${item.id}')"><div class="epic-chk" id="perf-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="card-tag">${typeIcon[item.type] || '⚡'} ${item.type}</span><span class="card-tag">${item.source}</span><span class="epill p-medium">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select sources to analyse — defines performance budgets, generates k6 load test scripts, models capacity, detects bottlenecks, and validates SLA compliance.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.perf.items.length} SOURCES</span><button class="btn-exp" onclick="selectAllItems('perf')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">k6 · Capacity · Bottlenecks · SLA</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Analyse Performance →</button>`;
}

function renderPerfStep2() {
  const ids = state.perf.selectedIds;
  renderProgressList('perf', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} sources selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'perf',
    () => apiPost('/api/perf-agent/generate', { itemIds: ids }),
    (result) => {
      state.perf.reportData = result.perf;
      state.perf.reportSource = result.source;
    }
  );
}

function renderPerfStep3() {
  const data = state.perf.reportData;
  if (!data) return;
  const budget = data.performance_budget || {};
  const loadTest = data.load_test_results || {};
  const bottlenecks = data.bottlenecks || [];
  const capacity = data.capacity_model || {};
  const sla = data.sla_validation || {};

  const endpointsHtml = (budget.endpoints || [])
    .map((ep) => {
      const withinBudget = ep.status === 'Within Budget';
      return `<div class="story-card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-family:var(--mono);font-size:11px">${ep.path}</div><span class="epill ${withinBudget ? 'p-medium' : 'p-high'}">${ep.status}</span></div><div class="stats-grid" style="grid-template-columns:repeat(3,1fr)"><div class="stat-card"><div class="stat-val">${ep.actual_p50}</div><div class="stat-lbl">P50 (tgt: ${ep.target_p50})</div></div><div class="stat-card"><div class="stat-val">${ep.actual_p95}</div><div class="stat-lbl">P95 (tgt: ${ep.target_p95})</div></div><div class="stat-card"><div class="stat-val">${ep.actual_p99}</div><div class="stat-lbl">P99 (tgt: ${ep.target_p99})</div></div></div></div>`;
    })
    .join('');

  const bottlenecksHtml = (bottlenecks || [])
    .map((b) => `<div class="ac-item"><span class="kw">${b.severity || b.impact || 'Medium'}</span> ${escapeHtml(b.description || b.issue || String(b))}</div>`)
    .join('');

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Performance analysed (${state.perf.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${budget.overall_status || 'Analysis complete'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Performance Budget (${(budget.endpoints || []).length} endpoints)</div>${endpointsHtml}</div>

      ${loadTest.tool ? `<div class="report-sec"><div class="report-sec-hdr">Load Test Results — ${loadTest.tool} · ${loadTest.duration}</div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val">${loadTest.virtual_users?.max || loadTest.peak_vus || '—'}</div><div class="stat-lbl">Peak VUs</div></div>
          <div class="stat-card"><div class="stat-val">${loadTest.peak_rps || loadTest.requests_per_second || '—'}</div><div class="stat-lbl">Peak RPS</div></div>
          <div class="stat-card"><div class="stat-val">${loadTest.error_rate || '—'}</div><div class="stat-lbl">Error Rate</div></div>
          <div class="stat-card"><div class="stat-val">${loadTest.passed_thresholds || loadTest.thresholds_passed || '—'}</div><div class="stat-lbl">Thresholds</div></div>
        </div>
      </div>` : ''}

      ${bottlenecksHtml ? `<div class="report-sec"><div class="report-sec-hdr">Detected Bottlenecks (${bottlenecks.length})</div><div class="ac-list">${bottlenecksHtml}</div></div>` : ''}

      ${sla.status ? `<div class="report-sec"><div class="report-sec-hdr">SLA Validation</div><div class="story-card"><div class="story-title">${sla.status}</div><div class="story-narrative">${sla.summary || sla.details || ''}</div></div></div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export Report</button><button class="btn-exp" onclick="alert('k6 scripts exported (simulated)')">⚡ Export k6 Scripts</button><button class="btn-exp" onclick="alert('Email sent (simulated)')">✉ Email to Team</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Select different sources</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  INCIDENT MANAGEMENT AGENT
// ============================================================
async function renderIncidentStep1() {
  document.getElementById('panel-body').innerHTML = '<div class="fadein"><div class="info-box">Loading incident history…</div></div>';
  document.getElementById('panel-ftr').innerHTML = '';
  try {
    const result = await apiGet('/api/incident-agent/items');
    state.incident.items = result.items || [];
  } catch {
    state.incident.items = [];
  }
  state.incident.selectedIds = [];
  const severityColor = { 'SEV-1': 'var(--red)', 'SEV-2': 'var(--red)', 'SEV-3': 'var(--amber)', 'SEV-4': 'var(--text3)' };
  const html = state.incident.items
    .map(
      (item) =>
        `<div class="epic-item" id="incident-${item.id}" onclick="toggleItemSelection('incident','${item.id}')"><div class="epic-chk" id="incident-chk-${item.id}"></div><div style="flex:1"><div class="epic-key">${item.id}</div><div class="epic-summary">${item.title}</div><div class="epic-meta"><span class="epill" style="background:${(severityColor[item.severity] || 'var(--text3)')}22;color:${severityColor[item.severity] || 'var(--text3)'}">${item.severity}</span><span class="card-tag">${item.source}</span><span class="epill p-medium">${item.status}</span></div></div></div>`
    )
    .join('');
  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="info-box">Select incidents to analyse — generates blameless postmortems, tracks action items, identifies recurring patterns, calculates MTTD/MTTR metrics, and suggests runbook updates.</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${state.incident.items.length} INCIDENTS</span><button class="btn-exp" onclick="selectAllItems('incident')" style="padding:4px 10px;font-size:10px;">Select All</button></div>
      ${html}
    </div>`;
  document.getElementById('panel-ftr').innerHTML = `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">Postmortem · MTTR · Pattern Analysis</span><button class="btn btn-primary" id="gen-btn" disabled onclick="goToStep(2)">Analyse Incidents →</button>`;
}

function renderIncidentStep2() {
  const ids = state.incident.selectedIds;
  renderProgressList('incident', `<div style="background:var(--bg2);border:1px solid rgba(0,217,166,0.2);border-radius:8px;padding:11px 13px;margin-bottom:18px;"><div class="epic-key">${ids.length} incidents selected</div><div class="epic-summary">${ids.join(' · ')}</div></div>`);
  runGenAnimation(
    'incident',
    () => apiPost('/api/incident-agent/generate', { incidentIds: ids }),
    (result) => {
      state.incident.reportData = result.incident;
      state.incident.reportSource = result.source;
    }
  );
}

function renderIncidentStep3() {
  const data = state.incident.reportData;
  if (!data) return;
  const pm = data.postmortem || {};
  const actionItems = data.action_items || [];
  const metrics = data.metrics || {};
  const patterns = data.patterns || [];

  const timelineHtml = (pm.timeline || [])
    .map((t) => `<div class="sprint-row"><span style="font-family:var(--mono);font-size:10px;color:var(--text3);min-width:80px">${t.time?.substring(11, 19) || ''}</span><span class="card-tag" style="margin:0 6px">${t.actor}</span><span style="flex:1;font-size:12px">${escapeHtml(t.event)}</span></div>`)
    .join('');

  const actionItemsHtml = actionItems
    .map((ai) => `<div class="story-card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="story-id">${ai.id}</div><div style="display:flex;gap:4px"><span class="epill ${ai.priority === 'P0' ? 'p-critical' : ai.priority === 'P1' ? 'p-high' : 'p-medium'}">${ai.priority}</span><span class="card-tag">${ai.status}</span></div></div><div class="story-title">${escapeHtml(ai.title)}</div><div class="epic-meta"><span class="card-tag">Owner: ${ai.owner}</span><span class="card-tag">Due: ${ai.due_date}</span></div></div>`)
    .join('');

  const rc = pm.root_cause || {};
  const metricsHtml = metrics.mttd || metrics.mttr ? `
    <div class="stats-grid">
      ${metrics.mttd ? `<div class="stat-card"><div class="stat-val">${metrics.mttd}</div><div class="stat-lbl">MTTD</div></div>` : ''}
      ${metrics.mttr ? `<div class="stat-card"><div class="stat-val">${metrics.mttr}</div><div class="stat-lbl">MTTR</div></div>` : ''}
      ${metrics.mtta ? `<div class="stat-card"><div class="stat-val">${metrics.mtta}</div><div class="stat-lbl">MTTA</div></div>` : ''}
    </div>` : '';

  document.getElementById('panel-body').innerHTML = `
    <div class="fadein">
      <div class="jira-banner">✓ Incident analysed (${state.incident.reportSource === 'llm' ? 'LLM' : 'Mock'}) — ${pm.id || ''} · ${pm.severity || ''} · Duration: ${pm.duration || '—'}</div>

      <div class="report-sec"><div class="report-sec-hdr">Postmortem — ${pm.title || ''}</div>
        <div class="story-card">
          <div class="story-narrative" style="margin-bottom:8px">${escapeHtml(pm.impact || '')}</div>
          ${rc.description ? `<div class="ac-item" style="margin-bottom:6px"><strong>Root Cause:</strong> ${escapeHtml(rc.description)}</div>` : ''}
          ${rc.category ? `<div class="epic-meta"><span class="card-tag">Category: ${rc.category}</span></div>` : ''}
        </div>
        ${metricsHtml}
      </div>

      ${timelineHtml ? `<div class="report-sec"><div class="report-sec-hdr">Incident Timeline</div><div class="sprint-rows">${timelineHtml}</div></div>` : ''}

      ${pm.what_went_well?.length ? `<div class="report-sec"><div class="report-sec-hdr">What Went Well</div><div class="ac-list">${(pm.what_went_well || []).map((w) => `<div class="ac-item">✓ ${escapeHtml(w)}</div>`).join('')}</div></div>` : ''}

      ${pm.what_went_wrong?.length ? `<div class="report-sec"><div class="report-sec-hdr">What Went Wrong</div><div class="ac-list">${(pm.what_went_wrong || []).map((w) => `<div class="ac-item">✗ ${escapeHtml(w)}</div>`).join('')}</div></div>` : ''}

      ${actionItemsHtml ? `<div class="report-sec"><div class="report-sec-hdr">Action Items (${actionItems.length})</div>${actionItemsHtml}</div>` : ''}

      <div class="report-sec"><div class="report-sec-hdr">Export & Share</div><div class="report-actions"><button class="btn-exp primary" onclick="exportPDF()">⬇ Export Postmortem</button><button class="btn-exp" onclick="alert('Posted to Confluence (simulated)')">📄 Publish to Confluence</button><button class="btn-exp" onclick="alert('Action items filed to Jira (simulated)')">🔗 File Action Items</button></div></div>
    </div>`;
  document.getElementById('panel-ftr').innerHTML = '<button class="btn btn-ghost" onclick="goToStep(1)">← Analyse different incidents</button><button class="btn btn-primary" onclick="closePanel()">Done ✓</button>';
}

// ============================================================
//  Window Exports
// ============================================================
window.openPanel = openPanel;
window.closePanel = closePanel;
window.goToStep = goToStep;
window.selectAgent = selectAgent;
window.switchDomain = switchDomain;
window.toggleFolder = toggleFolder;
window.handleConnect = handleConnect;
window.selectEpic = selectEpic;
window.selectAllEpics = selectAllEpics;
window.handleGitConnect = handleGitConnect;
window.skipGitConfig = skipGitConfig;
window.handleCloneAndOpen = handleCloneAndOpen;
window.handlePushCode = handlePushCode;
window.handleCreatePR = handleCreatePR;
window.toggleAC = toggleAC;
window.exportPDF = exportPDF;
window.copyPoMarkdown = copyPoMarkdown;
window.publishStoriesToJira = publishStoriesToJira;
window.toggleTheme = toggleTheme;
window.toggleItemSelection = toggleItemSelection;
window.selectAllItems = selectAllItems;
window.openPromptEditor = openPromptEditor;
window.closePromptEditor = closePromptEditor;
window.saveAgentPrompt = saveAgentPrompt;
window.resetAgentPrompt = resetAgentPrompt;
// Code Review Agent functions
window.handleCRGitConnect = handleCRGitConnect;
window.handleCRLocalFolder = handleCRLocalFolder;
window.switchCRTab = switchCRTab;
window.toggleCRFile = toggleCRFile;
window.selectAllCRFiles = selectAllCRFiles;
window.toggleCRIssue = toggleCRIssue;
window.selectAllCRIssues = selectAllCRIssues;
window.handleCRPush = handleCRPush;
window.handleCRCreatePR = handleCRCreatePR;
// DE agent panel functions exposed globally
window.openDePanel = openDePanel;
window.closeDePanel = closeDePanel;
window.deGo = deGo;

initializeTheme();
