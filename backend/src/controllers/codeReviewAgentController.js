import { scanFiles, reviewFiles, fixIssues, applyFixes, validateLocalFolder } from '../services/codeReviewAgentService.js';

export async function scan(req, res, next) {
  try {
    const { clonedPath } = req.body || {};
    if (!clonedPath) return res.status(400).json({ message: 'clonedPath is required.' });
    const files = await scanFiles({ clonedPath });
    res.json({ files });
  } catch (error) {
    next(error);
  }
}

export async function review(req, res, next) {
  try {
    const { clonedPath, filePaths, model } = req.body || {};
    if (!clonedPath || !filePaths?.length) return res.status(400).json({ message: 'clonedPath and filePaths are required.' });
    const result = await reviewFiles({ clonedPath, filePaths, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function fix(req, res, next) {
  try {
    const { clonedPath, issues, model } = req.body || {};
    if (!clonedPath || !issues?.length) return res.status(400).json({ message: 'clonedPath and issues are required.' });
    const result = await fixIssues({ clonedPath, issues, model });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function validateLocal(req, res, next) {
  try {
    const { folderPath } = req.body || {};
    if (!folderPath) return res.status(400).json({ message: 'folderPath is required.' });
    const result = await validateLocalFolder({ folderPath });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function apply(req, res, next) {
  try {
    const { clonedPath, fixes } = req.body || {};
    if (!clonedPath || !fixes?.length) return res.status(400).json({ message: 'clonedPath and fixes are required.' });
    const result = await applyFixes({ clonedPath, fixes });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
