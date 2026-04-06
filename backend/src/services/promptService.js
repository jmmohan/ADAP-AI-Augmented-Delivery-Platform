import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptsDir = path.join(__dirname, '..', 'prompts');

const agentIds = ['po', 'arch', 'review', 'codereview', 'test', 'code', 'deploy', 'monitor', 'security', 'doc', 'release', 'compliance', 'perf', 'incident'];

// In-memory cache of default prompts (loaded once at startup for reset)
const defaults = {};

function loadPrompt(agentId) {
  const filePath = path.join(promptsDir, `${agentId}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function savePrompt(agentId, data) {
  const filePath = path.join(promptsDir, `${agentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Cache defaults on first import
for (const id of agentIds) {
  try {
    defaults[id] = loadPrompt(id);
  } catch { /* file may not exist yet */ }
}

export function listPrompts() {
  return agentIds.map((id) => {
    try {
      const p = loadPrompt(id);
      return { agentId: p.agentId, agentName: p.agentName, lastModified: p.lastModified };
    } catch {
      return { agentId: id, agentName: id, lastModified: null };
    }
  });
}

export function getPrompt(agentId) {
  if (!agentIds.includes(agentId)) throw new Error(`Unknown agent: ${agentId}`);
  return loadPrompt(agentId);
}

export function updatePrompt(agentId, { systemPrompt, userPromptTemplate }) {
  if (!agentIds.includes(agentId)) throw new Error(`Unknown agent: ${agentId}`);
  const existing = loadPrompt(agentId);
  if (systemPrompt !== undefined) existing.systemPrompt = systemPrompt;
  if (userPromptTemplate !== undefined) existing.userPromptTemplate = userPromptTemplate;
  existing.lastModified = new Date().toISOString();
  savePrompt(agentId, existing);
  return existing;
}

export function resetPrompt(agentId) {
  if (!agentIds.includes(agentId)) throw new Error(`Unknown agent: ${agentId}`);
  const original = defaults[agentId];
  if (!original) throw new Error(`No default found for agent: ${agentId}`);
  const reset = { ...original, lastModified: new Date().toISOString() };
  savePrompt(agentId, reset);
  return reset;
}

export function getSystemPrompt(agentId) {
  try {
    return loadPrompt(agentId).systemPrompt;
  } catch {
    return null;
  }
}

export function getUserPromptTemplate(agentId) {
  try {
    return loadPrompt(agentId).userPromptTemplate;
  } catch {
    return null;
  }
}
