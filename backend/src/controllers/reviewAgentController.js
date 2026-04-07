import {
  generateReviewReport,
  listReviewItems,
  listEpics,
  listArtifactsByEpics,
  getJiraConnectionStatus,
  publishReviewToJira,
  buildReviewMarkdown
} from '../services/reviewAgentService.js';

export function getConnectionStatus(req, res) {
  res.json(getJiraConnectionStatus());
}

export function getEpics(req, res) {
  res.json({ items: listEpics() });
}

export async function getArtifactsByEpics(req, res, next) {
  try {
    const { epicKeys } = req.body || {};
    if (!epicKeys?.length) {
      return res.status(400).json({ message: 'epicKeys array is required.' });
    }
    const result = await listArtifactsByEpics(epicKeys);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function getItems(req, res) {
  res.json({ items: listReviewItems() });
}

export async function generate(req, res, next) {
  try {
    const { itemIds, model } = req.body || {};
    const result = await generateReviewReport({ itemIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function publishToJira(req, res, next) {
  try {
    const { epicKeys, review } = req.body || {};
    if (!epicKeys?.length || !review) {
      return res.status(400).json({ message: 'epicKeys array and review data are required.' });
    }
    const result = await publishReviewToJira({ epicKeys, review });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function exportMarkdown(req, res) {
  const { review } = req.body || {};
  if (!review) {
    return res.status(400).json({ message: 'review data is required.' });
  }
  const markdown = buildReviewMarkdown(review);
  return res.json({ markdown });
}
