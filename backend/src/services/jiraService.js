/**
 * Jira REST API Service
 * Handles real Jira Cloud / Data Center API calls.
 * Falls back gracefully so callers can use mock data on failure.
 */

function buildAuthHeader(email, token) {
  const encoded = Buffer.from(`${email}:${token}`).toString('base64');
  return `Basic ${encoded}`;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

/**
 * Validate Jira credentials by calling /rest/api/3/myself
 * @returns {{ valid: boolean, displayName?: string, emailAddress?: string, message?: string }}
 */
export async function validateConnection({ url, email, token }) {
  const baseUrl = normalizeBaseUrl(url);
  const res = await fetch(`${baseUrl}/rest/api/3/myself`, {
    headers: {
      Authorization: buildAuthHeader(email, token),
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 401) return { valid: false, message: 'Invalid Jira credentials — check email and API token.' };
    if (status === 403) return { valid: false, message: 'Access denied — token may lack permissions.' };
    return { valid: false, message: `Jira returned HTTP ${status}.` };
  }

  const data = await res.json();
  return { valid: true, displayName: data.displayName, emailAddress: data.emailAddress };
}

/**
 * Fetch epics from a Jira project via JQL search.
 * Tries endpoints in order of preference:
 *   1. POST /rest/api/3/search/jql  (current Jira Cloud — required since 2025)
 *   2. POST /rest/api/3/search      (older Jira Cloud / Data Center)
 *   3. GET  /rest/api/2/search      (legacy Jira Server)
 * @returns {Array<{ key, summary, description, status, priority }>}
 */
export async function fetchEpics({ url, project, email, token }) {
  const baseUrl = normalizeBaseUrl(url);
  const jql = `project = "${project}" AND issuetype = Epic ORDER BY created DESC`;
  const authHeader = buildAuthHeader(email, token);
  const searchBody = { jql, fields: ['summary', 'description', 'status', 'priority'], maxResults: 50 };
  const jsonHeaders = { Authorization: authHeader, Accept: 'application/json', 'Content-Type': 'application/json' };

  // 1. Current Jira Cloud endpoint
  let res = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(searchBody)
  });

  // 2. Fallback: older POST /rest/api/3/search (410 = removed, 404 = not found)
  if (res.status === 404 || res.status === 410) {
    res = await fetch(`${baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(searchBody)
    });
  }

  // 3. Fallback: legacy GET /rest/api/2/search
  if (res.status === 404 || res.status === 410 || res.status === 405) {
    const params = new URLSearchParams({ jql, fields: 'summary,description,status,priority', maxResults: '50' });
    res = await fetch(`${baseUrl}/rest/api/2/search?${params}`, {
      headers: { Authorization: authHeader, Accept: 'application/json' }
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Jira search failed (HTTP ${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.issues || []).map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary || '',
    description: extractPlainText(issue.fields.description),
    status: issue.fields.status?.name || 'Unknown',
    priority: issue.fields.priority?.name || 'Medium'
  }));
}

/**
 * Fetch a single Jira issue by key.
 * @returns {{ key, summary, description, status, priority }}
 */
export async function fetchIssue({ url, email, token, issueKey }) {
  const baseUrl = normalizeBaseUrl(url);
  const res = await fetch(`${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,status,priority`, {
    headers: {
      Authorization: buildAuthHeader(email, token),
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Jira issue fetch failed with HTTP ${res.status}`);
  }

  const issue = await res.json();
  return {
    key: issue.key,
    summary: issue.fields.summary || '',
    description: extractPlainText(issue.fields.description),
    status: issue.fields.status?.name || 'Unknown',
    priority: issue.fields.priority?.name || 'Medium'
  };
}

/**
 * Extract plain text from Jira's ADF (Atlassian Document Format) description.
 * Jira Cloud v3 returns descriptions in ADF JSON, not plain strings.
 */
function extractPlainText(adf) {
  if (!adf) return '';
  if (typeof adf === 'string') return adf;

  const parts = [];
  function walk(node) {
    if (node.text) parts.push(node.text);
    if (node.content) node.content.forEach(walk);
  }
  walk(adf);
  return parts.join(' ').trim();
}

/**
 * Convert plain text to Jira ADF (Atlassian Document Format).
 * Jira Cloud v3 requires descriptions in ADF JSON format.
 */
function toADF(text) {
  if (!text) return { type: 'doc', version: 1, content: [] };
  const paragraphs = text.split('\n').filter(Boolean).map((line) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: line }]
  }));
  return { type: 'doc', version: 1, content: paragraphs };
}

