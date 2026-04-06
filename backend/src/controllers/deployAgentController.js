import { generateDeployment, listArtifacts } from '../services/deployAgentService.js';

export function getArtifacts(req, res) {
  res.json({ items: listArtifacts() });
}

export async function generate(req, res, next) {
  try {
    const { artifactIds, model } = req.body || {};
    const result = await generateDeployment({ artifactIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
