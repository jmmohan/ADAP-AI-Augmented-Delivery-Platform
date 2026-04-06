import { generateComplianceReport, listComplianceItems } from '../services/complianceAgentService.js';

export function getItems(req, res) {
  res.json({ items: listComplianceItems() });
}

export async function generate(req, res, next) {
  try {
    const { itemIds, model } = req.body || {};
    const result = await generateComplianceReport({ itemIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
