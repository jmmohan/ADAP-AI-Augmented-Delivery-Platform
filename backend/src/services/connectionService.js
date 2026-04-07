/**
 * Centralized Connection Service
 * Stores Jira, GitHub, and AI Model settings in-memory.
 * All agents read from here instead of managing their own credentials.
 */

import { validateConnection, fetchEpics } from './jiraService.js';
import { validateRepo } from './gitService.js';

// ── In-memory stores ─────────────────────────────────────────────
let jiraConnection = null;   // { url, project, email, token, user, connected }
let gitConnection = null;    // { repoUrl, token, branch, repoName, connected }
let aiModel = 'gpt-4o';     // default model

// ── Jira ─────────────────────────────────────────────────────────
export function getJiraConnection() {
  return jiraConnection;
}

export function isJiraConnected() {
  return jiraConnection?.connected === true;
}

export async function connectJira({ url, project, email, token }) {
  // Validate credentials
  let validationResult;
  try {
    validationResult = await validateConnection({ url, email, token });
  } catch (err) {
    jiraConnection = null;
    return { connected: false, message: `Jira unreachable: ${err.message}` };
  }

  if (!validationResult.valid) {
    jiraConnection = null;
    return { connected: false, message: validationResult.message };
  }

  // Credentials valid — store them
  jiraConnection = {
    url, project, email, token,
    user: validationResult.displayName || email,
    connected: true
  };

  return {
    connected: true,
    user: validationResult.displayName,
    message: `Connected as ${validationResult.displayName}`
  };
}

export function disconnectJira() {
  jiraConnection = null;
}

// ── GitHub ────────────────────────────────────────────────────────
export function getGitConnection() {
  return gitConnection;
}

export function isGitConnected() {
  return gitConnection?.connected === true;
}

export async function connectGit({ repoUrl, token, branch }) {
  try {
    const result = await validateRepo({ repoUrl, token });
    gitConnection = {
      repoUrl, token,
      branch: branch || 'main',
      repoName: result.repoName,
      connected: true
    };
    return {
      connected: true,
      repoName: result.repoName,
      message: `Connected to ${result.repoName}`
    };
  } catch (err) {
    gitConnection = null;
    return { connected: false, message: err.message };
  }
}

export function disconnectGit() {
  gitConnection = null;
}

// ── AI Model ─────────────────────────────────────────────────────
export function getAiModel() {
  return aiModel;
}

export function setAiModel(model) {
  aiModel = model || 'gpt-4o';
}

// ── Combined status ──────────────────────────────────────────────
export function getAllSettings() {
  return {
    jira: jiraConnection
      ? { connected: true, url: jiraConnection.url, project: jiraConnection.project, email: jiraConnection.email, user: jiraConnection.user }
      : { connected: false },
    git: gitConnection
      ? { connected: true, repoUrl: gitConnection.repoUrl, branch: gitConnection.branch, repoName: gitConnection.repoName }
      : { connected: false },
    model: aiModel
  };
}
