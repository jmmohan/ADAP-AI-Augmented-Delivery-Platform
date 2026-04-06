import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import simpleGit from 'simple-git';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function buildAuthUrl(repoUrl, token) {
  // Supports https://github.com/owner/repo and SSH-style URLs
  if (!repoUrl.startsWith('https://')) {
    throw new Error('Only HTTPS repository URLs are supported (e.g. https://github.com/org/repo).');
  }
  // Embed PAT: https://x-token-auth:<token>@github.com/...
  return repoUrl.replace('https://', `https://x-token-auth:${token}@`);
}

function buildBranchName(storyIds, prefix = 'codegen') {
  const slug = storyIds.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const ts = Date.now();
  return `aadp/${prefix}-${slug}-${ts}`;
}

function sanitizePath(p) {
  // Prevent path traversal
  const resolved = path.resolve(p);
  const base = path.resolve(os.tmpdir(), 'aadp-workspace');
  if (!resolved.startsWith(base)) {
    throw new Error('Invalid workspace path.');
  }
  return resolved;
}

// ----------------------------------------------------------------
// Validate repo access (no clone — just checks credentials)
// ----------------------------------------------------------------
export async function validateRepo({ repoUrl, token }) {
  if (!repoUrl || !token) throw new Error('repoUrl and token are required.');

  const authUrl = buildAuthUrl(repoUrl, token);

  // Use git ls-remote to check access without cloning
  const git = simpleGit();
  try {
    await git.listRemote(['--heads', authUrl]);
    // Extract owner/repo for display
    const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/);
    const repoName = match ? `${match[1]}/${match[2]}` : repoUrl;
    return { valid: true, repoName };
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Authentication') || msg.includes('403') || msg.includes('401')) {
      throw new Error('Authentication failed. Check your Personal Access Token has "repo" scope.');
    }
    if (msg.includes('not found') || msg.includes('404')) {
      throw new Error('Repository not found. Check the URL and your access permissions.');
    }
    throw new Error(`Could not reach repository: ${msg.split('\n')[0]}`);
  }
}

// ----------------------------------------------------------------
// Clone repo and open in VS Code
// ----------------------------------------------------------------
export async function cloneAndOpen({ repoUrl, token, branch = 'main', storyIds = [] }) {
  if (!repoUrl || !token) throw new Error('repoUrl and token are required.');

  const authUrl = buildAuthUrl(repoUrl, token);
  const baseDir = path.join(os.tmpdir(), 'aadp-workspace');

  // Ensure base workspace dir exists
  await fs.mkdir(baseDir, { recursive: true });

  const folderName = `codegen-${storyIds.join('-')}-${Date.now()}`;
  const cloneDir = path.join(baseDir, folderName);

  const git = simpleGit();

  // Detect available remote branches first so we can handle empty/new repos gracefully
  let remoteBranches = [];
  try {
    const remoteInfo = await git.listRemote(['--heads', authUrl]);
    remoteBranches = remoteInfo
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split('\t')[1]?.replace('refs/heads/', '').trim())
      .filter(Boolean);
  } catch {
    // listRemote failure is non-fatal — continue and let clone report the real error
  }

  const isEmptyRepo = remoteBranches.length === 0;
  // Resolve actual branch: use requested branch if it exists, else fall back to first available, else clone without --branch
  let resolvedBranch = null;
  if (!isEmptyRepo) {
    if (remoteBranches.includes(branch)) {
      resolvedBranch = branch;
    } else if (remoteBranches.length > 0) {
      resolvedBranch = remoteBranches[0]; // e.g. 'master' or whatever default was set
    }
  }

  try {
    if (isEmptyRepo) {
      // Empty repo: clone without --branch (creates a local clone ready for first commit)
      await git.clone(authUrl, cloneDir);
    } else {
      await git.clone(authUrl, cloneDir, ['--branch', resolvedBranch, '--depth', '1']);
    }
  } catch (err) {
    const msg = err.message || '';
    throw new Error(`Clone failed: ${msg.split('\n')[0]}`);
  }

  // For empty repos, initialise git user config so commits work later
  if (isEmptyRepo) {
    const repoGit = simpleGit(cloneDir);
    await repoGit.addConfig('user.email', 'aadp-agent@local', false, 'local');
    await repoGit.addConfig('user.name', 'AADP Code Agent', false, 'local');
  }

  // Open the cloned directory in VS Code
  // `code` is the VS Code CLI — available if VS Code is in PATH
  await new Promise((resolve, reject) => {
    exec(`code "${cloneDir}"`, (err) => {
      // Ignore errors here — VS Code may open even if exec reports an exit code
      resolve();
    });
  });

  return {
    clonedPath: cloneDir,
    branch: resolvedBranch || branch,
    isEmptyRepo,
    opened: true,
    message: isEmptyRepo
      ? `Empty repository cloned to ${cloneDir} — ready for first commit. VS Code is opening.`
      : `Repository cloned (branch: ${resolvedBranch}) to ${cloneDir} and opened in VS Code.`
  };
}

