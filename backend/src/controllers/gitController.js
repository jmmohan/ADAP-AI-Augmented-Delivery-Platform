import { validateRepo, cloneAndOpen, pushGeneratedCode, createGitHubPR } from '../services/gitService.js';

export async function validate(req, res, next) {
  try {
    const { repoUrl, token } = req.body || {};
    if (!repoUrl || !token) return res.status(400).json({ message: 'repoUrl and token are required.' });
    const result = await validateRepo({ repoUrl, token });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function cloneRepo(req, res, next) {
  try {
    const { repoUrl, token, branch, storyIds } = req.body || {};
    if (!repoUrl || !token) return res.status(400).json({ message: 'repoUrl and token are required.' });
    const result = await cloneAndOpen({ repoUrl, token, branch, storyIds });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function pushCode(req, res, next) {
  try {
    const { clonedPath, storyIds, generatedFiles, token, repoUrl, commitMessage, branchPrefix } = req.body || {};
    if (!clonedPath) return res.status(400).json({ message: 'clonedPath is required.' });
    const result = await pushGeneratedCode({ clonedPath, storyIds, generatedFiles, token, repoUrl, commitMessage, branchPrefix });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createPR(req, res, next) {
  try {
    const { repoUrl, token, branch, baseBranch, title, body } = req.body || {};
    if (!repoUrl || !token || !branch) return res.status(400).json({ message: 'repoUrl, token, and branch are required.' });
    const result = await createGitHubPR({ repoUrl, token, branch, baseBranch, title, body });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