/**
 * Map priority string to Jira priority object.
 */
function mapPriority(priority) {
  const map = { Critical: 'Highest', High: 'High', Medium: 'Medium', Low: 'Low' };
  return { name: map[priority] || 'Medium' };
}

/**
 * Create a Story issue in Jira, linked to a parent epic.
 * @returns {{ key: string, self: string }}
 */
export async function createStory({ url, project, email, token, parentEpicKey, story }) {
  const baseUrl = normalizeBaseUrl(url);

  // Build description from story fields
  const descParts = [];
  if (story.as_a) descParts.push(`As a ${story.as_a}`);
  if (story.i_want) descParts.push(`I want ${story.i_want}`);
  if (story.so_that) descParts.push(`So that ${story.so_that}`);
  if (story.acceptance_criteria?.length) {
    descParts.push('');
    descParts.push('Acceptance Criteria:');
    story.acceptance_criteria.forEach((ac) => descParts.push(`• ${ac}`));
  }

  const issueData = {
    fields: {
      project: { key: project },
      issuetype: { name: 'Story' },
      summary: story.title || story.id,
      description: toADF(descParts.join('\n')),
      priority: mapPriority(story.priority),
      parent: { key: parentEpicKey },
      labels: ['aadp-generated']
    }
  };

  // Add story points if available (custom field varies per instance)
  // story_points will be set via the standard field if available

  const res = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(email, token),
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(issueData)
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to create issue (HTTP ${res.status}): ${errBody}`);
  }

  return res.json();
}

/**
 * Publish multiple generated stories to Jira under a parent epic.
 * @returns {{ created: Array<{ id, key }>, failed: Array<{ id, error }> }}
 */
export async function publishStories({ url, project, email, token, parentEpicKey, stories }) {
  const created = [];
  const failed = [];

  for (const story of stories) {
    try {
      const result = await createStory({ url, project, email, token, parentEpicKey, story });
      created.push({ storyId: story.id, jiraKey: result.key });
    } catch (err) {
      failed.push({ storyId: story.id, error: err.message });
    }
  }

  return { created, failed, total: stories.length };
}

/**
 * Fetch user stories (type = Story) that belong to one or more parent epics.
 * Uses JQL: issuetype = Story AND parent in (EPIC-1, EPIC-2, ...)
 * @returns {Array<{ key, summary, description, status, priority, storyPoints, parentKey }>}
 */
export async function fetchStoriesByEpics({ url, project, email, token, epicKeys }) {
  const baseUrl = normalizeBaseUrl(url);
  const epicList = epicKeys.map((k) => `"${k}"`).join(', ');
  const jql = `project = "${project}" AND issuetype = Story AND parent in (${epicList}) ORDER BY created DESC`;
  const authHeader = buildAuthHeader(email, token);
  const searchBody = {
    jql,
    fields: ['summary', 'description', 'status', 'priority', 'story_points', 'parent'],
    maxResults: 100
  };
  const jsonHeaders = { Authorization: authHeader, Accept: 'application/json', 'Content-Type': 'application/json' };

  // Try endpoints in order (same fallback pattern as fetchEpics)
  let res = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(searchBody)
  });

  if (res.status === 404 || res.status === 410) {
    res = await fetch(`${baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(searchBody)
    });
  }

  if (res.status === 404 || res.status === 410 || res.status === 405) {
    const params = new URLSearchParams({
      jql,
      fields: 'summary,description,status,priority,story_points,parent',
      maxResults: '100'
    });
    res = await fetch(`${baseUrl}/rest/api/2/search?${params}`, {
      headers: { Authorization: authHeader, Accept: 'application/json' }
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Jira story search failed (HTTP ${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.issues || []).map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary || '',
    description: extractPlainText(issue.fields.description),
    status: issue.fields.status?.name || 'Unknown',
    priority: issue.fields.priority?.name || 'Medium',
    storyPoints: issue.fields.story_points || null,
    parentKey: issue.fields.parent?.key || null
  }));
}

/**
 * Add a comment to a Jira issue (used to publish architecture docs to epics).
 * @returns {{ id: string, self: string }}
 */
export async function addCommentToIssue({ url, email, token, issueKey, commentBody }) {
  const baseUrl = normalizeBaseUrl(url);
  const res = await fetch(`${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(email, token),
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: toADF(commentBody) })
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to add comment (HTTP ${res.status}): ${errBody}`);
  }

  return res.json();
}