// ----------------------------------------------------------------
// Write generated files, commit and push a new branch
// ----------------------------------------------------------------
export async function pushGeneratedCode({ clonedPath, storyIds, generatedFiles, token, repoUrl, commitMessage, branchPrefix }) {
  if (!clonedPath) throw new Error('clonedPath is required. Clone the repo first.');

  const safeDir = sanitizePath(clonedPath);

  // Verify directory exists
  try {
    await fs.access(safeDir);
  } catch {
    throw new Error('Workspace directory not found. Please clone the repository again.');
  }

  const branchName = buildBranchName(storyIds || [], branchPrefix || 'codegen');
  const git = simpleGit(safeDir);

  // Ensure git user identity is set (required for commits)
  await git.addConfig('user.email', 'aadp-agent@local', false, 'local');
  await git.addConfig('user.name', 'AADP Code Agent', false, 'local');

  // Reconfigure remote with auth token for push
  if (repoUrl && token) {
    const authUrl = buildAuthUrl(repoUrl, token);
    await git.remote(['set-url', 'origin', authUrl]);
  }

  // Check if the repo has any commits (empty repo won't have HEAD)
  let hasCommits = false;
  try {
    await git.revparse(['HEAD']);
    hasCommits = true;
  } catch {
    hasCommits = false;
  }

  if (hasCommits) {
    // Normal repo: create a new branch off the current HEAD
    await git.checkoutLocalBranch(branchName);
  } else {
    // Empty repo: we're already on an unborn branch — just rename it to our target branch
    // git symbolic-ref HEAD refs/heads/<branchName>
    await git.raw(['symbolic-ref', 'HEAD', `refs/heads/${branchName}`]);
  }

  // Write generated files into the workspace
  if (generatedFiles && typeof generatedFiles === 'object') {
    for (const [filePath, content] of Object.entries(generatedFiles)) {
      // Sanitize each file path — prevent writing outside cloneDir
      const absFile = path.join(safeDir, filePath.replace(/^\/+/, ''));
      const absFileResolved = path.resolve(absFile);
      if (!absFileResolved.startsWith(safeDir)) continue; // skip unsafe paths
      await fs.mkdir(path.dirname(absFileResolved), { recursive: true });
      await fs.writeFile(absFileResolved, content, 'utf8');
    }
  }

  // Stage all changes
  await git.add('.');

  const msg = commitMessage || `feat: AI-generated code for ${(storyIds || []).join(', ')} [AADP Code Agent]`;
  await git.commit(msg);

  // Push new branch to origin
  await git.push('origin', branchName, ['--set-upstream']);

  return {
    branch: branchName,
    commitMessage: msg,
    pushed: true,
    message: `Branch "${branchName}" pushed successfully.`
  };
}

// ----------------------------------------------------------------
// Create GitHub Pull Request via REST API
// ----------------------------------------------------------------
export async function createGitHubPR({ repoUrl, token, branch, baseBranch = 'main', title, body }) {
  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/);
  if (!match) throw new Error('Could not parse GitHub owner/repo from URL. Only github.com repos are supported for PR creation.');

  const owner = match[1];
  const repo = match[2];

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
      title: title || `feat: AI-generated code [AADP]`,
      head: branch,
      base: baseBranch,
      body: body || 'Generated by AADP Code Generation Agent.',
      draft: false
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `GitHub API error: ${response.status}`);
  }

  return {
    prNumber: payload.number,
    prUrl: payload.html_url,
    title: payload.title,
    state: payload.state
  };
}
