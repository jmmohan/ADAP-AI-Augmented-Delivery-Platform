export function buildMockTriageReport(services) {
  return {
    anomalies: [
      {
        id: 'ANM-001',
        severity: 'Critical',
        service: 'slice-provisioning-service',
        metric: 'p99_latency',
        current_value: '2,340ms',
        threshold: '500ms',
        started_at: '2026-03-24T09:47:12Z',
        duration: '23 minutes',
        status: 'Active'
      },
      {
        id: 'ANM-002',
        severity: 'High',
        service: 'postgres-primary',
        metric: 'active_connections',
        current_value: '97/100',
        threshold: '80/100',
        started_at: '2026-03-24T09:44:30Z',
        duration: '26 minutes',
        status: 'Active'
      },
      {
        id: 'ANM-003',
        severity: 'Medium',
        service: 'event-bus-broker',
        metric: 'consumer_lag',
        current_value: '12,450 messages',
        threshold: '1,000 messages',
        started_at: '2026-03-24T09:48:00Z',
        duration: '22 minutes',
        status: 'Investigating'
      },
      {
        id: 'ANM-004',
        severity: 'Low',
        service: 'sla-monitoring-service',
        metric: 'cpu_usage',
        current_value: '78%',
        threshold: '70%',
        started_at: '2026-03-24T09:52:00Z',
        duration: '18 minutes',
        status: 'Investigating'
      }
    ],
    traces: [
      {
        trace_id: 'abc123def456-7890-trace-001',
        service_chain: ['api-gateway', 'slice-provisioning-service', 'postgres-primary'],
        total_duration_ms: 2340,
        root_span: 'POST /api/v1/slices',
        error_span: 'postgres-primary: connection acquire timeout',
        bottleneck: 'postgres-primary — connection pool exhaustion (97/100 active)',
        source: 'Jaeger'
      },
      {
        trace_id: 'def789ghi012-3456-trace-002',
        service_chain: ['slice-provisioning-service', 'event-bus-broker', 'sla-monitoring-service'],
        total_duration_ms: 8750,
        root_span: 'Kafka.produce(slice.created)',
        error_span: 'event-bus-broker: producer backpressure timeout',
        bottleneck: 'event-bus-broker — consumer lag causing backpressure on producer',
        source: 'Jaeger'
      },
      {
        trace_id: 'ghi345jkl678-9012-trace-003',
        service_chain: ['tenant-auth-gateway', 'slice-provisioning-service'],
        total_duration_ms: 580,
        root_span: 'GET /api/v1/slices/{id}',
        error_span: 'slice-provisioning-service: slow query (sequential scan)',
        bottleneck: 'postgres-primary — missing index on slices.tenant_id + status',
        source: 'Jaeger'
      }
    ],
    rca: {
      probable_cause:
        'Database connection pool exhaustion on postgres-primary triggered by a spike in concurrent slice provisioning requests following the v1.4.0-rc.1 deployment. The new event-sourcing write path doubles the number of DB connections per request (one for the write, one for the event log), exceeding the pool limit of 100.',
      confidence: 'High',
      evidence: [
        'Connection pool utilization jumped from 45% to 97% within 3 minutes of deployment at 09:44 UTC',
        'Deployment v1.4.0-rc.1 introduced event-sourcing for slice lifecycle (ADR-001), adding a second DB write per operation',
        'Kafka consumer lag spiked simultaneously due to slow event publishing caused by DB contention',
        'No infrastructure changes or traffic spikes detected — deployment is the only correlated change',
        'Reverting to v1.3.2 connection pool settings in staging showed immediate recovery in load tests'
      ],
      affected_services: ['slice-provisioning-service', 'postgres-primary', 'event-bus-broker', 'sla-monitoring-service'],
      blast_radius: '4 of 6 services affected — slice provisioning fully degraded, monitoring delayed',
      timeline: [
        { time: '2026-03-24T09:30:00Z', event: 'v1.4.0-rc.1 deployed to QA via Helm upgrade' },
        { time: '2026-03-24T09:32:00Z', event: 'Smoke tests pass — all 12 endpoints healthy' },
        { time: '2026-03-24T09:44:30Z', event: 'DB connection pool reaches 80/100 — first threshold breach' },
        { time: '2026-03-24T09:45:15Z', event: 'Datadog alert fires: postgres active connections > 80' },
        { time: '2026-03-24T09:47:12Z', event: 'P99 latency spikes to 2,340ms on slice provisioning API' },
        { time: '2026-03-24T09:48:00Z', event: 'Kafka consumer lag exceeds 10K — event processing stalled' },
        { time: '2026-03-24T09:52:00Z', event: 'SLA monitoring CPU spikes to 78% due to backlogged evaluations' },
        { time: '2026-03-24T10:10:00Z', event: 'RCA initiated — connection pool exhaustion identified as root cause' }
      ]
    },
    correlations: [
      {
        source: 'Datadog',
        type: 'metric',
        description: 'postgres.pool.active_connections crossed 80% threshold at 09:44 UTC, correlating with deployment completion at 09:30 UTC',
        link: 'https://app.datadoghq.com/dash/postgres-pool?from=2026-03-24T09:00'
      },
      {
        source: 'ELK',
        type: 'log',
        description: 'Burst of "connection acquire timeout" errors in slice-provisioning-service logs starting 09:47 UTC (142 occurrences in 5 minutes)',
        link: 'https://kibana.internal/app/discover?query=connection+acquire+timeout'
      },
      {
        source: 'Jaeger',
        type: 'trace',
        description: 'P99 trace duration increased 4.7x (500ms → 2,340ms) with bottleneck consistently at postgres connection acquisition',
        link: 'https://jaeger.internal/trace/abc123def456-7890-trace-001'
      },
      {
        source: 'Datadog',
        type: 'metric',
        description: 'Kafka consumer group lag for slice-events increased from 0 to 12,450 between 09:47 and 10:10 UTC',
        link: 'https://app.datadoghq.com/dash/kafka-consumer-lag'
      },
      {
        source: 'ELK',
        type: 'log',
        description: 'Helm deployment log confirms v1.4.0-rc.1 rollout completed at 09:30 UTC with 3 replicas',
        link: 'https://kibana.internal/app/discover?query=helm+upgrade+slice-platform'
      }
    ],
    recommendations: [
      {
        id: 'FIX-001',
        priority: 'P0',
        title: 'Increase PostgreSQL connection pool limit',
        description:
          'The event-sourcing write path in v1.4.0-rc.1 doubles DB connections per request. Increase pool_size from 100 to 200 and add PgBouncer for connection multiplexing.',
        fix_type: 'config_change',
        estimated_effort: '30 minutes',
        code_suggestion: `# postgresql.conf
max_connections = 200

# pgbouncer.ini
[databases]
slicedb = host=localhost port=5432 dbname=slicedb
[pgbouncer]
pool_mode = transaction
default_pool_size = 50
max_client_conn = 400`
      },
      {
        id: 'FIX-002',
        priority: 'P0',
        title: 'Batch event-sourcing writes with single connection',
        description:
          'Refactor the event-sourcing write path to use a single DB transaction for both the state mutation and event log entry, halving the connection requirement per request.',
        fix_type: 'code_fix',
        estimated_effort: '2 hours',
        code_suggestion: `// Before: two separate DB calls
await this.repo.updateSlice(slice);
await this.eventRepo.appendEvent(event);

// After: single transaction
await this.prisma.$transaction([
  this.prisma.slice.update({ where: { id }, data: slice }),
  this.prisma.sliceEvent.create({ data: event }),
]);`
      },
      {
        id: 'FIX-003',
        priority: 'P1',
        title: 'Add missing index on slices(tenant_id, status)',
        description:
          'Traces show sequential scans on the slices table when filtering by tenant and status. Adding a composite index will reduce query time from ~120ms to <5ms.',
        fix_type: 'config_change',
        estimated_effort: '15 minutes',
        code_suggestion: `-- Migration: add_tenant_status_index.sql
CREATE INDEX CONCURRENTLY idx_slices_tenant_status
ON slices (tenant_id, status);`
      },
      {
        id: 'FIX-004',
        priority: 'P2',
        title: 'Configure Kafka producer retries with exponential backoff',
        description:
          'The Kafka producer currently fails fast on backpressure. Configure retries with exponential backoff to gracefully handle temporary DB-induced slowdowns.',
        fix_type: 'config_change',
        estimated_effort: '30 minutes',
        code_suggestion: ''
      }
    ],
    jira_defects: [
      {
        key: 'PLAT-891',
        summary: 'CRITICAL: DB connection pool exhaustion after v1.4.0-rc.1 deploy causes slice provisioning degradation',
        priority: 'Critical',
        assignee: 'Auto-assigned',
        labels: ['incident', 'database', 'connection-pool', 'v1.4.0-rc.1']
      },
      {
        key: 'PLAT-892',
        summary: 'Missing composite index on slices(tenant_id, status) causing sequential scans under load',
        priority: 'High',
        assignee: 'Auto-assigned',
        labels: ['performance', 'database', 'index']
      }
    ],
    summary: {
      total_anomalies: 4,
      critical_count: 1,
      mttr_estimate: '~45 min',
      services_affected: 4,
      status: 'Investigating'
    }
  };
}
