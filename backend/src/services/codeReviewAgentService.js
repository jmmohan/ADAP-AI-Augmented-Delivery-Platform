import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import simpleGit from 'simple-git';
import { hasGithubToken } from '../config.js';
import { callLLM } from './llmService.js';
import { buildMockCodeReviewReport, buildMockFixes } from '../data/mockCodeReviewReport.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

// ----------------------------------------------------------------
// File scanning
// ----------------------------------------------------------------
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '__pycache__',
  '.venv', 'venv', 'env', '.tox', 'coverage', '.nyc_output', '.cache',
  '.idea', '.vscode', '.DS_Store', 'vendor', 'target', 'bin', 'obj'
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.rb', '.cs',
  '.cpp', '.c', '.h', '.hpp', '.swift', '.kt', '.scala', '.php', '.vue',
  '.svelte', '.html', '.css', '.scss', '.less', '.sql', '.prisma', '.graphql',
  '.proto', '.yaml', '.yml', '.json', '.toml', '.xml', '.sh', '.bash',
  '.dockerfile', '.tf', '.hcl', '.md'
]);

const MAX_FILE_SIZE = 100 * 1024; // 100 KB per file
const MAX_TOTAL_FILES = 200;

export async function scanFiles({ clonedPath }) {
  if (!clonedPath) throw new Error('clonedPath is required.');

  const files = [];
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!CODE_EXTENSIONS.has(ext) && entry.name !== 'Dockerfile' && entry.name !== 'Makefile') continue;
        try {
          const stat = await fs.stat(fullPath);
          if (stat.size > MAX_FILE_SIZE) continue;
          files.push({
            path: relPath,
            extension: ext || entry.name,
            size: stat.size,
            lines: null // computed lazily
          });
        } catch { /* skip unreadable */ }
      }
      if (files.length >= MAX_TOTAL_FILES) return;
    }
  }

  await walk(clonedPath, '');
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

// ----------------------------------------------------------------
// LLM-powered code review
// ----------------------------------------------------------------
async function readFileContents(clonedPath, filePaths) {
  const contents = {};
  for (const fp of filePaths) {
    const abs = path.resolve(clonedPath, fp);
    // safety: ensure inside clonedPath
    if (!abs.startsWith(path.resolve(clonedPath))) continue;
    try {
      contents[fp] = await fs.readFile(abs, 'utf-8');
    } catch { /* skip unreadable */ }
  }
  return contents;
}

export async function reviewFiles({ clonedPath, filePaths, model }) {
  if (!clonedPath || !filePaths?.length) throw new Error('clonedPath and filePaths are required.');

  const fileContents = await readFileContents(clonedPath, filePaths);
  if (!Object.keys(fileContents).length) throw new Error('No readable files found.');

  if (!hasGithubToken()) {
    return { source: 'mock', review: buildMockCodeReviewReport(filePaths) };
  }

  try {
    const generated = await callReviewLLM(fileContents, model);
    return { source: 'llm', review: generated };
  } catch {
    return { source: 'mock', review: buildMockCodeReviewReport(filePaths) };
  }
}

async function callReviewLLM(fileContents, modelName) {
  const fileSummary = Object.entries(fileContents)
    .map(([fp, content]) => {
      // Truncate very large files to keep within LLM context
      const truncated = content.length > 8000 ? content.slice(0, 8000) + '\n// ... truncated ...' : content;
      return `=== ${fp} ===\n${truncated}`;
    })
    .join('\n\n');

  const systemPrompt = getSystemPrompt('codereview') ||
    'You are an expert code reviewer and static analysis specialist. Return valid JSON only.';
  const template = getUserPromptTemplate('codereview');
  const prompt = template
    ? template.replace('{{itemSummary}}', fileSummary)
    : `You are a Senior Code Reviewer for a large telecom engineering org. Review these source files and generate a comprehensive code quality report.

FILES:
${fileSummary}

Return ONLY valid JSON with this structure:
{
  "code_review": {
    "title": "string",
    "overall_verdict": "Approved|Approved with Conditions|Needs Revision",
    "score": number,
    "max_score": 100,
    "issues": [
      {
        "id": "VIO-001",
        "severity": "Critical|High|Medium|Low",
        "category": "Security|Reliability|Maintainability|Performance|Convention",
        "file": "relative/path.ts",
        "line": number,
        "message": "description of issue",
        "recommendation": "how to fix",
        "code_snippet": "offending code line"
      }
    ]
  },
  "summary": {
    "overall_verdict": "string",
    "code_score": number,
    "total_issues": number,
    "critical_issues": number,
    "high_issues": number,
    "medium_issues": number,
    "low_issues": number
  }
}`;

  return callLLM(systemPrompt, prompt, modelName);
}

