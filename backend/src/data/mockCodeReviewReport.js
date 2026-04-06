export function buildMockCodeReviewReport(filePaths) {
  // Build issues referencing actual file paths when available
  const files = filePaths || [];
  const sampleFile = (idx) => files[idx % files.length] || 'src/app.service.ts';

  return {
    code_review: {
      title: 'Code Quality Review',
      overall_verdict: 'Approved with Conditions',
      score: 82,
      max_score: 100,
      issues: [
        {
          id: 'VIO-001',
          severity: 'High',
          category: 'Security',
          file: sampleFile(0),
          line: 47,
          message: 'User-supplied data used in query without parameterization',
          recommendation: 'Use parameterized queries or prepared statements',
          code_snippet: 'const result = db.query(`SELECT * FROM users WHERE id = ${userId}`);'
        },
        {
          id: 'VIO-002',
          severity: 'Medium',
          category: 'Maintainability',
          file: sampleFile(1),
          line: 23,
          message: 'String literal duplicated 4 times — extract to constant',
          recommendation: 'Create a constants file for repeated string values',
          code_snippet: '"connection.failed"'
        },
        {
          id: 'VIO-003',
          severity: 'Medium',
          category: 'Reliability',
          file: sampleFile(2),
          line: 89,
          message: 'Unused local variable — dead code after refactoring',
          recommendation: 'Remove unused variable or implement the intended logic',
          code_snippet: 'let retryCount = 0;'
        },
        {
          id: 'VIO-004',
          severity: 'Low',
          category: 'Convention',
          file: sampleFile(0),
          line: 112,
          message: 'TODO comment found — unfinished implementation',
          recommendation: 'Create a ticket and remove TODO, or implement the feature',
          code_snippet: '// TODO: implement notification webhook'
        },
        {
          id: 'VIO-005',
          severity: 'Medium',
          category: 'Performance',
          file: sampleFile(3 < files.length ? 3 : 0),
          line: 67,
          message: 'Cognitive complexity of method is 18 (max allowed: 15)',
          recommendation: 'Extract sub-logic into separate private methods',
          code_snippet: 'async function processRequest(req) { ... }'
        },
        {
          id: 'VIO-006',
          severity: 'High',
          category: 'Security',
          file: sampleFile(1),
          line: 31,
          message: 'Using Math.random() for token generation — not cryptographically secure',
          recommendation: 'Use crypto.randomBytes() for secure token generation',
          code_snippet: 'const token = Math.random().toString(36).substring(2);'
        }
      ]
    },
    summary: {
      overall_verdict: 'Approved with Conditions',
      code_score: 82,
      total_issues: 6,
      critical_issues: 0,
      high_issues: 2,
      medium_issues: 3,
      low_issues: 1
    }
  };
}

export function buildMockFixes(issues, fileContents) {
  // Generate mock fixes for each unique file referenced by the issues
  const fileIssueMap = {};
  for (const issue of issues) {
    if (!fileIssueMap[issue.file]) fileIssueMap[issue.file] = [];
    fileIssueMap[issue.file].push(issue);
  }

  return Object.entries(fileIssueMap).map(([file, fileIssues]) => {
    const original = fileContents[file] || '// original file content not available';
    // In mock mode, simulate a fix by appending a comment
    const fixedContent = original + '\n// [AADP Code Review Agent] Applied fixes for: ' +
      fileIssues.map((i) => i.id).join(', ') + '\n';

    return {
      file,
      original_snippet: fileIssues.map((i) => i.code_snippet || '').join('\n'),
      fixed_snippet: fileIssues.map((i) => `// Fixed ${i.id}: ${i.recommendation}`).join('\n'),
      fixed_content: fixedContent,
      issues_fixed: fileIssues.map((i) => i.id)
    };
  });
}
