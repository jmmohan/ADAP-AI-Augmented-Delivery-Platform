import {
  generateTestPlan,
  listInputStories,
  listEpics,
  listStoriesByEpics,
  getJiraConnectionStatus,
  publishTestPlanToJira,
  buildTestPlanMarkdown
} from '../services/testAgentService.js';

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
    const result = await generateTestPlan({ storyIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function publishToJira(req, res, next) {
  try {
    const { epicKeys, plan } = req.body || {};
    if (!epicKeys?.length || !plan) {
      return res.status(400).json({ message: 'epicKeys array and plan data are required.' });
    }
    const result = await publishTestPlanToJira({ epicKeys, plan });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function exportMarkdown(req, res) {
  const { plan } = req.body || {};
  if (!plan) {
    return res.status(400).json({ message: 'plan data is required.' });
  }
  const markdown = buildTestPlanMarkdown(plan);
  return res.json({ markdown });
}
