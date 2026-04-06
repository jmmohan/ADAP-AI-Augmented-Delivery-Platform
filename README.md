# AADP — AI-Augmented Delivery Platform

An end-to-end AI-powered software delivery platform that orchestrates **14 specialized agents** across the full engineering lifecycle — from epic intake to production monitoring, security, compliance, and release management. Each agent connects to your toolchain, reasons over your data with AI models, and produces structured, auditable artifacts with human-in-the-loop gates at every stage.

Built for large-scale engineering organisations (800+ engineers) operating within SAFe / Agile frameworks and telecom-grade compliance requirements.

## Why AADP?

Traditional delivery workflows are fragmented across dozens of tools — Jira, Confluence, GitHub, Jenkins, Datadog, PagerDuty — with manual handoffs at every stage. AADP unifies these into a single intelligent pipeline:

- **PO writes an epic** → stories, estimates, sprint plans, and risk registers are generated in seconds
- **Stories get approved** → architecture specs, ADRs, and OpenAPI contracts materialise automatically
- **Specs are finalised** → test strategies, BDD scenarios, and automation scripts are scaffolded
- **Tests pass** → production-grade code with unit tests and static analysis is generated
- **Code merges** → CI/CD pipelines orchestrate deployment with automated smoke and regression testing
- **Code is reviewed** → principal architect and senior reviewer assess architecture and code quality
- **Security scanned** → threat models, SAST results, OWASP checks, and container security are produced
- **Compliance validated** → regulatory frameworks, audit trails, and evidence packages are generated
- **Performance profiled** → load tests, capacity plans, and SLA validations are run
- **Incidents managed** → postmortems, action items, pattern analysis, and runbook updates are automated
- **Documentation generated** → API docs, runbooks, release notes, and architecture wikis are published
- **Release approved** → readiness scorecard, changelog, and rollback decisions are assembled
- **Services go live** → anomalies are detected, traces correlated, RCA performed, and fixes recommended

Each step produces structured artifacts that feed into the next agent, creating a continuous delivery intelligence loop.

## Agent Registry

| # | Agent | Role | What It Does | Key Outputs |
|---|-------|------|-------------|-------------|
| 1 | **Product Owner** | PO / Delivery | Reads Jira epics, decomposes into INVEST-compliant user stories | User stories, story points, acceptance criteria (Gherkin), sprint plan, risk register |
| 2 | **Arch & Tech Spec** | Principal Architect | Generates architecture specifications from approved stories | HLD, LLD, ADRs, OpenAPI 3.0 contracts, Mermaid diagrams (system context + sequence) |
| 3 | **Test Planning** | QA Architect | Creates comprehensive test plans from stories and acceptance criteria | Test strategy, test suites, BDD scenarios, Playwright/Pytest/Jest automation scripts |
| 4 | **Code Generation** | Staff Engineer | Scaffolds production code with tests and static analysis | NestJS scaffold, service implementations, unit tests, PR summary, SonarQube report |
| 5 | **Deployment** | DevOps / SRE | Orchestrates CI/CD pipelines and deploys to target environments | Pipeline execution (5 stages), environment config, smoke/regression/perf results, rollback plan |
| 6 | **Monitoring & Triage** | Senior SRE | Detects anomalies, correlates signals, performs root cause analysis | Anomaly alerts, distributed traces, RCA with timeline, fix recommendations, auto-created Jira defects |
| 7 | **Review** | Principal Architect + Senior Reviewer | Performs architecture review and code review with scoring | Arch verdict + score, code verdict + score, static analysis violations, compliance checks |
| 8 | **Security** | Senior Security Engineer | Threat modelling, SAST, container security, OWASP compliance | STRIDE threat model, SAST findings, container CVEs, OWASP checklist, IaC review |
| 9 | **Compliance** | Compliance Officer | Assesses delivery artifacts across regulatory frameworks | Regulatory mapping, audit trail, policy enforcement, licence audit, evidence package, change request |
| 10 | **Performance** | Performance Engineer | Analyses NFRs, APIs, and metrics for capacity planning | Performance budget, load test results, capacity plan, bottleneck analysis, cost optimisation, SLA validation |
| 11 | **Incident** | SRE / Incident Manager | Analyses incidents and generates postmortem reports | Postmortem, action items, pattern analysis, MTTD/MTTR metrics, runbook updates |
| 12 | **Documentation** | Senior Technical Writer | Generates comprehensive docs from delivery artifacts | API docs, runbooks, release notes, architecture wiki, decision log |
| 13 | **Release** | Release Manager | Assesses release readiness across all quality gates | Readiness checklist, scorecard, changelog, version recommendation, notification drafts, rollback decision |
| 14 | **Git Integration** | DevOps Utility | Manages GitHub repo operations (clone, commit, push, PR) | Repo validation, clone confirmation, commit + push, PR number and URL |

