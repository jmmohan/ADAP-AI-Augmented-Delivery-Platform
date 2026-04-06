import { generateSecurityReport, listSecurityItems } from '../services/securityAgentService.js';

export function getItems(req, res) {
  res.json({ items: listSecurityItems() });
}

export async function generate(req, res, next) {
  try {
    const { itemIds, model } = req.body || {};
    const result = await generateSecurityReport({ itemIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
