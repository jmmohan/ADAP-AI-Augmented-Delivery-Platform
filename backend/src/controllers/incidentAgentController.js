import { generateIncidentReport, listIncidents } from '../services/incidentAgentService.js';

export function getItems(req, res) {
  res.json({ items: listIncidents() });
}

export async function generate(req, res, next) {
  try {
    const { incidentIds, model } = req.body || {};
    const result = await generateIncidentReport({ incidentIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
