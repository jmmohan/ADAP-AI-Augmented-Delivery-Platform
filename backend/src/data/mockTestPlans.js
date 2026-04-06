export function buildMockTestPlan(stories) {
  return {
    strategy: {
      approach: 'Risk-Based Testing with BDD',
      test_levels: ['Unit', 'Integration', 'E2E', 'Performance', 'Security'],
      tools: {
        unit: 'Jest + Pytest',
        integration: 'Testcontainers',
        e2e: 'Playwright',
        performance: 'k6',
        security: 'OWASP ZAP'
      },
      coverage_target: '85%',
      environments: ['dev', 'staging', 'pre-prod']
    },
    test_suites: [
      {
        id: 'TS-001',
        name: 'Slice Provisioning API Tests',
        type: 'integration',
        story_ids: ['US-001'],
        test_cases: [
          { id: 'TC-001', title: 'Create slice with valid template returns 201', priority: 'P0', expected_result: 'Slice created with status provisioning', automated: true },
          { id: 'TC-002', title: 'Create slice exceeding tenant quota returns 429', priority: 'P0', expected_result: 'QuotaExceeded error with current/max values', automated: true },
          { id: 'TC-003', title: 'Slice provisioning completes within 30s SLA', priority: 'P0', expected_result: 'Slice transitions to active within 30 seconds', automated: true },
          { id: 'TC-004', title: 'Concurrent slice creation maintains data consistency', priority: 'P1', expected_result: 'No duplicate slices or quota race conditions', automated: true }
        ]
      },
      {
        id: 'TS-002',
        name: 'Tenant Auth & Isolation Tests',
        type: 'security',
        story_ids: ['US-002'],
        test_cases: [
          { id: 'TC-005', title: 'Unauthenticated request returns 401', priority: 'P0', expected_result: '401 Unauthorized with WWW-Authenticate header', automated: true },
          { id: 'TC-006', title: 'Tenant A cannot access Tenant B slices', priority: 'P0', expected_result: '403 Forbidden, audit log entry created', automated: true },
          { id: 'TC-007', title: 'Expired JWT token is rejected', priority: 'P1', expected_result: '401 with token_expired error code', automated: true },
          { id: 'TC-008', title: 'Rate limiting enforced per SLA tier', priority: 'P1', expected_result: '429 after exceeding tier limit', automated: true }
        ]
      },
      {
        id: 'TS-003',
        name: 'SLA Monitoring E2E Tests',
        type: 'e2e',
        story_ids: ['US-003'],
        test_cases: [
          { id: 'TC-009', title: 'SLA breach triggers alert within 5s', priority: 'P0', expected_result: 'Alert dispatched to configured channel within 5 seconds', automated: true },
          { id: 'TC-010', title: 'Dashboard displays real-time slice KPIs', priority: 'P1', expected_result: 'Latency, throughput, error rate visible and updating', automated: true },
          { id: 'TC-011', title: 'Historical SLA data queryable for last 90 days', priority: 'P2', expected_result: 'Time-series data returned with correct aggregation', automated: false }
        ]
      },
      {
        id: 'TS-004',
        name: 'Event Bus Reliability Tests',
        type: 'integration',
        story_ids: ['US-004'],
        test_cases: [
          { id: 'TC-012', title: 'Slice lifecycle event published on state change', priority: 'P0', expected_result: 'Kafka topic receives event within 500ms', automated: true },
          { id: 'TC-013', title: 'Dead-letter handling for malformed events', priority: 'P1', expected_result: 'Poison message routed to DLQ, processing continues', automated: true },
          { id: 'TC-014', title: 'Event ordering maintained per tenant partition', priority: 'P0', expected_result: 'Events consumed in publish order per partition key', automated: true }
        ]
      }
    ],
    bdd_scenarios: [
      {
        feature: 'Network Slice Provisioning',
        story_id: 'US-001',
        scenarios: [
          {
            name: 'Successful slice provisioning',
            given: 'a valid tenant with available quota and an approved slice template "tmpl-embb-standard"',
            when: 'the tenant submits a slice creation request via the provisioning API',
            then: 'the slice is created with status "provisioning" and transitions to "active" within 30 seconds',
            tags: ['@smoke', '@critical', '@provisioning']
          },
          {
            name: 'Slice provisioning rejected due to quota exhaustion',
            given: 'a tenant who has consumed 100% of their allocated slice quota',
            when: 'the tenant attempts to create an additional network slice',
            then: 'the API returns a 429 QuotaExceeded error with current and maximum quota values',
            tags: ['@quota', '@negative']
          }
        ]
      },
      {
        feature: 'Tenant Isolation',
        story_id: 'US-002',
        scenarios: [
          {
            name: 'Cross-tenant access prevention',
            given: 'Tenant A has an active slice "slice-alpha" and Tenant B has a valid JWT token',
            when: 'Tenant B attempts to access the details of "slice-alpha"',
            then: 'the API returns 403 Forbidden and an audit log entry is created for the access attempt',
            tags: ['@security', '@critical', '@isolation']
          },
          {
            name: 'Token refresh maintains session continuity',
            given: 'a tenant with an active session and a JWT token expiring in 60 seconds',
            when: 'the tenant submits a token refresh request with a valid refresh token',
            then: 'a new JWT is issued and the previous token is invalidated within 5 seconds',
            tags: ['@security', '@auth']
          }
        ]
      },
      {
        feature: 'SLA Breach Detection',
        story_id: 'US-003',
        scenarios: [
          {
            name: 'Latency SLA breach triggers alert',
            given: 'an active slice with a gold SLA profile requiring P99 latency < 10ms',
            when: 'the observed P99 latency exceeds 10ms for more than 30 consecutive seconds',
            then: 'an SLA breach alert is triggered within 5 seconds and dispatched to the configured PagerDuty channel',
            tags: ['@sla', '@critical', '@monitoring']
          },
          {
            name: 'SLA compliance report generation',
            given: 'a slice that has been active for 30 days with 2 recorded SLA breaches',
            when: 'the tenant requests an SLA compliance report for the current billing period',
            then: 'a report is generated showing 99.93% compliance with breach details and remediation actions taken',
            tags: ['@sla', '@reporting']
          }
        ]
      }
    ],
    automation_snippets: [
      {
        framework: 'Playwright',
        filename: 'tests/e2e/slice-provisioning.spec.ts',
        language: 'typescript',
        code: `import { test, expect } from '@playwright/test';

test.describe('Slice Provisioning E2E', () => {
  test('should provision a new network slice', async ({ request }) => {
    const response = await request.post('/api/v1/slices', {
      data: {
        templateId: 'tmpl-embb-standard',
        tenantId: 'tenant-acme-001',
        name: 'campus-slice-e2e-test',
        slaProfile: 'gold'
      },
      headers: { Authorization: 'Bearer ' + process.env.TEST_JWT }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe('provisioning');

    // Poll until active or timeout
    await expect.poll(async () => {
      const status = await request.get('/api/v1/slices/' + body.id);
      return (await status.json()).status;
    }, { timeout: 30_000 }).toBe('active');
  });
});`
      },
      {
        framework: 'Pytest',
        filename: 'tests/integration/test_tenant_isolation.py',
        language: 'python',
        code: `import pytest
import httpx

BASE_URL = "http://localhost:3000/api/v1"

@pytest.fixture
def tenant_a_token():
    resp = httpx.post(f"{BASE_URL}/auth/token", json={
        "tenant_id": "tenant-acme-001",
        "secret": "test-secret-a"
    })
    return resp.json()["access_token"]

@pytest.fixture
def tenant_b_token():
    resp = httpx.post(f"{BASE_URL}/auth/token", json={
        "tenant_id": "tenant-globex-002",
        "secret": "test-secret-b"
    })
    return resp.json()["access_token"]

def test_cross_tenant_access_blocked(tenant_a_token, tenant_b_token):
    """Tenant B must not access Tenant A's slices."""
    # Create slice as Tenant A
    create = httpx.post(f"{BASE_URL}/slices", json={
        "templateId": "tmpl-embb-standard",
        "tenantId": "tenant-acme-001",
        "name": "isolated-slice"
    }, headers={"Authorization": f"Bearer {tenant_a_token}"})
    slice_id = create.json()["id"]

    # Attempt access as Tenant B
    resp = httpx.get(
        f"{BASE_URL}/slices/{slice_id}",
        headers={"Authorization": f"Bearer {tenant_b_token}"}
    )
    assert resp.status_code == 403`
      },
      {
        framework: 'Jest',
        filename: 'tests/unit/slice-service.spec.ts',
        language: 'typescript',
        code: `import { SliceService } from '../../src/services/sliceService';
import { SliceRepository } from '../../src/repositories/sliceRepository';
import { QuotaEnforcer } from '../../src/services/quotaEnforcer';

jest.mock('../../src/repositories/sliceRepository');
jest.mock('../../src/services/quotaEnforcer');

describe('SliceService', () => {
  let service: SliceService;
  let mockRepo: jest.Mocked<SliceRepository>;
  let mockQuota: jest.Mocked<QuotaEnforcer>;

  beforeEach(() => {
    mockRepo = new SliceRepository() as any;
    mockQuota = new QuotaEnforcer() as any;
    service = new SliceService(mockRepo, mockQuota);
  });

  it('should reject slice creation when quota exceeded', async () => {
    mockQuota.check.mockResolvedValue({ allowed: false, current: 10, max: 10 });

    await expect(service.create({
      templateId: 'tmpl-embb-standard',
      tenantId: 'tenant-acme-001',
      name: 'over-quota-slice'
    })).rejects.toThrow('QuotaExceeded');

    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});`
      }
    ],
    summary: {
      total_test_cases: 14,
      automated_count: 13,
      manual_count: 1,
      estimated_execution_time: '12 minutes (unit: 45s, integration: 3m, e2e: 5m, perf: 3m)',
      risk_areas: [
        'Cross-tenant data leakage under concurrent provisioning',
        'Kafka consumer lag causing delayed SLA breach detection',
        'Database connection pool exhaustion under load spike',
        'JWT token replay attacks within expiry window'
      ]
    }
  };
}
