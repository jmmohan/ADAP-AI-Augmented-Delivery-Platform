export function buildMockReviewReport(items) {
  return {
    arch_review: {
      title: 'Architecture Conformance Review — 5G Slice Platform v1.4.0',
      overall_verdict: 'Approved with Conditions',
      score: 87,
      max_score: 100,
      categories: [
        {
          name: 'Component Boundary Compliance',
          score: 92,
          status: 'Pass',
          findings: [
            'All 5 components respect defined service boundaries from HLD',
            'No cross-boundary direct database access detected',
            'Event-driven communication between Slice Provisioning and SLA Monitor adheres to ADR-003'
          ],
          violations: []
        },
        {
          name: 'ADR Adherence',
          score: 85,
          status: 'Pass with Notes',
          findings: [
            'ADR-001 (Event Sourcing): Correctly implemented for slice lifecycle transitions',
            'ADR-002 (Schema Isolation): Tenant isolation verified at schema level',
            'ADR-003 (Kafka Backbone): Avro schemas registered, topic naming follows convention'
          ],
          violations: [
            { severity: 'Medium', rule: 'ADR-002', description: 'Shared table `audit_log` uses row-level security instead of schema isolation — acceptable but deviates from ADR decision', recommendation: 'Document as ADR-002 amendment or migrate to schema-level isolation' }
          ]
        },
        {
          name: 'API Contract Compliance',
          score: 90,
          status: 'Pass',
          findings: [
            'All 12 endpoints match OpenAPI 3.0 specification',
            'Request/response schemas validated against generated contracts',
            'Proper HTTP status codes used (201 for creation, 404 for not found)'
          ],
          violations: [
            { severity: 'Low', rule: 'OpenAPI-Spec', description: 'PATCH /api/v1/slices/{id} missing from implementation but defined in spec', recommendation: 'Implement PATCH endpoint or remove from OpenAPI contract' }
          ]
        },
        {
          name: 'Design Pattern Correctness',
          score: 88,
          status: 'Pass',
          findings: [
            'Dependency injection used consistently across all NestJS modules',
            'Repository pattern correctly abstracts data access layer',
            'CQRS separation between read and write models in SliceService'
          ],
          violations: [
            { severity: 'Low', rule: 'DI-Pattern', description: 'EventBusService uses static method for Kafka producer initialization instead of injectable factory', recommendation: 'Refactor to use NestJS custom provider with useFactory' }
          ]
        },
        {
          name: 'Scalability & Resilience',
          score: 84,
          status: 'Pass with Notes',
          findings: [
            'Horizontal scaling supported via stateless service design',
            'Circuit breaker pattern applied on external API calls',
            'Database connection pooling configured with appropriate limits'
          ],
          violations: [
            { severity: 'Medium', rule: 'Resilience', description: 'No retry policy on Kafka producer — transient broker failures will cause message loss', recommendation: 'Configure idempotent producer with retries=3 and acks=all' }
          ]
        }
      ]
    },
    compliance_checks: [
      { check: 'All ADRs addressed in implementation', status: 'Pass', value: '3/3 ADRs compliant' },
      { check: 'OpenAPI contract matches endpoints', status: 'Warning', value: '11/12 endpoints (1 missing PATCH)' },
      { check: 'Component boundaries respected', status: 'Pass', value: '5/5 services compliant' },
      { check: 'No cross-service direct DB access', status: 'Pass', value: '0 violations detected' },
      { check: 'Event schema registry up to date', status: 'Pass', value: 'All 8 Avro schemas registered' },
      { check: 'API versioning enforced', status: 'Pass', value: '/api/v1/ prefix on all endpoints' },
      { check: 'Sequence diagrams match implementation', status: 'Pass', value: '4/4 flows verified' },
      { check: 'Security architecture review', status: 'Pass', value: 'OAuth2 + mTLS configured' }
    ],
    summary: {
      overall_verdict: 'Approved with Conditions',
      arch_score: 87,
      total_violations: 4,
      critical_violations: 0,
      high_violations: 0,
      medium_violations: 2,
      low_violations: 2,
      conditions: [
        'Document ADR-002 amendment for audit_log table isolation approach',
        'Configure Kafka producer retry policy before production deployment'
      ],
      reviewer: 'AI Architecture Review Agent',
      reviewed_at: '2026-04-06T11:15:00Z'
    }
  };
}
