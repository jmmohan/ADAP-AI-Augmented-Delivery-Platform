export function buildMockArchSpec(stories) {
  return {
    hld: {
      title: 'High-Level Design — 5G Network Slice Management Platform',
      overview:
        'Event-driven microservices architecture for managing 5G network slice lifecycle across multi-tenant enterprise environments. The platform provides real-time SLA enforcement, usage metering, and full observability through distributed tracing.',
      architecture_style: 'Event-Driven Microservices',
      components: [
        {
          name: 'Slice Provisioning Service',
          type: 'service',
          responsibility:
            'Handles CRUD operations for network slice lifecycle — creation, activation, modification, decommissioning. Enforces tenant quotas and validates slice templates against 3GPP specifications.',
          tech_stack: ['Node.js 20', 'NestJS', 'Prisma ORM', 'PostgreSQL']
        },
        {
          name: 'API Gateway',
          type: 'gateway',
          responsibility:
            'Centralized ingress with tenant-aware routing, JWT validation, rate limiting per SLA tier, and request/response transformation.',
          tech_stack: ['Kong Gateway', 'Lua plugins', 'Redis']
        },
        {
          name: 'Event Bus',
          type: 'queue',
          responsibility:
            'Asynchronous event backbone for slice lifecycle events, SLA breach notifications, and billing triggers. Guarantees at-least-once delivery with dead-letter handling.',
          tech_stack: ['Apache Kafka', 'Schema Registry', 'Avro']
        },
        {
          name: 'SLA Monitoring Engine',
          type: 'service',
          responsibility:
            'Real-time evaluation of network slice KPIs against contractual SLA thresholds. Triggers alerts and auto-remediation workflows on breach detection.',
          tech_stack: ['Python', 'FastAPI', 'InfluxDB', 'Grafana']
        },
        {
          name: 'Slice Data Store',
          type: 'database',
          responsibility:
            'Persistent storage for slice configurations, tenant profiles, SLA contracts, and audit logs. Supports multi-tenant isolation at the schema level.',
          tech_stack: ['PostgreSQL 16', 'pgvector', 'TimescaleDB extension']
        }
      ],
      integration_patterns: [
        'Event Sourcing for slice lifecycle state transitions',
        'CQRS for read-heavy dashboard queries vs write-heavy provisioning',
        'Saga pattern for distributed slice provisioning across RAN and Core',
        'Circuit Breaker for upstream 3GPP network function calls'
      ],
      nfrs: [
        {
          category: 'Performance',
          requirement: 'Slice provisioning API must respond within target latency',
          target: 'P95 < 200ms, P99 < 500ms'
        },
        {
          category: 'Scalability',
          requirement: 'Support concurrent tenant operations at scale',
          target: '10,000 concurrent slices across 500 tenants'
        },
        {
          category: 'Reliability',
          requirement: 'Platform availability target with zero-downtime deployments',
          target: '99.95% uptime, RTO < 5min, RPO < 1min'
        },
        {
          category: 'Security',
          requirement: 'Tenant isolation, encryption at rest and in transit',
          target: 'SOC 2 Type II compliant, mTLS between services'
        }
      ]
    },
    lld: {
      modules: [
        {
          name: 'Slice Provisioning Module',
          component: 'Slice Provisioning Service',
          classes: [
            'SliceController',
            'SliceService',
            'SliceRepository',
            'SliceTemplateValidator',
            'QuotaEnforcer'
          ],
          endpoints: [
            { method: 'POST', path: '/api/v1/slices', description: 'Create a new network slice from template' },
            { method: 'GET', path: '/api/v1/slices/{id}', description: 'Retrieve slice details and current state' },
            { method: 'PUT', path: '/api/v1/slices/{id}/activate', description: 'Activate a provisioned slice' },
            { method: 'DELETE', path: '/api/v1/slices/{id}', description: 'Decommission and release slice resources' }
          ],
          database_entities: ['Slice', 'SliceTemplate', 'TenantQuota', 'ProvisioningAudit']
        },
        {
          name: 'Tenant Auth Module',
          component: 'API Gateway',
          classes: ['AuthMiddleware', 'TenantResolver', 'RateLimiter', 'JWTValidator', 'ScopeEnforcer'],
          endpoints: [
            { method: 'POST', path: '/api/v1/auth/token', description: 'Issue JWT token for tenant service account' },
            { method: 'GET', path: '/api/v1/tenants/{id}/quotas', description: 'Retrieve tenant quota and usage' }
          ],
          database_entities: ['Tenant', 'ServiceAccount', 'RateLimitPolicy']
        },
        {
          name: 'SLA Evaluation Module',
          component: 'SLA Monitoring Engine',
          classes: [
            'SLAEvaluator',
            'MetricCollector',
            'BreachDetector',
            'AlertDispatcher',
            'RemediationOrchestrator'
          ],
          endpoints: [
            { method: 'GET', path: '/api/v1/sla/{sliceId}/status', description: 'Current SLA compliance status' },
            { method: 'GET', path: '/api/v1/sla/{sliceId}/history', description: 'Historical SLA compliance data' }
          ],
          database_entities: ['SLAContract', 'SLAMetric', 'BreachEvent', 'RemediationAction']
        }
      ]
    },
    adrs: [
      {
        id: 'ADR-001',
        title: 'Use Event Sourcing for Slice Lifecycle Management',
        status: 'Accepted',
        context:
          'Network slice state transitions are critical for audit, billing, and compliance. Traditional CRUD updates lose historical context and make it difficult to reconstruct the exact state at any point in time.',
        decision:
          'Adopt event sourcing for all slice lifecycle state transitions. Each state change (Created, Provisioning, Active, Modifying, Decommissioning) is stored as an immutable event. Current state is derived by replaying events.',
        consequences:
          'Increased storage requirements for event log. Need for snapshot mechanism to optimize read performance. Full audit trail and ability to replay/debug any slice lifecycle. Enables temporal queries for billing reconciliation.'
      },
      {
        id: 'ADR-002',
        title: 'PostgreSQL with Schema-Level Tenant Isolation',
        status: 'Accepted',
        context:
          'Multi-tenant data isolation is a regulatory requirement. Options considered: database-per-tenant, schema-per-tenant, row-level security. Database-per-tenant has high operational overhead for 500+ tenants.',
        decision:
          'Use PostgreSQL with schema-per-tenant isolation for slice data. Shared schema for platform-level configuration. Row-level security as defense-in-depth within shared tables.',
        consequences:
          'Moderate operational overhead (schema migrations across tenants). Strong isolation without database proliferation. Connection pooling via PgBouncer required. Supports regulatory compliance for data residency requirements.'
      },
      {
        id: 'ADR-003',
        title: 'Kafka as Event Backbone with Avro Schema Registry',
        status: 'Accepted',
        context:
          'The platform requires reliable async communication between 5+ services with guaranteed delivery, ordered processing, and schema evolution as the platform grows.',
        decision:
          'Use Apache Kafka with Confluent Schema Registry (Avro format) as the central event backbone. Topic-per-aggregate pattern with partition keys on tenant ID for ordering guarantees.',
        consequences:
          'Operational complexity of Kafka cluster management. Schema evolution requires backward compatibility discipline. Excellent throughput (100K+ events/sec) and replay capability. Dead-letter topics for poison pill handling.'
      }
    ],
    openapi_snippet: `openapi: "3.0.3"
info:
  title: 5G Slice Management API
  version: "1.0.0"
paths:
  /api/v1/slices:
    post:
      summary: Create a new network slice
      operationId: createSlice
      tags: [Slices]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [templateId, tenantId, name]
              properties:
                templateId:
                  type: string
                  example: "tmpl-embb-standard"
                tenantId:
                  type: string
                  format: uuid
                name:
                  type: string
                  example: "enterprise-campus-slice-01"
                slaProfile:
                  type: string
                  enum: [bronze, silver, gold, platinum]
      responses:
        "201":
          description: Slice provisioning initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                  status:
                    type: string
                    enum: [provisioning]
  /api/v1/slices/{id}:
    get:
      summary: Get slice details
      operationId: getSlice
      tags: [Slices]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Slice details
        "404":
          description: Slice not found`,
    diagrams: {
      system_context: `graph TD
    Tenant[Enterprise Tenant] -->|REST API| GW[API Gateway]
    GW -->|Route + Auth| SPS[Slice Provisioning Service]
    GW -->|Route| SLA[SLA Monitoring Engine]
    SPS -->|Events| KAFKA[Kafka Event Bus]
    SPS -->|Read/Write| PG[(PostgreSQL)]
    SLA -->|Subscribe| KAFKA
    SLA -->|Metrics| TSDB[(TimescaleDB)]
    SLA -->|Alerts| ALERT[Alert Manager]
    KAFKA -->|Events| BILLING[Billing Service]
    KAFKA -->|Events| AUDIT[Audit Log]
    SPS -->|Provision| RAN[3GPP RAN NFs]
    SPS -->|Provision| CORE[3GPP Core NFs]

    style GW fill:#0f766e,color:#fff
    style KAFKA fill:#f59e0b,color:#000
    style PG fill:#3b82f6,color:#fff`,
      sequence: `sequenceDiagram
    participant T as Tenant
    participant GW as API Gateway
    participant SPS as Slice Service
    participant DB as PostgreSQL
    participant K as Kafka
    participant RAN as 3GPP RAN
    participant SLA as SLA Monitor

    T->>GW: POST /api/v1/slices
    GW->>GW: Validate JWT + Rate Limit
    GW->>SPS: Forward Request
    SPS->>DB: Validate Quota
    SPS->>DB: Insert Slice (status: provisioning)
    SPS->>K: Publish SliceCreated event
    SPS-->>GW: 201 Created
    GW-->>T: Slice ID + status

    K->>SPS: Process SliceCreated
    SPS->>RAN: Provision RAN resources
    RAN-->>SPS: Provisioned
    SPS->>DB: Update status: active
    SPS->>K: Publish SliceActivated event
    K->>SLA: Subscribe SliceActivated
    SLA->>SLA: Begin SLA monitoring`
    }
  };
}