## Architecture

```
frontend/
  index.html              App shell — sidebar nav, agent cards, slide-over panel
  assets/
    app.js                State management, agent flows, API orchestration (1100+ lines)
    styles.css            Design system — dark/light themes, CSS custom properties

backend/src/
  server.js               Express server — route registration, static hosting
  config.js               Environment config (port, API keys, model selection)
  routes/
    poAgentRoutes.js          PO Agent endpoints
    archAgentRoutes.js        Architecture Agent endpoints
    testAgentRoutes.js        Test Planning Agent endpoints
    codeAgentRoutes.js        Code Generation Agent endpoints
    deployAgentRoutes.js      Deployment Agent endpoints
    monitorAgentRoutes.js     Monitoring & Triage Agent endpoints
    reviewAgentRoutes.js      Review Agent endpoints
    securityAgentRoutes.js    Security Agent endpoints
    complianceAgentRoutes.js  Compliance Agent endpoints
    perfAgentRoutes.js        Performance Agent endpoints
    incidentAgentRoutes.js    Incident Agent endpoints
    docAgentRoutes.js         Documentation Agent endpoints
    releaseAgentRoutes.js     Release Agent endpoints
    gitRoutes.js              Git Integration endpoints
  controllers/            Request handlers (one per agent)
  services/               Business logic + Azure AI / GitHub Models integration (one per agent)
  data/                   Mock data generators (one per agent)
  utils/
    markdownExporter.js   Markdown export utility
```

Each agent follows the same layered pattern: **Route → Controller → Service → Mock Data / LLM**. When a GitHub token is configured, agents call Azure AI (GitHub Models) for generation; otherwise they return high-fidelity mock data so the platform is fully functional without any external dependencies.

## API Endpoints

### PO Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/po-agent/connect` | Validate Jira connection credentials |
| `GET` | `/api/po-agent/epics` | List available epics |
| `POST` | `/api/po-agent/generate` | Generate story decomposition from epic |
| `POST` | `/api/po-agent/export/markdown` | Export report as markdown |

### Arch & Tech Spec Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/arch-agent/stories` | List user stories for architecture input |
| `POST` | `/api/arch-agent/generate` | Generate architecture specification |

### Test Planning Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/test-agent/stories` | List stories with acceptance criteria |
| `POST` | `/api/test-agent/generate` | Generate test plan |

### Code Generation Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/code-agent/stories` | List stories for implementation |
| `POST` | `/api/code-agent/generate` | Generate code scaffold |

### Deployment Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/deploy-agent/artifacts` | List build artifacts |
| `POST` | `/api/deploy-agent/generate` | Generate deployment report |

### Monitoring & Triage Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/monitor-agent/services` | List monitored services |
| `POST` | `/api/monitor-agent/generate` | Generate triage report |

### Review Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/review-agent/items` | List architecture and code items for review |
| `POST` | `/api/review-agent/generate` | Generate architecture and code review report |

### Security Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/security-agent/items` | List security assessment artifacts |
| `POST` | `/api/security-agent/generate` | Generate comprehensive security assessment |

