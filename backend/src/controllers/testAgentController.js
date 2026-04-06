import { generateTestPlan, listInputStories } from '../services/testAgentService.js';

export function getStories(req, res) {
  res.json({ items: listInputStories() });
}

export async function generate(req, res, next) {
  try {
    const { storyIds, model } = req.body || {};
    const result = await generateTestPlan({ storyIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
