import { listPrompts, getPrompt, updatePrompt, resetPrompt } from '../services/promptService.js';

export function handleListPrompts(req, res) {
  res.json({ items: listPrompts() });
}

export function handleGetPrompt(req, res) {
  try {
    const prompt = getPrompt(req.params.agentId);
    res.json(prompt);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

export function handleUpdatePrompt(req, res) {
  try {
    const { systemPrompt, userPromptTemplate } = req.body;
    const updated = updatePrompt(req.params.agentId, { systemPrompt, userPromptTemplate });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export function handleResetPrompt(req, res) {
  try {
    const reset = resetPrompt(req.params.agentId);
    res.json(reset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
