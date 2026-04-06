import OpenAI from 'openai';
import { config } from '../config.js';
import { getSystemPrompt, getUserPromptTemplate } from './promptService.js';

const client = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: config.githubToken
});

function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Could not parse valid JSON response from model.');
  }
}

export async function callLLM(systemPrompt, userPrompt, modelName) {
  const model = modelName || config.defaultModel;
  const response = await client.chat.completions.create({
    model,
    max_tokens: 8000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });
  return extractJSON(response.choices[0].message.content || '');
}

export async function generateReport(epic, modelName) {
  const systemPrompt = getSystemPrompt('po') || 'You are an expert SAFe Product Owner. Always return valid JSON only with no markdown fences.';
  const template = getUserPromptTemplate('po');
  let prompt;
  if (template) {
    prompt = template
      .replace('{{epicKey}}', epic.key)
      .replace('{{epicSummary}}', epic.summary)
      .replace('{{epicDescription}}', epic.description);
  } else {
    prompt = `You are a senior SAFe Product Owner for a large telecom engineering organisation (800+ engineers). Generate a detailed product backlog breakdown.\n\nEpic Key: ${epic.key}\nEpic Summary: ${epic.summary}\nEpic Description: ${epic.description}\n\nReturn ONLY valid JSON. Generate exactly 6 user stories across 4 sprints and keep telecom domain specificity.`;
  }

  return callLLM(systemPrompt, prompt, modelName);
}