### Compliance Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/compliance-agent/items` | List compliance input items |
| `POST` | `/api/compliance-agent/generate` | Generate compliance report |

### Performance Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/perf-agent/items` | List available performance artifacts |
| `POST` | `/api/perf-agent/generate` | Generate performance analysis and capacity plan |

### Incident Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/incident-agent/items` | List available incidents |
| `POST` | `/api/incident-agent/generate` | Generate incident postmortem and analysis |

### Documentation Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/doc-agent/items` | List available documentation source items |
| `POST` | `/api/doc-agent/generate` | Generate comprehensive documentation |

### Release Agent
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/release-agent/items` | List release readiness signals |
| `POST` | `/api/release-agent/generate` | Generate release readiness report |

### Git Integration
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/git/validate` | Validate GitHub repo access with credentials |
| `POST` | `/api/git/clone` | Clone repository and open in VS Code |
| `POST` | `/api/git/push` | Write generated files, commit, and push new branch |
| `POST` | `/api/git/pr` | Create GitHub Pull Request |

## Agent Details

### 1. Product Owner Agent
**Role:** Product Owner / Delivery Lead

Integrates with Jira to validate project credentials, list epics, and decompose selected epics into INVEST-compliant user stories. Produces all sprint-level planning artifacts needed to begin an engineering cycle.

**Inputs:** Jira project URL, API token, epic key  
**Outputs:**
- User stories with story points and priority
- Acceptance criteria in Gherkin format
- Sprint plan with capacity allocation
- Risk register with mitigation strategies

---

### 2. Architecture & Tech Spec Agent
**Role:** Principal Architect

Transforms approved user stories into a full architecture specification. Generates both high-level and low-level design documents, Architecture Decision Records, and OpenAPI contracts. Produces Mermaid diagrams for system context and sequence flows.

**Inputs:** Selected user stories with story points and priority  
**Outputs:**
- High-Level Design (HLD): architecture style, components, integration patterns, NFRs
- Low-Level Design (LLD): modules, API endpoints, database entities
- Architecture Decision Records (ADRs)
- OpenAPI 3.0 contract snippet (YAML)
- Mermaid diagrams: system context + key sequence flows

---

### 3. Test Planning Agent
**Role:** Senior QA Architect

Generates a comprehensive test strategy covering all test levels (unit, integration, E2E, performance, security, accessibility). Produces BDD scenarios directly from acceptance criteria and scaffolds automation scripts in multiple frameworks.

**Inputs:** User stories with acceptance criteria  
**Outputs:**
- Test strategy: approach, test levels, tools, coverage target, environments
- Test suites with individual test cases and expected results
- BDD scenarios in Given/When/Then format
- Automation snippets: Playwright (E2E), Pytest (API), Jest (unit)
- Summary: total test count and estimated execution time

---

### 4. Code Generation Agent
**Role:** Senior Staff Engineer

Scaffolds production-ready code based on user stories. Generates NestJS project structure, service implementations, unit tests, and a detailed PR summary. Runs simulated SonarQube static analysis and reports quality gate results.

**Inputs:** User stories with story points and priority  
**Outputs:**
- Project scaffold: directory structure, tech stack, file/line counts
- Service code snippets with language and description
- Unit tests per framework (Jest) with test counts
- PR summary: title, description, files changed, suggested reviewers, labels
- Static analysis report: quality gates, metrics (coverage, duplication, complexity), issues

---

### 5. Deployment Agent
**Role:** Senior DevOps / SRE Engineer

Orchestrates a 5-stage CI/CD pipeline (build → test → scan → deploy → verify) and produces a complete deployment report for the QA environment. Includes environment configuration, test results, and rollback plan.

**Inputs:** Container artifacts with versions and Helm chart references  
**Outputs:**
- Pipeline report: id, trigger, status, duration, per-stage results
- Environment config: cluster, namespace, replica counts, image tags, service endpoints
- Test results: smoke, regression, performance pass/fail breakdown
- Rollback plan with procedure and estimated recovery time

