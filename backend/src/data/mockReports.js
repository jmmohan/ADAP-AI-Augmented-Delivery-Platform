function buildStory(epicKey, index, sprint, title, asA, iWant, soThat, points, priority) {
  return {
    id: `US-${String(index).padStart(3, '0')}`,
    title,
    as_a: asA,
    i_want: iWant,
    so_that: soThat,
    story_points: points,
    priority,
    sprint,
    acceptance_criteria: [
      `Given ${asA} is authenticated When ${iWant} is executed Then expected outcome for ${epicKey} is persisted and auditable`,
      `Given invalid input When request is processed Then validation error is returned with actionable remediation`,
      `Given operation completes When event is emitted Then observability and trace metadata are available`
    ]
  };
}

export function buildMockReport(epic) {
  const baseStories = [
    buildStory(
      epic.key,
      1,
      1,
      `Epic intake and context parser for ${epic.key}`,
      'product owner',
      'to ingest epic metadata and linked context from Jira',
      'the delivery plan starts with complete and consistent inputs',
      5,
      'High'
    ),
    buildStory(
      epic.key,
      2,
      1,
      'Story decomposition workflow',
      'platform analyst',
      'to decompose epics into INVEST-compliant stories',
      'execution teams receive clear implementable work units',
      8,
      'High'
    ),
    buildStory(
      epic.key,
      3,
      2,
      'Acceptance criteria generation',
      'quality engineer',
      'to auto-generate Gherkin acceptance criteria',
      'testing and validation begin earlier in planning',
      5,
      'Medium'
    ),
    buildStory(
      epic.key,
      4,
      2,
      'Estimate and sprint allocator',
      'scrum master',
      'to assign story points and sprint placement',
      'forecasting and team capacity planning become data-driven',
      8,
      'High'
    ),
    buildStory(
      epic.key,
      5,
      3,
      'Risk register and mitigation engine',
      'program manager',
      'to generate delivery risk entries with mitigations',
      'dependencies and blockers are managed proactively',
      8,
      'Medium'
    ),
    buildStory(
      epic.key,
      6,
      4,
      'Jira sync and stakeholder export',
      'delivery lead',
      'to publish generated artifacts to Jira and share reports',
      'all stakeholders stay aligned from one source of truth',
      5,
      'Medium'
    )
  ];

  const totalStoryPoints = baseStories.reduce((total, story) => total + story.story_points, 0);

  return {
    user_stories: baseStories,
    estimates: {
      total_story_points: totalStoryPoints,
      sprints: 4,
      duration_weeks: 8,
      team_size: 6,
      confidence: 'Medium-High'
    },
    project_plan: {
      sprints: [
        {
          number: 1,
          name: 'Foundation',
          goal: `Ingest and model ${epic.key} context with high fidelity`,
          story_ids: ['US-001', 'US-002']
        },
        {
          number: 2,
          name: 'Definition',
          goal: 'Finalize stories, acceptance criteria, and sizing',
          story_ids: ['US-003', 'US-004']
        },
        {
          number: 3,
          name: 'Risk & Alignment',
          goal: 'Mitigate delivery risk and tighten execution plan',
          story_ids: ['US-005']
        },
        {
          number: 4,
          name: 'Publish',
          goal: 'Sync all outputs and complete stakeholder handover',
          story_ids: ['US-006']
        }
      ]
    },
    risks: [
      {
        title: 'Upstream Jira field schema variance across projects',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Use a normalized epic adapter and pre-validation checks before generation.'
      },
      {
        title: 'Model output inconsistency for domain terms',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Pin system prompts by domain and enforce strict JSON post-validation rules.'
      },
      {
        title: 'Stakeholder review latency delaying sprint start',
        likelihood: 'High',
        impact: 'Medium',
        mitigation: 'Auto-publish concise summaries and risk highlights immediately after generation.'
      }
    ]
  };
}
