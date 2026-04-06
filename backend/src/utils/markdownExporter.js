export function toMarkdown(epic, reportData) {
  const estimates = reportData.estimates || {};
  const stories = reportData.user_stories || [];

  let markdown = `# Product Owner Report — ${epic.key}\n\n`;
  markdown += `**${epic.summary}**\n\n`;
  markdown += `## Summary\n`;
  markdown += `- Total Story Points: ${estimates.total_story_points || '-'}\n`;
  markdown += `- Sprints: ${estimates.sprints || '-'}\n`;
  markdown += `- Duration: ${estimates.duration_weeks || '-'} weeks\n`;
  markdown += `- Team Size: ${estimates.team_size || '-'}\n`;
  markdown += `- Confidence: ${estimates.confidence || '-'}\n\n`;

  for (const story of stories) {
    markdown += `## ${story.id}: ${story.title}\n`;
    markdown += `As a **${story.as_a}**, I want ${story.i_want}, so that ${story.so_that}.\n\n`;
    markdown += `- Story Points: ${story.story_points}\n`;
    markdown += `- Priority: ${story.priority}\n`;
    markdown += `- Sprint: ${story.sprint}\n\n`;
    markdown += `### Acceptance Criteria\n`;
    for (const criterion of story.acceptance_criteria || []) {
      markdown += `- ${criterion}\n`;
    }
    markdown += '\n';
  }

  return markdown;
}