---

### 6. Monitoring & Triage Agent
**Role:** Senior SRE

Analyses the health of live services and generates an incident triage report. Correlates anomalies across services, performs root cause analysis, and produces actionable fix recommendations including code-level suggestions. Auto-creates Jira defect templates.

**Inputs:** Service status, uptime metrics, health indicators  
**Outputs:**
- Anomaly alerts: service, severity, metric, threshold, current value
- Distributed traces across the request path
- Root cause analysis: probable cause, confidence %, evidence, affected services, timeline
- Service correlation map
- Fix recommendations with code snippets
- Jira defect templates (ready to file)

---

### 7. Review Agent
**Role:** Principal Architect + Senior Code Reviewer

Performs a dual-track review: architecture review assessing HLD/LLD/ADRs against design principles, and code review assessing generated code against quality standards. Produces scored verdicts with categorised findings.

**Inputs:** Architecture specs, ADRs, generated code, unit tests  
**Outputs:**
- Architecture review: verdict (Approved / Approved with Conditions / Rejected), score /100, findings by category
- Code review: verdict, score /100, static analysis violations (critical, major, minor)
- Compliance checks against coding standards and architecture principles
- Overall assessment summary

---

### 8. Security Agent
**Role:** Senior Security Engineer

Performs a comprehensive security assessment across the delivery artifact set. Executes STRIDE threat modelling, SAST analysis, container image scanning, OWASP Top 10 verification, and Infrastructure-as-Code review.

**Inputs:** Architecture specs, generated code, Helm / Kubernetes manifests, container images, API gateway configs  
**Outputs:**
- STRIDE threat model with mitigations
- SAST findings: severity, rule, file, line, description
- Container security: image, base OS, CVE count by severity, fixable count
- OWASP Top 10 checklist with pass/fail/partial status
- IaC review findings for Helm charts and K8s manifests

---

### 9. Compliance Agent
**Role:** Compliance & Governance Officer

Assesses the full set of delivery artifacts against applicable regulatory frameworks (TMForum, GDPR, SOC 2, telecom-specific standards). Produces a complete audit package ready for governance review.

**Inputs:** Architecture specs, generated code, security assessments, test results, deployment configs, review scorecards  
**Outputs:**
- Regulatory mapping: frameworks with control-by-control assessment
- Audit trail: timestamped compliance entries
- Policy enforcement report
- Licence audit: third-party dependency licence classification
- Change request with justification
- Evidence package: supporting documents ready for auditors

---

### 10. Performance Agent
**Role:** Senior Performance Engineer

Analyses NFRs, API specs, deployment metrics, and production monitoring data to produce a comprehensive performance engineering report with capacity planning recommendations.

**Inputs:** Architecture NFRs, generated code, OpenAPI specs, deployment metrics, production monitoring data  
**Outputs:**
- Performance budget: per-endpoint latency and throughput targets
- Load test results: scenarios, scripts (k6 / Gatling), pass/fail
- Capacity plan: projected resource needs at 1×, 2×, 5× traffic
- Bottleneck analysis: identified hotspots and root causes
- Cost optimisation recommendations
- SLA validation: current vs. target SLA compliance

---

### 11. Incident Agent
**Role:** Senior SRE / Incident Manager

Deep-dives into historical and active incident records to produce structured postmortems, extract recurring patterns, and drive continuous improvement actions.

**Inputs:** Incident records with severity, status, timestamps, and affected services  
**Outputs:**
- Postmortem: detection timeline, root cause, customer impact, lessons learned
- Action items with owners, priorities, and due dates
- Pattern analysis: recurring failure modes and systemic risks
- MTTD / MTTR metrics and trend analysis
- Runbook update recommendations

---

### 12. Documentation Agent
**Role:** Senior Technical Writer

Generates a complete documentation suite from the full set of delivery artifacts. Produces developer-facing API docs, operations runbooks, audience-ready release notes, and a Confluence-compatible architecture wiki.

