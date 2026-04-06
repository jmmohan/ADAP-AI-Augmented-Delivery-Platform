import { hasGithubToken } from '../config.js';
import { mockEpics } from '../data/mockEpics.js';
import { buildMockReport } from '../data/mockReports.js';
import { generateReport as generateReportFromLLM } from './llmService.js';
import { validateConnection, fetchEpics, fetchIssue, publishStories } from './jiraService.js';

// In-memory store for Jira credentials from the last successful connection
let jiraCreds = null;
// Cache of epics from the last successful Jira fetch
let jiraEpicsCache = null;

export function validateConnectionPayload(payload) {
  const { url, project, email, token } = payload || {};
  if (!url || !project || !email || !token) {
    return { valid: false, message: 'All connection fields are required.' };
  }

  const isUrlValid = /^https?:\/\//i.test(url);
  if (!isUrlValid) {
    return { valid: false, message: 'Jira URL must start with http:// or https://.' };
  }

  return { valid: true };
}

/**
 * Connect to real Jira — validate credentials and fetch epics.
 * Falls back to mock if Jira is unreachable.
 */
export async function connectToJira(payload) {
  const { url, project, email, token } = payload;

  // Step 1: Validate credentials
  let validationResult;
  try {
    validationResult = await validateConnection({ url, email, token });
  } catch (err) {
    // Network-level failure — Jira completely unreachable
    jiraCreds = null;
    jiraEpicsCache = null;
    return {
      connected: true,
      source: 'mock',
      epicsCount: mockEpics.length,
      mode: 'poc',
      message: `Jira unreachable (${err.message}) — using mock data.`
    };
  }

  if (!validationResult.valid) {
    return { connected: false, source: 'jira', message: validationResult.message };
  }

  // Step 2: Credentials valid — store them, then try to fetch epics
  jiraCreds = { url, project, email, token };

  try {
    const epics = await fetchEpics({ url, project, email, token });
    jiraEpicsCache = epics;

    return {
      connected: true,
      source: 'jira',
      epicsCount: epics.length,
      user: validationResult.displayName,
      mode: 'live'
    };
  } catch (err) {
    // Credentials work but epic search failed — keep connection alive, show error
    console.error('Jira epic fetch failed:', err.message);
    jiraEpicsCache = null;
    return {
      connected: true,
      source: 'mock',
      epicsCount: mockEpics.length,
      user: validationResult.displayName,
      mode: 'poc',
      message: `Authenticated as ${validationResult.displayName}, but epic fetch failed (${err.message}). Showing mock epics.`
    };
  }
}

export function listEpics() {
  if (jiraEpicsCache && jiraEpicsCache.length > 0) {
    return jiraEpicsCache;
  }
  return mockEpics;
}

export function getEpicByKey(epicKey) {
  const allEpics = listEpics();
  return allEpics.find((epic) => epic.key === epicKey) || null;
}

export async function generateReport({ epicKey, model }) {
  // Try to get epic from Jira if connected, otherwise from cache/mock
  let epic = getEpicByKey(epicKey);

  // If not in cache but we have jira creds, try fetching directly
  if (!epic && jiraCreds) {
    try {
      epic = await fetchIssue({ ...jiraCreds, issueKey: epicKey });
    } catch {
      // ignore — will throw below
    }
  }

  if (!epic) {
    throw new Error('Selected epic was not found.');
  }

  if (!hasGithubToken()) {
    return {
      source: 'mock',
      epic,
      report: buildMockReport(epic)
    };
  }

  try {
    const generated = await generateReportFromLLM(epic, model);
    return {
      source: 'llm',
      epic,
      report: generated
    };
  } catch {
    return {
      source: 'mock',
      epic,
      report: buildMockReport(epic)
    };
  }
}

/**
 * Publish generated stories to Jira under the parent epic.
 */
export async function publishToJira({ epicKey, stories }) {
  if (!jiraCreds) {
    throw new Error('Not connected to Jira. Please connect first.');
  }

  return publishStories({
    ...jiraCreds,
    parentEpicKey: epicKey,
    stories
  });
}

export function isJiraConnected() {
  return jiraCreds !== null;
}
