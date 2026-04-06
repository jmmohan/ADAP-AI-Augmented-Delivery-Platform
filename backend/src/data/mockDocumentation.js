export function buildMockDocumentation(items) {
  return {
    api_docs: {
      title: '5G Slice Management API — Developer Guide',
      version: 'v1.4.0',
      base_url: 'https://api.slice-platform.internal/api/v1',
      authentication: 'Bearer JWT (RS256) — obtain token via POST /api/v1/auth/token',
      endpoints: [
        {
          group: 'Slice Management',
          endpoints: [
            { method: 'POST', path: '/slices', summary: 'Create a new network slice from template', auth: 'Required', rate_limit: '100/min per tenant' },
            { method: 'GET', path: '/slices/{id}', summary: 'Retrieve slice details and current state', auth: 'Required', rate_limit: '500/min per tenant' },
            { method: 'PUT', path: '/slices/{id}/activate', summary: 'Activate a provisioned slice', auth: 'Required (Admin)', rate_limit: '50/min per tenant' },
            { method: 'DELETE', path: '/slices/{id}', summary: 'Decommission and release slice resources', auth: 'Required (Admin)', rate_limit: '20/min per tenant' }
          ]
        },
        {
          group: 'Tenant & Auth',
          endpoints: [
            { method: 'POST', path: '/auth/token', summary: 'Issue JWT token for service account', auth: 'Basic Auth', rate_limit: '10/min per IP' },
            { method: 'GET', path: '/tenants/{id}/quotas', summary: 'Retrieve tenant quota and usage', auth: 'Required', rate_limit: '200/min per tenant' }
          ]
        },
        {
          group: 'SLA Monitoring',
          endpoints: [
            { method: 'GET', path: '/sla/{sliceId}/status', summary: 'Current SLA compliance status', auth: 'Required', rate_limit: '500/min per tenant' },
            { method: 'GET', path: '/sla/{sliceId}/history', summary: 'Historical SLA metrics over time', auth: 'Required', rate_limit: '100/min per tenant' }
          ]
        }
      ]
    },
    runbooks: [
      {
        id: 'RB-001',
        title: 'Slice Provisioning Service — Startup & Health Check',
        service: 'slice-provisioning-service',
        sections: [
          { heading: 'Prerequisites', content: 'PostgreSQL 16 running, Kafka broker accessible, Redis cache available, valid .env with DB_URL and KAFKA_BROKERS' },
          { heading: 'Startup Command', content: 'kubectl rollout restart deployment/slice-provisioning -n slice-platform-prod' },
          { heading: 'Health Endpoints', content: 'GET /health/ready (readiness) · GET /health/live (liveness) · Expected: 200 OK with { status: "ok" }' },
          { heading: 'Troubleshooting', content: 'If pods crash-loop: check DB connectivity (pg_isready), verify Kafka broker DNS, check memory limits (OOMKilled). Logs: kubectl logs -f deployment/slice-provisioning -n slice-platform-prod' }
        ]
      },
      {
        id: 'RB-002',
        title: 'Database Connection Pool Exhaustion Recovery',
        service: 'postgres-primary',
        sections: [
          { heading: 'Detection', content: 'Datadog alert: postgres.pool.active_connections > 80%. ELK logs showing "connection acquire timeout" errors.' },
          { heading: 'Immediate Action', content: '1. Check active connections: SELECT count(*) FROM pg_stat_activity; 2. Identify long-running queries: SELECT pid, query, state FROM pg_stat_activity WHERE state != \'idle\'; 3. Kill blocking queries if needed: SELECT pg_terminate_backend(pid);' },
          { heading: 'Scaling', content: 'Increase pool_size in postgresql.conf from 100 to 200. Restart PgBouncer: systemctl restart pgbouncer. Verify: pgbouncer SHOW POOLS;' },
          { heading: 'Prevention', content: 'Review application connection usage patterns. Ensure all transactions are properly closed. Add connection timeout: pool.connectionTimeoutMillis = 5000' }
        ]
      },
      {
        id: 'RB-003',
        title: 'Kafka Consumer Lag Remediation',
        service: 'event-bus-broker',
        sections: [
          { heading: 'Detection', content: 'Datadog alert: kafka.consumer_lag > 1000 messages. Grafana dashboard showing increasing lag trend.' },
          { heading: 'Diagnosis', content: 'Check consumer group status: kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group slice-events-consumer' },
          { heading: 'Remediation', content: '1. Scale consumers: increase replicas in deployment. 2. Check for poison messages in DLQ topic. 3. If persistent: increase partition count and rebalance.' },
          { heading: 'Escalation', content: 'If lag persists > 30 min after scaling: page SRE on-call via PagerDuty. Consider temporary consumer bypass for non-critical events.' }
        ]
      }
    ],
    release_notes: {
      version: 'v1.4.0-rc.1',
      date: '2026-03-24',
      highlights: [
        'Event sourcing for complete slice lifecycle audit trail',
        'Schema-per-tenant isolation for enhanced multi-tenant security',
        'Real-time SLA breach detection and auto-remediation'
      ],
      features: [
        { id: 'US-001', title: 'Network Slice Provisioning API with quota enforcement', status: 'Complete' },
        { id: 'US-002', title: 'Tenant isolation with JWT-based auth gateway', status: 'Complete' },
        { id: 'US-003', title: 'SLA monitoring dashboard with live KPI tracking', status: 'Complete' },
        { id: 'US-004', title: 'Kafka event bus for async slice lifecycle events', status: 'Complete' },
        { id: 'US-005', title: 'Usage metering and billing integration', status: 'In Progress' },
        { id: 'US-006', title: 'Distributed tracing with Jaeger correlation', status: 'Complete' }
      ],
      bug_fixes: [
        'Fixed race condition in concurrent slice resize operations (PLAT-790)',
        'Resolved billing webhook timeout under high load (PLAT-789)',
        'Corrected Kafka consumer group rebalancing during deployment'
      ],
      breaking_changes: [
        'Event sourcing doubles DB connections per request — pool_size increase required (see ADR-001 amendment)'
      ],
      known_issues: [
        'PATCH /api/v1/slices/{id} endpoint not yet implemented',
        'PgBouncer recommended for production deployments with > 100 concurrent tenants'
      ]
    },
    architecture_wiki: {
      title: 'Architecture Overview — 5G Slice Platform',
      pages: [
        { name: 'System Overview', status: 'Generated', word_count: 1200, sections: ['Introduction', 'Architecture Style', 'Component Diagram', 'Technology Stack'] },
        { name: 'Component Catalog', status: 'Generated', word_count: 2400, sections: ['Slice Provisioning Service', 'API Gateway', 'Event Bus', 'SLA Monitor', 'Data Store'] },
        { name: 'ADR Register', status: 'Generated', word_count: 1800, sections: ['ADR-001: Event Sourcing', 'ADR-002: Schema Isolation', 'ADR-003: Kafka Backbone'] },
        { name: 'API Reference', status: 'Generated', word_count: 3200, sections: ['Authentication', 'Endpoints', 'Error Codes', 'Rate Limits', 'Examples'] },
        { name: 'Deployment Guide', status: 'Generated', word_count: 900, sections: ['Prerequisites', 'Helm Installation', 'Environment Config', 'Monitoring Setup'] },
        { name: 'Onboarding Guide', status: 'Generated', word_count: 1500, sections: ['Local Setup', 'Development Workflow', 'Testing', 'PR Process', 'Code Standards'] }
      ],
      total_pages: 6,
      total_words: 11000,
      format: 'Confluence Wiki Markup'
    },
    decision_log: [
      { id: 'ADR-001', title: 'Event Sourcing for Slice Lifecycle', status: 'Accepted', date: '2026-03-10', impact: 'High' },
      { id: 'ADR-002', title: 'Schema-Level Tenant Isolation', status: 'Accepted', date: '2026-03-12', impact: 'High' },
      { id: 'ADR-003', title: 'Kafka with Avro Schema Registry', status: 'Accepted', date: '2026-03-14', impact: 'Medium' },
      { id: 'ADR-004', title: 'Audit Log RLS Exception', status: 'Proposed', date: '2026-03-24', impact: 'Low' }
    ],
    summary: {
      total_pages: 6,
      total_word_count: 11000,
      api_endpoints_documented: 8,
      runbooks_generated: 3,
      release_notes_version: 'v1.4.0-rc.1',
      adrs_tracked: 4,
      format: 'Confluence + Markdown',
      generated_at: '2026-03-24T12:00:00Z'
    }
  };
}