// ----------------------------------------------------------------
// LLM-powered issue fixing
// ----------------------------------------------------------------
export async function fixIssues({ clonedPath, issues, model }) {
  if (!clonedPath || !issues?.length) throw new Error('clonedPath and issues are required.');

  // Collect unique files referenced by issues
  const uniqueFiles = [...new Set(issues.map((i) => i.file))];
  const fileContents = await readFileContents(clonedPath, uniqueFiles);

  if (!hasGithubToken()) {
    return { source: 'mock', fixes: buildMockFixes(issues, fileContents) };
  }

  try {
    const generated = await callFixLLM(issues, fileContents, model);
    return { source: 'llm', fixes: generated };
  } catch {
    return { source: 'mock', fixes: buildMockFixes(issues, fileContents) };
  }
}

async function callFixLLM(issues, fileContents, modelName) {
  const issueDesc = issues
    .map((i) => `- [${i.id}] ${i.severity} in ${i.file}:${i.line} — ${i.message} (Recommendation: ${i.recommendation})`)
    .join('\n');

  const filesSrc = Object.entries(fileContents)
    .map(([fp, content]) => `=== ${fp} ===\n${content}`)
    .join('\n\n');

  const systemPrompt = 'You are an expert software engineer. Fix the code issues described below. Return valid JSON only.';
  const prompt = `Fix the following code review issues. For each affected file, return the complete fixed file content.

ISSUES:
${issueDesc}

SOURCE FILES:
${filesSrc}

Return ONLY valid JSON array:
[
  {
    "file": "relative/path.ts",
    "original_snippet": "the problematic code",
    "fixed_snippet": "the corrected code",
    "fixed_content": "FULL file content with all fixes applied",
    "issues_fixed": ["VIO-001"]
  }
]`;

  return callLLM(systemPrompt, prompt, modelName);
}

// ----------------------------------------------------------------
// Apply fixes to filesystem
// ----------------------------------------------------------------
export async function applyFixes({ clonedPath, fixes }) {
  if (!clonedPath || !fixes?.length) throw new Error('clonedPath and fixes are required.');

  const basePath = path.resolve(clonedPath);
  const applied = [];
  const skipped = [];

  for (const fix of fixes) {
    if (!fix.file) { skipped.push('(no file path)'); continue; }

    // Use fixed_content if available, otherwise fall back to reading + patching
    let content = fix.fixed_content;
    if (!content && fix.fixed_snippet) {
      // Fallback: read original file and append the fix as a patch comment
      try {
        const origPath = path.resolve(basePath, fix.file);
        const original = await fs.readFile(origPath, 'utf-8');
        // If we have both original and fixed snippets, do a text replacement
        if (fix.original_snippet && original.includes(fix.original_snippet)) {
          content = original.replace(fix.original_snippet, fix.fixed_snippet);
        } else {
          content = original + '\n// [AADP Fix] ' + (fix.issues_fixed || []).join(', ') + '\n' + fix.fixed_snippet + '\n';
        }
      } catch {
        skipped.push(fix.file + ' (cannot read original)');
        continue;
      }
    }

    if (!content) { skipped.push(fix.file + ' (no fixed content)'); continue; }

    const absFile = path.resolve(basePath, fix.file);
    if (!absFile.startsWith(basePath)) { skipped.push(fix.file + ' (path traversal)'); continue; }

    try {
      await fs.mkdir(path.dirname(absFile), { recursive: true });
      await fs.writeFile(absFile, content, 'utf-8');
      applied.push(fix.file);
    } catch (err) {
      skipped.push(fix.file + ` (${err.message})`);
    }
  }

  console.log(`[Code Review] Applied fixes to ${applied.length} file(s):`, applied);
  if (skipped.length) console.warn(`[Code Review] Skipped ${skipped.length} file(s):`, skipped);

  return { applied, skipped, message: `${applied.length} file(s) updated.${skipped.length ? ` ${skipped.length} skipped.` : ''}` };
}

// ----------------------------------------------------------------
// Validate a local folder for code review
// ----------------------------------------------------------------
export async function validateLocalFolder({ folderPath }) {
  if (!folderPath) throw new Error('folderPath is required.');

  const resolved = path.resolve(folderPath);

  // Check directory exists
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) throw new Error('Path is not a directory.');
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error('Folder not found. Check the path and try again.');
    throw err;
  }

  // Detect Git info
  let gitInfo = { hasGit: false, remote: null, branch: null };
  try {
    const git = simpleGit(resolved);
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      gitInfo.hasGit = true;
      try {
        const remotes = await git.getRemotes(true);
        const origin = remotes.find((r) => r.name === 'origin');
        if (origin) gitInfo.remote = origin.refs?.fetch || origin.refs?.push || null;
      } catch { /* no remote */ }
      try {
        const br = await git.branch();
        gitInfo.branch = br.current || null;
      } catch { /* detached HEAD etc */ }
    }
  } catch { /* not a git repo */ }

  // Open in VS Code (fire-and-forget — don't block the HTTP response)
  exec(`code "${resolved}"`, () => {});

  return {
    folderPath: resolved,
    opened: true,
    ...gitInfo,
    message: gitInfo.hasGit
      ? `Opened ${resolved} in VS Code (Git: ${gitInfo.branch || 'unknown branch'}${gitInfo.remote ? ' · ' + gitInfo.remote : ''})`
      : `Opened ${resolved} in VS Code (no Git repository detected)`
  };
}
