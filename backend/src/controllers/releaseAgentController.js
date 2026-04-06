import { generateReleaseReport, listReleaseItems } from '../services/releaseAgentService.js';

export function getItems(req, res) {
  res.json({ items: listReleaseItems() });
}

export async function generate(req, res, next) {
  try {
    const { itemIds, model } = req.body || {};
    const result = await generateReleaseReport({ itemIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
