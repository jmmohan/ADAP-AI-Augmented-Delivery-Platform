export function buildMockSecurityReport(items) {
  return {
    threat_model: {
      title: 'STRIDE Threat Model — 5G Slice Management Platform',
      methodology: 'STRIDE',
      scope: '5G Network Slice Provisioning & Management',
      threats: [
        {
          id: 'THR-001',
          category: 'Spoofing',
          component: 'API Gateway',
          description: 'Attacker could forge JWT tokens to impersonate tenant service accounts. Insufficient token validation could allow cross-tenant access to slice resources.',
          likelihood: 'Medium',
          impact: 'Critical',
          risk_level: 'High',
          mitigation: 'Implement JWT signature verification with RS256, enforce token expiry < 1 hour, validate tenant_id claim against request context',
          status: 'Mitigated'
        },
        {
          id: 'THR-002',
          category: 'Tampering',
          component: 'Event Bus (Kafka)',
          description: 'Malicious actor could inject or modify Kafka messages to trigger unauthorized slice state transitions or corrupt event sourcing log.',
          likelihood: 'Low',
          impact: 'High',
          risk_level: 'Medium',
          mitigation: 'Enable Kafka message signing with HMAC, enforce Avro schema validation on all producers/consumers, enable audit logging on all topic writes',
          status: 'Partially Mitigated'
        },
        {
          id: 'THR-003',
          category: 'Repudiation',
          component: 'Slice Provisioning Service',
          description: 'Administrators could deny performing destructive operations (slice decommissioning) without proper audit trail.',
          likelihood: 'Medium',
          impact: 'Medium',
          risk_level: 'Medium',
          mitigation: 'Event sourcing provides immutable audit log. Add user identity to all event metadata. Integrate with centralized SIEM for tamper-evident logging.',
          status: 'Mitigated'
        },
        {
          id: 'THR-004',
          category: 'Information Disclosure',
          component: 'PostgreSQL / Data Store',
          description: 'Multi-tenant data leakage through SQL injection, misconfigured schema isolation, or improper error messages exposing internal data structures.',
          likelihood: 'Medium',
          impact: 'Critical',
          risk_level: 'High',
          mitigation: 'Schema-per-tenant isolation (ADR-002), parameterized queries via Prisma ORM, sanitize error responses, enable TDE for encryption at rest',
          status: 'Mitigated'
        },
        {
          id: 'THR-005',
          category: 'Denial of Service',
          component: 'API Gateway / All Services',
          description: 'Volumetric attack or resource exhaustion through unbounded API requests, oversized payloads, or Kafka topic flooding.',
          likelihood: 'High',
          impact: 'High',
          risk_level: 'High',
          mitigation: 'Rate limiting per SLA tier (Kong), request payload size limits (1MB), Kafka quota enforcement, K8s resource limits and HPA',
          status: 'Partially Mitigated'
        },
        {
          id: 'THR-006',
          category: 'Elevation of Privilege',
          component: 'Tenant Auth Gateway',
          description: 'Tenant user could escalate privileges to access admin-only operations (slice template management, cross-tenant queries) through broken access control.',
          likelihood: 'Low',
          impact: 'Critical',
          risk_level: 'High',
          mitigation: 'Role-based access control (RBAC) with scope enforcement on every endpoint, principle of least privilege, audit all privilege escalation attempts',
          status: 'Mitigated'
        }
      ]
    },
    sast_results: {
      tool: 'Semgrep + SonarQube SAST',
      scan_duration: '2m 14s',
      files_scanned: 48,
      lines_scanned: 12450,
      findings: [
        {
          id: 'SAST-001',
          severity: 'Critical',
          category: 'SQL Injection',
          cwe: 'CWE-89',
          owasp: 'A03:2021 — Injection',
          file: 'src/slice/slice.repository.ts',
          line: 47,
          description: 'Raw SQL query with string interpolation of user-supplied tenant_id parameter',
          recommendation: 'Use Prisma parameterized queries: this.prisma.$queryRaw`...`',
          code_snippet: `// Vulnerable
const slices = await this.prisma.$queryRaw(\`SELECT * FROM slices WHERE tenant_id = '\${req.params.tenantId}'\`);`,
          fix_snippet: `// Fixed
const slices = await this.prisma.$queryRaw\`SELECT * FROM slices WHERE tenant_id = \${req.params.tenantId}\`;`
        },
        {
          id: 'SAST-002',
          severity: 'High',
          category: 'Insecure Deserialization',
          cwe: 'CWE-502',
          owasp: 'A08:2021 — Software & Data Integrity',
          file: 'src/events/event-handler.service.ts',
          line: 23,
          description: 'JSON.parse() on unvalidated Kafka message payload without schema validation',
          recommendation: 'Enforce Avro schema validation before deserialization',
          code_snippet: `const event = JSON.parse(message.value.toString());`,
          fix_snippet: `const event = await this.schemaRegistry.decode(message.value);`
        },
        {
          id: 'SAST-003',
          severity: 'Medium',
          category: 'Sensitive Data Exposure',
          cwe: 'CWE-532',
          owasp: 'A09:2021 — Security Logging',
          file: 'src/auth/auth.middleware.ts',
          line: 56,
          description: 'JWT token logged in debug output — could expose credentials in log aggregators',
          recommendation: 'Mask or redact tokens in log output',
          code_snippet: `logger.debug(\`Auth token received: \${token}\`);`,
          fix_snippet: `logger.debug(\`Auth token received: \${token.substring(0, 10)}...[REDACTED]\`);`
        },
        {
          id: 'SAST-004',
          severity: 'Low',
          category: 'Missing Security Headers',
          cwe: 'CWE-693',
          owasp: 'A05:2021 — Security Misconfiguration',
          file: 'src/main.ts',
          line: 12,
          description: 'Helmet middleware not configured — missing X-Content-Type-Options, X-Frame-Options headers',
          recommendation: 'Add app.use(helmet()) to NestJS bootstrap',
          code_snippet: '',
          fix_snippet: `import helmet from 'helmet';\napp.use(helmet());`
        }
      ],
      summary: {
        critical: 1,
        high: 1,
        medium: 1,
        low: 1,
        total: 4
      }
    },
    container_security: {
      tool: 'Trivy + Docker Scout',
      images_scanned: 4,
      results: [
        {
          image: 'slice-provisioning-service:v1.4.0-rc.1',
          base_image: 'node:20-alpine',
          vulnerabilities: { critical: 0, high: 1, medium: 3, low: 8 },
          details: [
            { cve: 'CVE-2026-1234', severity: 'High', package: 'openssl 3.1.4', description: 'Buffer overflow in TLS handshake', fix: 'Upgrade to openssl 3.1.5' }
          ],
          best_practices: [
            { check: 'Non-root user', status: 'Pass' },
            { check: 'Read-only filesystem', status: 'Fail', recommendation: 'Set readOnlyRootFilesystem: true in K8s securityContext' },
            { check: 'No secrets in image', status: 'Pass' },
            { check: 'Minimal base image', status: 'Pass' }
          ]
        },
        {
          image: 'tenant-auth-gateway:v1.4.0-rc.1',
          base_image: 'node:20-alpine',
          vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 },
          details: [],
          best_practices: [
            { check: 'Non-root user', status: 'Pass' },
            { check: 'Read-only filesystem', status: 'Pass' },
            { check: 'No secrets in image', status: 'Pass' },
            { check: 'Minimal base image', status: 'Pass' }
          ]
        }
      ]
    },
    owasp_checklist: [
      { id: 'A01', name: 'Broken Access Control', status: 'Pass', notes: 'RBAC enforced via NestJS guards, tenant isolation at schema level' },
      { id: 'A02', name: 'Cryptographic Failures', status: 'Pass', notes: 'TLS 1.3 enforced, AES-256 encryption at rest, RS256 for JWT' },
      { id: 'A03', name: 'Injection', status: 'Fail', notes: '1 SQL injection finding in slice.repository.ts — requires immediate fix' },
      { id: 'A04', name: 'Insecure Design', status: 'Pass', notes: 'Threat modeling completed, security requirements in NFRs' },
      { id: 'A05', name: 'Security Misconfiguration', status: 'Warning', notes: 'Helmet middleware missing, read-only filesystem not enforced on 1 container' },
      { id: 'A06', name: 'Vulnerable Components', status: 'Warning', notes: '1 high-severity CVE in openssl — upgrade available' },
      { id: 'A07', name: 'Auth Failures', status: 'Pass', notes: 'JWT with RS256, token expiry enforced, brute-force protection via rate limiting' },
      { id: 'A08', name: 'Software & Data Integrity', status: 'Warning', notes: 'Kafka message deserialization should enforce schema validation' },
      { id: 'A09', name: 'Security Logging', status: 'Warning', notes: 'JWT token logged in debug output — redact sensitive data' },
      { id: 'A10', name: 'SSRF', status: 'Pass', notes: 'No user-controlled URLs in server-side requests' }
    ],
    iac_review: {
      tool: 'Checkov + KubeLinter',
      files_scanned: 8,
      findings: [
        { severity: 'High', file: 'helm/values.yaml', rule: 'CKV_K8S_22', description: 'Container readOnlyRootFilesystem not set to true for slice-provisioning-service', recommendation: 'Add securityContext.readOnlyRootFilesystem: true' },
        { severity: 'Medium', file: 'helm/values.yaml', rule: 'CKV_K8S_28', description: 'NetworkPolicy not defined — all pod-to-pod traffic allowed', recommendation: 'Define NetworkPolicy to restrict ingress/egress per service' },
        { severity: 'Low', file: 'helm/values.yaml', rule: 'CKV_K8S_35', description: 'Resource limits not set for event-bus-broker sidecar container', recommendation: 'Add resources.limits.cpu and memory for all containers' }
      ]
    },
    summary: {
      overall_risk: 'Medium',
      security_score: 78,
      max_score: 100,
      total_findings: 14,
      critical_findings: 1,
      high_findings: 3,
      medium_findings: 5,
      low_findings: 5,
      owasp_pass: 6,
      owasp_warn: 3,
      owasp_fail: 1,
      top_priorities: [
        'Fix SQL injection in slice.repository.ts (SAST-001)',
        'Upgrade openssl to 3.1.5 across all container images',
        'Enforce Avro schema validation for Kafka message deserialization',
        'Add Helmet middleware for security headers'
      ],
      reviewed_at: '2026-03-24T11:30:00Z'
    }
  };
}
