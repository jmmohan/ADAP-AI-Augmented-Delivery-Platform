import {
  getAllSettings,
  connectJira,
  disconnectJira,
  connectGit,
  disconnectGit,
  getAiModel,
  setAiModel
} from '../services/connectionService.js';

export function getSettings(req, res) {
  res.json(getAllSettings());
}

export async function saveJira(req, res, next) {
  try {
    const { url, project, email, token } = req.body || {};
    if (!url || !project || !email || !token) {
      return res.status(400).json({ message: 'All Jira fields are required (url, project, email, token).' });
    }
    const result = await connectJira({ url, project, email, token });
    if (!result.connected) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function removeJira(req, res) {
  disconnectJira();
  res.json({ disconnected: true });
}

export async function saveGit(req, res, next) {
  try {
    const { repoUrl, token, branch } = req.body || {};
    if (!repoUrl || !token) {
      return res.status(400).json({ message: 'Repository URL and token are required.' });
    }
    const result = await connectGit({ repoUrl, token, branch });
    if (!result.connected) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function removeGit(req, res) {
  disconnectGit();
  res.json({ disconnected: true });
}

export function saveModel(req, res) {
  const { model } = req.body || {};
  setAiModel(model);
  res.json({ model: getAiModel() });
}
