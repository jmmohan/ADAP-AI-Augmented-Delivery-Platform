import {
  connectToJira,
  generateReport,
  isJiraConnected,
  listEpics,
  publishToJira,
  validateConnectionPayload
} from '../services/poAgentService.js';
import { toMarkdown } from '../utils/markdownExporter.js';

export function healthCheck(req, res) {
  res.json({
    status: 'ok',
    service: 'aadp-po-agent-api'
  });
}

export async function connect(req, res, next) {
  const validation = validateConnectionPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const result = await connectToJira(req.body);
    if (!result.connected) {
      return res.status(401).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export function getEpics(req, res) {
  res.json({
    items: listEpics()
  });
}

export async function generate(req, res, next) {
  try {
    const { epicKey, model } = req.body || {};
    if (!epicKey) {
      return res.status(400).json({ message: 'epicKey is required.' });
    }

    const result = await generateReport({ epicKey, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function publish(req, res, next) {
  try {
    const { epicKey, stories } = req.body || {};
    if (!epicKey || !stories?.length) {
      return res.status(400).json({ message: 'epicKey and stories array are required.' });
    }
    if (!isJiraConnected()) {
      return res.status(400).json({ message: 'Not connected to Jira. Please connect first.' });
    }

    const result = await publishToJira({ epicKey, stories });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function exportMarkdown(req, res) {
  const { epic, report } = req.body || {};
  if (!epic || !report) {
    return res.status(400).json({ message: 'epic and report are required.' });
  }

  const markdown = toMarkdown(epic, report);
  return res.json({ markdown });
}
