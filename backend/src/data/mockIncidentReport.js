export function buildMockIncidentReport(incidents) {
  return {
    postmortem: {
      id: 'INC-2026-0324-001',
      title: 'Postmortem: Database Connection Pool Exhaustion — v1.4.0-rc.1 QA Deployment',
      severity: 'SEV-2',
      status: 'Resolved',
      duration: '40 minutes',
      impact: 'Slice provisioning API fully degraded for 23 minutes. 4 of 6 services affected. No data loss.',
      customer_impact: 'QA environment only — no production customer impact. 3 QA engineers blocked during incident window.',
      timeline: [
        { time: '2026-03-24T09:30:00Z', actor: 'Deploy Agent', event: 'v1.4.0-rc.1 deployed to QA via Helm upgrade — all health checks pass' },
        { time: '2026-03-24T09:32:00Z', actor: 'Deploy Agent', event: 'Smoke tests: 12/12 passed — deployment marked successful' },
        { time: '2026-03-24T09:44:30Z', actor: 'Monitor Agent', event: 'Datadog alert: postgres.pool.active_connections > 80% (97/100)' },
        { time: '2026-03-24T09:45:15Z', actor: 'PagerDuty', event: 'Alert escalated to SRE on-call — SEV-2 declared' },
        { time: '2026-03-24T09:47:12Z', actor: 'Monitor Agent', event: 'P99 latency spike to 2,340ms on POST /api/v1/slices' },
        { time: '2026-03-24T09:48:00Z', actor: 'Monitor Agent', event: 'Kafka consumer lag exceeds 12K messages' },
        { time: '2026-03-24T09:55:00Z', actor: 'SRE Team', event: 'Root cause identified: event-sourcing write path doubles DB connections' },
        { time: '2026-03-24T10:00:00Z', actor: 'SRE Team', event: 'Mitigation applied: increased pool_size from 100 to 200' },
        { time: '2026-03-24T10:05:00Z', actor: 'Monitor Agent', event: 'Connection pool utilization dropped to 48%. Latency recovering.' },
        { time: '2026-03-24T10:10:00Z', actor: 'Monitor Agent', event: 'All metrics returned to normal. SEV-2 resolved.' }
      ],
      root_cause: {
        description: 'The v1.4.0-rc.1 release introduced event sourcing for slice lifecycle management (ADR-001). The new implementation creates two separate database connections per request — one for the state mutation and one for the event log append. This doubled the connection requirement, exceeding the PostgreSQL pool limit of 100 connections within 14 minutes of deployment under normal QA load.',
        category: 'Configuration / Capacity',
        contributing_factors: [
          'Event sourcing implementation used separate transactions instead of batched writes',
          'PostgreSQL connection pool size not updated to account for doubled connection requirement',
          'Load testing for v1.4.0 did not include event sourcing path — tested only with feature flag off',
          'No connection pool utilization alert at 60% threshold (only at 80%) — late detection window'
        ]
      },
      what_went_well: [
        'Monitor Agent detected anomaly within 14 minutes of deployment',
        'RCA was completed in 25 minutes from first alert',
        'Mitigation (pool size increase) resolved the issue without rollback',
        'No data loss or corruption — event sourcing log maintained integrity',
        'Smoke tests correctly passed — issue only manifests under sustained load'
      ],
      what_went_wrong: [
        'Load testing coverage gap — event sourcing path not tested under load',
        'Alert threshold too high (80%) — earlier warning at 60% would have caught issue 5 minutes sooner',
        'Connection pool sizing not reviewed as part of architecture review checklist',
        'Event sourcing implementation did not follow ADR-001 guidance to use single transaction'
      ],
      lessons_learned: [
        'All ADR implementation changes must include capacity review for infrastructure dependencies',
        'Load tests must cover all feature-flagged paths, not just the default path',
        'Connection pool and resource utilization should have tiered alerts (60%, 80%, 95%)',
        'Review Agent checklist should include infrastructure capacity impact assessment'
      ]
    },
    action_items: [
      {
        id: 'AI-001',
        priority: 'P0',
        title: 'Batch event-sourcing writes into single transaction',
        owner: 'Backend Team',
        status: 'In Progress',
        due_date: '2026-03-26',
        jira_ticket: 'PLAT-892',
        description: 'Refactor SliceService to use Prisma $transaction for state mutation + event log in single connection'
      },
      {
        id: 'AI-002',
        priority: 'P0',
        title: 'Add PgBouncer connection pooling layer',
        owner: 'Platform Team',
        status: 'Not Started',
        due_date: '2026-03-27',
        jira_ticket: 'PLAT-893',
        description: 'Deploy PgBouncer in transaction mode to multiplex connections and prevent pool exhaustion'
      },
      {
        id: 'AI-003',
        priority: 'P1',
        title: 'Add tiered DB connection pool alerts',
        owner: 'SRE Team',
        status: 'Not Started',
        due_date: '2026-03-28',
        jira_ticket: 'PLAT-894',
        description: 'Configure Datadog alerts at 60% (warning), 80% (high), 95% (critical) connection pool thresholds'
      },
      {
        id: 'AI-004',
        priority: 'P1',
        title: 'Update load test suite for event sourcing',
        owner: 'QA Team',
        status: 'Not Started',
        due_date: '2026-03-29',
        jira_ticket: 'PLAT-895',
        description: 'Add k6 load test scenario that exercises event sourcing code path under 500+ concurrent connections'
      },
      {
        id: 'AI-005',
        priority: 'P2',
        title: 'Add infrastructure capacity review to Review Agent',
        owner: 'Architecture Team',
        status: 'Not Started',
        due_date: '2026-04-01',
        jira_ticket: 'PLAT-896',
        description: 'Extend Review Agent checklist to assess DB connections, Kafka partitions, and memory requirements for architecture changes'
      }
    ],
    pattern_analysis: {
      title: 'Incident Pattern Analysis — Last 90 Days',
      total_incidents: 8,
      recurring_patterns: [
        {
          pattern: 'Database Connection Exhaustion',
          occurrences: 3,
          incidents: ['INC-2026-0115-002', 'INC-2026-0220-001', 'INC-2026-0324-001'],
          trend: 'Increasing',
          root_causes: ['Connection leak in retry logic', 'Missing connection timeout', 'Event sourcing doubling connections'],
          recommendation: 'Implement connection pool monitoring as standard deployment gate. Add PgBouncer as permanent infrastructure layer.'
        },
        {
          pattern: 'Deployment-Triggered Performance Degradation',
          occurrences: 2,
          incidents: ['INC-2026-0220-001', 'INC-2026-0324-001'],
          trend: 'Stable',
          root_causes: ['Insufficient load testing before deployment', 'Configuration not updated for new features'],
          recommendation: 'Mandate pre-deployment load testing for all changes touching data layer or event processing.'
        },
        {
          pattern: 'Kafka Consumer Lag Spikes',
          occurrences: 2,
          incidents: ['INC-2026-0115-002', 'INC-2026-0324-001'],
          trend: 'Stable',
          root_causes: ['Upstream DB contention slowing event processing', 'Consumer group rebalancing during deployment'],
          recommendation: 'Implement Kafka consumer lag as deployment readiness gate. Auto-pause deployments if lag > 5K.'
        }
      ]
    },
    metrics: {
      title: 'Incident Response Metrics',
      current_incident: {
        mttd: '14 minutes',
        mttr: '40 minutes',
        mtta: '1 minute',
        severity: 'SEV-2',
        services_affected: 4,
        data_loss: 'None'
      },
      trends: {
        period: 'Last 90 days',
        avg_mttd: '18 minutes',
        avg_mttr: '52 minutes',
        avg_mtta: '3 minutes',
        incidents_by_severity: { 'SEV-1': 0, 'SEV-2': 3, 'SEV-3': 4, 'SEV-4': 1 },
        improvement: 'MTTR improved 23% from Q4 2025 (68 min → 52 min)',
        action_item_completion_rate: '78%'
      }
    },
    runbook_updates: [
      {
        runbook: 'RB-002: Database Connection Pool Exhaustion Recovery',
        change: 'Added step: Check for event sourcing dual-connection pattern as root cause',
        status: 'Recommended',
        reason: 'New failure mode identified — event sourcing creates 2x connection demand'
      },
      {
        runbook: 'RB-003: Kafka Consumer Lag Remediation',
        change: 'Added step: Verify upstream DB health before scaling consumers — lag may be symptom of DB contention',
        status: 'Recommended',
        reason: 'Root cause was DB, not Kafka — scaling consumers alone would not resolve'
      }
    ],
    summary: {
      incident_id: 'INC-2026-0324-001',
      severity: 'SEV-2',
      status: 'Resolved',
      duration: '40 minutes',
      services_affected: 4,
      action_items: 5,
      action_items_completed: 0,
      action_items_in_progress: 1,
      recurring_patterns: 3,
      avg_mttr_trend: '52 min (↓23% from Q4)',
      runbook_updates_suggested: 2,
      generated_at: '2026-03-24T14:00:00Z'
    }
  };
}
