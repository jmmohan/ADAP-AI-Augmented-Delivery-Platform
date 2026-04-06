export function buildMockDeployment(artifacts) {
  return {
    pipeline: {
      id: 'PIPE-2026-0324-001',
      name: '5G Slice Platform — QA Deploy',
      trigger: 'PR merge to develop',
      status: 'Succeeded',
      duration: '4m 32s',
      stages: [
        { name: 'Build', status: 'Passed', duration: '1m 12s', steps: ['npm ci', 'npm run build', 'Docker build & tag'] },
        { name: 'Unit Tests', status: 'Passed', duration: '0m 45s', steps: ['Jest --coverage', 'Coverage gate: 87.3%', '13/13 passed'] },
        { name: 'Security Scan', status: 'Passed', duration: '0m 28s', steps: ['Trivy container scan', 'OWASP dependency check', '0 critical CVEs'] },
        { name: 'Deploy to QA', status: 'Passed', duration: '1m 05s', steps: ['Helm upgrade --install', 'K8s rollout status', 'Health check passed'] },
        { name: 'Smoke Tests', status: 'Passed', duration: '1m 02s', steps: ['Playwright smoke suite', 'API health endpoints', '12/12 passed'] }
      ]
    },
    environment: {
      name: 'QA',
      cluster: 'aks-telecom-qa-eastus',
      namespace: 'slice-platform-qa',
      replicas: 3,
      image_tag: 'v1.4.0-rc.1',
      deployed_at: '2026-03-24T10:32:00Z',
      endpoints: {
        api: 'https://qa-api.slice-platform.internal',
        dashboard: 'https://qa-dashboard.slice-platform.internal',
        grafana: 'https://grafana.qa.internal/d/slice-platform'
      }
    },
    test_results: {
      smoke: { total: 12, passed: 12, failed: 0, skipped: 0 },
      regression: { total: 86, passed: 83, failed: 2, skipped: 1 },
      performance: { p50_ms: 45, p95_ms: 180, p99_ms: 420, throughput_rps: 1200, error_rate: '0.02%' },
      failures: [
        {
          test: 'test/e2e/billing-reconciliation.spec.ts',
          error: 'Timeout: billing webhook did not respond within 10s',
          severity: 'Medium',
          jira_ticket: 'PLAT-789'
        },
        {
          test: 'test/e2e/slice-resize-concurrent.spec.ts',
          error: 'AssertionError: expected 3 replicas but found 2 during concurrent resize',
          severity: 'Low',
          jira_ticket: 'PLAT-790'
        }
      ]
    },
    rollback_plan: {
      previous_version: 'v1.3.2',
      strategy: 'Helm rollback with blue-green switch',
      estimated_time: '< 2 minutes',
      auto_rollback_triggers: [
        'Error rate > 5% sustained for 2 minutes',
        'P99 latency > 2s sustained for 1 minute',
        'Health check failures > 3 consecutive',
        'OOM kill detected on any pod'
      ]
    },
    summary: {
      status: 'Deployed to QA',
      version: 'v1.4.0-rc.1',
      total_tests: 98,
      pass_rate: '96.9%',
      open_defects: 2,
      next_step: 'Staging deployment pending QA sign-off'
    }
  };
}
