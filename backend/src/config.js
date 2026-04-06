import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  githubToken: process.env.GITHUB_TOKEN || '',
  defaultModel: process.env.DEFAULT_MODEL || 'gpt-4o',
  jira: {
    baseUrl: process.env.JIRA_BASE_URL || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || ''
  }
};

export function hasGithubToken() {
  return Boolean(config.githubToken && config.githubToken.trim());
}

export function hasJiraConfig() {
  const { baseUrl, email, apiToken } = config.jira;
  return Boolean(baseUrl && email && apiToken);
}