**Inputs:** User stories, architecture specs, OpenAPI contracts, generated code, deployment configs, monitoring reports  
**Outputs:**
- API documentation: endpoints grouped by category with examples
- Operations runbooks: step-by-step procedures for key operational tasks
- Release notes: features, bug fixes, breaking changes, upgrade guide
- Architecture wiki pages (Confluence-compatible)
- Decision log: cross-referenced ADR entries

---

### 13. Release Agent
**Role:** Release Manager

Aggregates signals from all preceding agents (QA, test, architecture, security, quality, compliance) to produce a unified release readiness assessment. Generates the changelog, version recommendation, and stakeholder notification drafts.

**Inputs:** QA deployment reports, test execution results, architecture review verdicts, security assessments, code quality metrics, compliance matrices  
**Outputs:**
- Readiness checklist: categories (functional, non-functional, security, compliance, ops) with item-level status
- Scorecard: overall score, breakdown by category, blocking items, conditions
- Changelog with sections (features, fixes, performance, security, deprecations)
- Semantic version recommendation with rationale
- Notification drafts for engineering, product, and executive audiences
- Rollback decision: go / no-go with reasoning

---

### 14. Git Integration
**Role:** DevOps Utility

Handles all GitHub repository operations as a service layer — validating credentials, cloning repositories, writing generated files to disk, committing and pushing to a feature branch, and creating Pull Requests.

**Inputs:** Repository URL, GitHub PAT, branch names, story IDs, generated file content, commit messages  
**Outputs:**
- Repository validation status and permissions check
- Clone confirmation with local path and branch info
- Commit hash, push confirmation, and remote branch URL
- Pull Request number, URL, title, and state

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ (ES Modules) |
| Backend | Express.js 4 |
| Frontend | Vanilla JavaScript — no build step, no framework |
| AI Backbone | Azure AI — GitHub Models (GPT-4o via OpenAI SDK) |
| Styling | CSS custom properties, IBM Plex Mono + DM Sans |
| Theming | Dark mode (default) + light mode with localStorage persistence |

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "AI Engineering Platform"

# Install dependencies
npm install

# Copy environment template
copy .env.example .env
```

### Configuration

Edit `.env` to configure:

```env
PORT=3000                              # Server port
NODE_ENV=development                   # Environment
GITHUB_TOKEN=                          # Optional — leave empty for mock mode
DEFAULT_MODEL=gpt-4o                   # Model for generation
```

### Run

```bash
# Development (hot reload)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser.

### Mock Mode vs LLM Mode

- **Without `GITHUB_TOKEN`**: All agents return rich, pre-built mock data. The platform is fully functional and demonstrates the complete workflow without any API costs.
- **With `GITHUB_TOKEN`**: Agents call Azure AI (GitHub Models) to generate real artifacts. If an API call fails, the agent gracefully falls back to mock data.

## Usage

1. **Select an agent** from the sidebar or click its card on the home screen
2. **Select input items** — epics, stories, artifacts, or services depending on the agent
3. **Generate** — watch the animated progress as the agent reasons through each step
4. **Review the report** — explore structured outputs with expandable sections
5. **Export** — PDF, markdown, or simulate publishing to Jira / Confluence / Slack

## Design Principles

- **Mock-first development** — every agent works without external dependencies, making the platform easy to demo, test, and extend
- **Adapter-ready architecture** — replacing mock data with real Jira MCP, GitHub, or Datadog integrations is a matter of swapping service adapters
- **Human-in-the-loop** — agents produce artifacts for review, not autonomous execution; every output has an approval gate
- **Domain-specific AI** — prompts are tuned for telecom engineering (5G, network slicing, BSS, TMForum) and SAFe methodology
- **Progressive disclosure** — agents chain together conceptually (PO → Arch → Test → Code → Deploy → Review → Security → Compliance → Perf → Incident → Docs → Release → Monitor) but each works independently

## License

Internal use only.
