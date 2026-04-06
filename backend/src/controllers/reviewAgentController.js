import { generateReviewReport, listReviewItems } from '../services/reviewAgentService.js';

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
