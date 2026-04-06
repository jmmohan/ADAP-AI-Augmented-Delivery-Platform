export function buildMockPerfReport(items) {
  return {
    performance_budget: {
      title: 'Performance Budget — 5G Slice Platform v1.4.0',
      endpoints: [
        {
          path: 'POST /api/v1/slices',
          target_p50: '50ms',
          target_p95: '200ms',
          target_p99: '500ms',
          actual_p50: '45ms',
          actual_p95: '180ms',
          actual_p99: '420ms',
          status: 'Within Budget',
          throughput_target: '500 RPS',
          throughput_actual: '1200 RPS'
        },
        {
          path: 'GET /api/v1/slices/{id}',
          target_p50: '20ms',
          target_p95: '100ms',
          target_p99: '250ms',
          actual_p50: '15ms',
          actual_p95: '65ms',
          actual_p99: '145ms',
          status: 'Within Budget',
          throughput_target: '2000 RPS',
          throughput_actual: '3500 RPS'
        },
        {
          path: 'PUT /api/v1/slices/{id}/activate',
          target_p50: '100ms',
          target_p95: '300ms',
          target_p99: '800ms',
          actual_p50: '85ms',
          actual_p95: '250ms',
          actual_p99: '680ms',
          status: 'Within Budget',
          throughput_target: '200 RPS',
          throughput_actual: '450 RPS'
        },
        {
          path: 'GET /api/v1/sla/{sliceId}/status',
          target_p50: '30ms',
          target_p95: '150ms',
          target_p99: '400ms',
          actual_p50: '28ms',
          actual_p95: '120ms',
          actual_p99: '380ms',
          status: 'Within Budget',
          throughput_target: '1000 RPS',
          throughput_actual: '2200 RPS'
        }
      ],
      overall_status: 'All endpoints within performance budget'
    },
    load_test_results: {
      tool: 'k6',
      duration: '15 minutes',
      virtual_users: {
        ramp_up: '0 → 500 over 3 min',
        steady_state: '500 VUs for 10 min',
        ramp_down: '500 → 0 over 2 min'
      },
      results: {
        total_requests: 847200,
        requests_per_second: 942,
        avg_response_time: '52ms',
        p50: '38ms',
        p95: '145ms',
        p99: '380ms',
        max_response_time: '1240ms',
        error_rate: '0.02%',
        data_received: '2.4 GB',
        data_sent: '890 MB'
      },
      scenarios: [
        {
          name: 'Slice Provisioning Burst',
          description: 'Simulate 200 concurrent slice creation requests',
          vus: 200,
          duration: '5m',
          result: 'Pass',
          avg_response: '68ms',
          error_rate: '0.01%',
          observations: 'DB connection pool peaked at 65/100 — headroom sufficient'
        },
        {
          name: 'Multi-Tenant Read Storm',
          description: 'Simulate 500 tenants querying slice status simultaneously',
          vus: 500,
          duration: '5m',
          result: 'Pass',
          avg_response: '22ms',
          error_rate: '0.00%',
          observations: 'Redis cache hit rate 94% — effective caching strategy'
        },
        {
          name: 'SLA Breach Cascade',
          description: 'Simulate 100 simultaneous SLA breach events triggering auto-remediation',
          vus: 100,
          duration: '3m',
          result: 'Pass',
          avg_response: '120ms',
          error_rate: '0.05%',
          observations: 'Kafka producer throughput stable at 8K msg/sec during burst'
        },
        {
          name: 'Sustained High Load',
          description: 'Maintain 1000 RPS mixed workload for 15 minutes',
          vus: 300,
          duration: '15m',
          result: 'Pass',
          avg_response: '55ms',
          error_rate: '0.03%',
          observations: 'Memory stable at 420MB per pod, CPU avg 35%, no GC pauses > 50ms'
        }
      ],
      script_snippet: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '3m', target: 500 },
    { duration: '10m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.post(
    'https://qa-api.slice-platform.internal/api/v1/slices',
    JSON.stringify({ templateId: 'tmpl-embb-standard', tenantId: 'tenant-001', name: 'perf-test-slice' }),
    { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' } }
  );
  check(res, { 'status is 201': (r) => r.status === 201 });
  sleep(1);
}`
    },
    capacity_plan: {
      title: 'Capacity Planning — Production Estimates',
      current_capacity: {
        pods: 3,
        cpu_per_pod: '500m',
        memory_per_pod: '512Mi',
        max_rps_estimated: 1500,
        db_connections: 100,
        kafka_partitions: 6
      },
      projected_needs: [
        {
          scenario: 'Current Load (100 tenants)',
          estimated_rps: 200,
          recommended_pods: 3,
          cpu: '500m × 3',
          memory: '512Mi × 3',
          db_connections: 60,
          kafka_partitions: 6,
          monthly_cost: '$450'
        },
        {
          scenario: 'Growth (250 tenants — 3 months)',
          estimated_rps: 500,
          recommended_pods: 5,
          cpu: '750m × 5',
          memory: '768Mi × 5',
          db_connections: 100,
          kafka_partitions: 12,
          monthly_cost: '$890'
        },
        {
          scenario: 'Scale (500 tenants — 6 months)',
          estimated_rps: 1200,
          recommended_pods: 8,
          cpu: '1000m × 8',
          memory: '1Gi × 8',
          db_connections: 200,
          kafka_partitions: 24,
          monthly_cost: '$1,650'
        },
        {
          scenario: 'Enterprise (1000 tenants — 12 months)',
          estimated_rps: 3000,
          recommended_pods: 15,
          cpu: '1000m × 15',
          memory: '1Gi × 15',
          db_connections: 400,
          kafka_partitions: 48,
          monthly_cost: '$3,200'
        }
      ]
    },
    bottleneck_analysis: {
      title: 'Bottleneck Analysis — Static & Runtime',
      findings: [
        {
          id: 'BOT-001',
          severity: 'High',
          type: 'N+1 Query',
          file: 'src/slice/slice.service.ts',
          line: 45,
          description: 'getSlicesForTenant() fetches slices then iterates to load SLA contracts individually — causes N+1 query amplification',
          impact: 'At 100 slices per tenant: 101 queries instead of 2. Adds ~200ms latency per request.',
          recommendation: 'Use Prisma include or join query to load SLA contracts with slices in a single query',
          code_suggestion: `// Before: N+1
const slices = await this.prisma.slice.findMany({ where: { tenantId } });
for (const slice of slices) {
  slice.sla = await this.prisma.slaContract.findFirst({ where: { sliceId: slice.id } });
}

// After: Single query with include
const slices = await this.prisma.slice.findMany({
  where: { tenantId },
  include: { slaContract: true }
});`
        },
        {
          id: 'BOT-002',
          severity: 'Medium',
          type: 'Missing Index',
          file: 'prisma/schema.prisma',
          description: 'No composite index on slices(tenant_id, status) — causes sequential scan on filtered queries',
          impact: 'Query time increases linearly with table size. At 100K rows: ~120ms vs <5ms with index.',
          recommendation: 'Add @@index([tenantId, status]) to Slice model in Prisma schema',
          code_suggestion: `// prisma/schema.prisma
model Slice {
  id        String @id @default(uuid())
  tenantId  String
  status    String
  // ...
  @@index([tenantId, status])
}`
        },
        {
          id: 'BOT-003',
          severity: 'Medium',
          type: 'Unbounded Result Set',
          file: 'src/sla/sla-evaluator.service.ts',
          line: 78,
          description: 'getHistoricalMetrics() has no pagination — returns all historical SLA data points without limit',
          impact: 'Memory spike risk with large tenants. Response payload could exceed 10MB for tenants with 6+ months of data.',
          recommendation: 'Add cursor-based pagination with default limit of 100 records',
          code_suggestion: ''
        },
        {
          id: 'BOT-004',
          severity: 'Low',
          type: 'Synchronous I/O',
          file: 'src/events/event-bus.service.ts',
          line: 34,
          description: 'Schema validation runs synchronously before each Kafka produce call, blocking the event loop',
          impact: 'Adds ~5ms per event publish. Under high throughput (>1K events/sec), creates backpressure.',
          recommendation: 'Cache compiled Avro schemas and validate asynchronously',
          code_suggestion: ''
        }
      ]
    },
    cost_optimization: {
      title: 'Infrastructure Cost Optimization',
      recommendations: [
        {
          id: 'COST-001',
          category: 'Compute',
          current_cost: '$1,200/mo',
          projected_savings: '$360/mo (30%)',
          recommendation: 'Right-size CPU requests from 1000m to 750m — P95 CPU usage is 38%. Add HPA with target CPU 60%.',
          risk: 'Low'
        },
        {
          id: 'COST-002',
          category: 'Database',
          current_cost: '$800/mo',
          projected_savings: '$200/mo (25%)',
          recommendation: 'Enable connection pooling via PgBouncer to reduce PostgreSQL instance size. Move read-heavy queries to read replica.',
          risk: 'Medium'
        },
        {
          id: 'COST-003',
          category: 'Messaging',
          current_cost: '$400/mo',
          projected_savings: '$80/mo (20%)',
          recommendation: 'Compress Kafka messages with LZ4 — reduces storage by 60% and network bandwidth by 40%.',
          risk: 'Low'
        }
      ],
      total_current: '$2,400/mo',
      total_projected_savings: '$640/mo',
      savings_percentage: '26.7%'
    },
    sla_validation: {
      title: 'SLA Validation Against Architecture NFRs',
      validations: [
        { nfr: 'P95 < 200ms', actual: '180ms', status: 'Pass', margin: '10% headroom' },
        { nfr: 'P99 < 500ms', actual: '420ms', status: 'Pass', margin: '16% headroom' },
        { nfr: '10K concurrent slices', actual: '12K tested', status: 'Pass', margin: '20% headroom' },
        { nfr: '99.95% uptime', actual: '99.97%', status: 'Pass', margin: '0.02% above target' },
        { nfr: 'RTO < 5 min', actual: '< 2 min (blue-green)', status: 'Pass', margin: '60% under target' },
        { nfr: 'RPO < 1 min', actual: '< 30 sec (WAL streaming)', status: 'Pass', margin: '50% under target' }
      ],
      overall_status: 'All NFR targets met with adequate headroom'
    },
    summary: {
      overall_status: 'Healthy',
      endpoints_within_budget: 4,
      endpoints_total: 4,
      load_test_scenarios_passed: 4,
      bottlenecks_found: 4,
      high_bottlenecks: 1,
      nfrs_met: 6,
      nfrs_total: 6,
      cost_savings_potential: '26.7%',
      max_tested_rps: 1200,
      generated_at: '2026-03-24T13:30:00Z'
    }
  };
}
