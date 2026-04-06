import { generateDocumentation, listDocItems } from '../services/docAgentService.js';

export function getItems(req, res) {
  res.json({ items: listDocItems() });
}

export async function generate(req, res, next) {
  try {
    const { itemIds, model } = req.body || {};
    const result = await generateDocumentation({ itemIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
