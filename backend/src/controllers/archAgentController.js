import {
  generateArchSpec,
  listInputStories,
  listEpics,
  listStoriesByEpics,
  getJiraConnectionStatus,
  publishArchToJira,
  buildArchMarkdown
} from '../services/archAgentService.js';

export function getConnectionStatus(req, res) {
  res.json(getJiraConnectionStatus());
}

export function getEpics(req, res) {
  res.json({ items: listEpics() });
}

export async function getStoriesByEpics(req, res, next) {
  try {
    const { epicKeys } = req.body || {};
    if (!epicKeys?.length) {
      return res.status(400).json({ message: 'epicKeys array is required.' });
    }
    const result = await listStoriesByEpics(epicKeys);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function getStories(req, res) {
  res.json({ items: listInputStories() });
}

export async function generate(req, res, next) {
  try {
    const { storyIds, model } = req.body || {};
    const result = await generateArchSpec({ storyIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function publishToJira(req, res, next) {
  try {
    const { epicKeys, spec } = req.body || {};
    if (!epicKeys?.length || !spec) {
      return res.status(400).json({ message: 'epicKeys array and spec are required.' });
    }
    const result = await publishArchToJira({ epicKeys, spec });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function exportMarkdown(req, res) {
  const { spec } = req.body || {};
  if (!spec) {
    return res.status(400).json({ message: 'spec is required.' });
  }
  const markdown = buildArchMarkdown(spec);
  return res.json({ markdown });
}
