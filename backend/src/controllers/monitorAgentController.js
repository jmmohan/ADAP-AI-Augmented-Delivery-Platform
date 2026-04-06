import { generateTriageReport, listServices } from '../services/monitorAgentService.js';

export function getServices(req, res) {
  res.json({ items: listServices() });
}

export async function generate(req, res, next) {
  try {
    const { serviceIds, model } = req.body || {};
    const result = await generateTriageReport({ serviceIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
