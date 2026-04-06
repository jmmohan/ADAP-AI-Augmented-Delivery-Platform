import { generatePerfReport, listPerfItems } from '../services/perfAgentService.js';

export function getItems(req, res) {
  res.json({ items: listPerfItems() });
}

export async function generate(req, res, next) {
  try {
    const { itemIds, model } = req.body || {};
    const result = await generatePerfReport({ itemIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
