export function buildMockComplianceReport(items) {
  return {
    regulatory_mapping: {
      title: 'Regulatory Compliance Matrix — 5G Slice Platform',
      frameworks: [
        {
          name: 'SOC 2 Type II',
          status: 'Compliant',
          controls_assessed: 12,
          controls_passed: 11,
          controls_failed: 1,
          controls: [
            { id: 'CC6.1', name: 'Logical & Physical Access Controls', status: 'Pass', evidence: 'RBAC enforced via NestJS guards, JWT auth with RS256, tenant schema isolation' },
            { id: 'CC6.2', name: 'System Access Restrictions', status: 'Pass', evidence: 'API rate limiting per SLA tier, IP whitelisting on admin endpoints' },
            { id: 'CC6.3', name: 'Encryption of Data', status: 'Pass', evidence: 'TLS 1.3 in transit, AES-256 at rest via PostgreSQL TDE, mTLS between services' },
            { id: 'CC7.1', name: 'Monitoring Activities', status: 'Pass', evidence: 'Datadog APM, ELK centralized logging, Jaeger distributed tracing, PagerDuty alerting' },
            { id: 'CC7.2', name: 'Anomaly Detection', status: 'Pass', evidence: 'Monitor Agent provides automated anomaly detection with RCA capabilities' },
            { id: 'CC8.1', name: 'Change Management', status: 'Warning', evidence: 'CI/CD pipeline enforced, but formal CAB approval process not yet automated' }
          ]
        },
        {
          name: 'GDPR',
          status: 'Partially Compliant',
          controls_assessed: 8,
          controls_passed: 6,
          controls_failed: 2,
          controls: [
            { id: 'Art.25', name: 'Data Protection by Design', status: 'Pass', evidence: 'Schema-per-tenant isolation, minimal data collection, encryption at rest and in transit' },
            { id: 'Art.30', name: 'Records of Processing', status: 'Pass', evidence: 'Event sourcing provides complete processing audit trail for all slice operations' },
            { id: 'Art.32', name: 'Security of Processing', status: 'Pass', evidence: 'RBAC, encryption, secure key management via HashiCorp Vault' },
            { id: 'Art.17', name: 'Right to Erasure', status: 'Fail', evidence: 'Event sourcing makes data deletion complex — need tombstone event pattern implementation' },
            { id: 'Art.20', name: 'Data Portability', status: 'Fail', evidence: 'No tenant data export API implemented yet — requires JSON/CSV export endpoint' },
            { id: 'Art.33', name: 'Breach Notification', status: 'Pass', evidence: 'Monitor Agent + PagerDuty integration enables breach detection and notification within 72 hours' }
          ]
        },
        {
          name: 'FCC / 3GPP Telecom',
          status: 'Compliant',
          controls_assessed: 6,
          controls_passed: 6,
          controls_failed: 0,
          controls: [
            { id: '3GPP-28.531', name: 'Network Slice Management', status: 'Pass', evidence: 'Slice lifecycle management follows 3GPP TS 28.531 specifications' },
            { id: '3GPP-28.541', name: 'Slice NRM', status: 'Pass', evidence: 'Network Resource Model conformance for slice templates and configurations' },
            { id: 'FCC-222', name: 'Customer Proprietary Network Info', status: 'Pass', evidence: 'Tenant data isolated at schema level, CPNI access logged and audited' }
          ]
        }
      ]
    },
    audit_trail: {
      title: 'Audit Trail — Delivery Lifecycle',
      entries: [
        { timestamp: '2026-03-10T09:00:00Z', actor: 'PO Agent', action: 'Epic Decomposition', artifact: 'US-001 to US-006', approval: 'Product Owner approved', evidence: 'Jira issues created' },
        { timestamp: '2026-03-12T10:00:00Z', actor: 'Arch Agent', action: 'Architecture Specification', artifact: 'HLD + LLD + 3 ADRs', approval: 'Tech Lead approved', evidence: 'Confluence pages published' },
        { timestamp: '2026-03-14T11:00:00Z', actor: 'Test Agent', action: 'Test Plan Generation', artifact: '86 test cases, 6 BDD features', approval: 'QA Lead approved', evidence: 'Test plan in Zephyr' },
        { timestamp: '2026-03-18T09:00:00Z', actor: 'Code Agent', action: 'Code Generation', artifact: '12 files, 814 LOC', approval: 'Code review by Review Agent', evidence: 'PR #142 on GitHub' },
        { timestamp: '2026-03-20T10:00:00Z', actor: 'Review Agent', action: 'Architecture & Code Review', artifact: 'Review scorecard (87/100 + 91/100)', approval: 'Approved with conditions', evidence: 'Review report artifact' },
        { timestamp: '2026-03-22T11:00:00Z', actor: 'Security Agent', action: 'Security Assessment', artifact: 'Threat model + SAST/DAST results', approval: 'Security Lead review pending', evidence: 'Security report' },
        { timestamp: '2026-03-24T10:30:00Z', actor: 'Deploy Agent', action: 'QA Deployment', artifact: 'v1.4.0-rc.1 deployed to QA', approval: 'Auto-approved (QA environment)', evidence: 'Helm release + pipeline logs' },
        { timestamp: '2026-03-24T11:00:00Z', actor: 'Monitor Agent', action: 'Anomaly Detection', artifact: 'RCA report — DB pool exhaustion', approval: 'N/A', evidence: 'Jira PLAT-891 created' }
      ]
    },
    policy_enforcement: {
      title: 'Organizational Policy Compliance',
      policies: [
        {
          name: 'Data Retention Policy',
          status: 'Compliant',
          details: 'Event sourcing logs retained for 7 years per telecom regulatory requirements. Slice configuration snapshots retained for 3 years. User access logs retained for 1 year.',
          evidence: 'PostgreSQL partitioning with time-based retention policies configured'
        },
        {
          name: 'PII Handling Policy',
          status: 'Compliant',
          details: 'Tenant contact information encrypted at field level. No PII in application logs (log scrubbing enabled). PII access requires elevated role.',
          evidence: 'Prisma field-level encryption middleware + ELK redaction rules'
        },
        {
          name: 'Encryption Policy',
          status: 'Compliant',
          details: 'TLS 1.3 for all external communication. mTLS for inter-service calls. AES-256 for data at rest. RSA-2048 for key exchange.',
          evidence: 'Kong gateway TLS config + PostgreSQL TDE + Vault key rotation'
        },
        {
          name: 'Access Control Policy',
          status: 'Compliant',
          details: 'Principle of least privilege enforced. Service accounts scoped to specific APIs. Admin actions require multi-factor authentication.',
          evidence: 'NestJS RBAC guards + Kong JWT scope validation'
        },
        {
          name: 'Change Management Policy',
          status: 'Warning',
          details: 'All changes through CI/CD pipeline with automated testing gates. CAB approval for production changes not yet fully automated.',
          evidence: 'GitHub Actions pipeline + Helm release history'
        }
      ]
    },
    license_audit: {
      total_dependencies: 34,
      compliant: 32,
      review_needed: 2,
      blocked: 0,
      details: [
        { package: '@nestjs/core', license: 'MIT', status: 'Approved', risk: 'None' },
        { package: 'prisma', license: 'Apache-2.0', status: 'Approved', risk: 'None' },
        { package: 'kafkajs', license: 'MIT', status: 'Approved', risk: 'None' },
        { package: 'pg', license: 'MIT', status: 'Approved', risk: 'None' },
        { package: 'bullmq', license: 'MIT', status: 'Approved', risk: 'None' },
        { package: 'jsonwebtoken', license: 'MIT', status: 'Approved', risk: 'None' },
        { package: 'avsc', license: 'MIT', status: 'Review', risk: 'Low — verify no copyleft contamination from transitive deps' },
        { package: 'node-rdkafka', license: 'MIT + Confluent EULA', status: 'Review', risk: 'Low — Confluent EULA for Schema Registry client needs legal review' }
      ],
      allowed_licenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
      blocked_licenses: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL']
    },
    change_request: {
      id: 'CR-2026-0328-001',
      title: 'Production Release — 5G Slice Platform v1.4.0',
      type: 'Standard Change',
      risk_level: 'Medium',
      requested_by: 'Release Management Agent',
      approvers: [
        { role: 'Engineering Manager', name: 'Auto-assigned', status: 'Pending' },
        { role: 'Security Lead', name: 'Auto-assigned', status: 'Pending' },
        { role: 'QA Lead', name: 'Auto-assigned', status: 'Approved' },
        { role: 'Product Owner', name: 'Auto-assigned', status: 'Approved' }
      ],
      implementation_plan: 'Blue-green deployment via Helm upgrade with canary traffic shifting (10% → 30% → 50% → 100%)',
      rollback_plan: 'Helm rollback to v1.3.2 with blue-green instant switchback (< 2 min)',
      test_plan: '12 smoke tests + 86 regression tests + performance validation (P95 < 200ms)',
      schedule: {
        start: '2026-03-28T06:00:00Z',
        end: '2026-03-28T08:00:00Z',
        maintenance_window: '2 hours'
      }
    },
    evidence_package: {
      title: 'Audit Evidence Package — v1.4.0 Release',
      documents: [
        { name: 'Architecture Review Report', agent: 'Review Agent', status: 'Attached', size: '22 KB' },
        { name: 'Security Assessment Report', agent: 'Security Agent', status: 'Attached', size: '35 KB' },
        { name: 'Test Execution Results', agent: 'Test Agent + Deploy Agent', status: 'Attached', size: '18 KB' },
        { name: 'Code Quality Report (SonarQube)', agent: 'Code Agent + Review Agent', status: 'Attached', size: '12 KB' },
        { name: 'Release Readiness Scorecard', agent: 'Release Mgmt Agent', status: 'Attached', size: '8 KB' },
        { name: 'Compliance Matrix', agent: 'Compliance Agent', status: 'This document', size: '28 KB' },
        { name: 'Deployment Pipeline Logs', agent: 'Deploy Agent', status: 'Attached', size: '15 KB' },
        { name: 'Change Request Form', agent: 'Compliance Agent', status: 'This document', size: '4 KB' }
      ],
      total_size: '142 KB',
      format: 'PDF Bundle + Jira attachments'
    },
    summary: {
      overall_status: 'Compliant with Conditions',
      frameworks_assessed: 3,
      total_controls: 26,
      controls_passed: 23,
      controls_warning: 2,
      controls_failed: 1,
      audit_entries: 8,
      policies_compliant: 4,
      policies_warning: 1,
      license_issues: 2,
      change_request_status: 'Pending Approval',
      evidence_documents: 8,
      conditions: [
        'Fix GDPR Art.17 — implement tombstone event pattern for data erasure',
        'Implement GDPR Art.20 — tenant data export API (JSON/CSV)',
        'Automate CAB approval workflow for production changes'
      ],
      generated_at: '2026-03-24T13:00:00Z'
    }
  };
}
