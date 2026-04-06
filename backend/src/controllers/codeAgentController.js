import { generateCode, listInputStories } from '../services/codeAgentService.js';

export function getStories(req, res) {
  res.json({ items: listInputStories() });
}

export async function generate(req, res, next) {
  try {
    const { storyIds, model } = req.body || {};
    const result = await generateCode({ storyIds, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
