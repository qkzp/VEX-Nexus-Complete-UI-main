export const VEX_OVERRIDE = {
  season: "2026-27",
  game: "Override",
  seasonId: 204,
  manualVersion: "1.1",
  released: "2026-08-06",
  effective: "2026-08-13",
  nextVersion: "2.0",
  nextRelease: "2026-09-03",
  nextEffective: "2026-09-10",
  fieldSize: "12 ft x 12 ft",
  inventory: { cups: 56, pins: 63, goals: 9, toggles: 4, loaders: 4 },
  scoring: {
    autonomousBonus: 12,
    autonomousTieEach: 6,
    alliancePin: 5,
    yellowPin: 10,
    midfieldRobot: 8,
  },
  sources: {
    manualPage: "https://www.vexrobotics.com/override-manual",
    manualVersions: "https://www.vexrobotics.com/26-27-manuals",
    qa: "https://events.vex.com/V5RC/2026-2027/QA",
    worldSkills: "https://events.vex.com/robot-competitions/vex-robotics-competition/standings/skills",
    pythonApi: "https://api.vex.com/v5/home/python/index.html",
    cppApi: "https://api.vex.com/v5/home/cpp/index.html",
    aiVisionApi: "https://api.vex.com/v5/home/blocks/vision/aivision.html",
  },
  images: {
    top: "/override-field-top.webp",
    iso: "https://content.vexrobotics.com/docs/2026-2027/override/online-manual/assets/image/Iso.png",
  },
  changelog: [
    "SC6 revised for clarity",
    "SC7 clarified: ending Autonomous in Midfield is not included in scoring calculations",
    "SG7 and Figure SG-7 updated to fix a typo and improve clarity",
    "SG9 example interactions revised for clarity",
  ],
} as const;

export const RULE_TOPICS = [
  {
    id: "authority",
    title: "Which rules source controls?",
    tags: ["official", "manual", "qa", "source"],
    summary:
      "Use the current official Game Manual and the official V5RC Q&A for binding competition rules. PitRelay explanations are secondary summaries and never override either source.",
    source: VEX_OVERRIDE.sources.qa,
    sourceLabel: "Official V5RC Q&A",
  },
  {
    id: "manual-version",
    title: "Current Override manual version",
    tags: ["version", "update", "1.1", "manual"],
    summary:
      "Override Version 1.1 is active. It was released August 6, 2026 and became effective August 13, 2026. Version 2.0 is scheduled for release September 3, 2026 and effective September 10, 2026.",
    source: VEX_OVERRIDE.sources.manualVersions,
    sourceLabel: "VEX manual version schedule",
  },
  {
    id: "autonomous",
    title: "Autonomous Bonus quick reference",
    tags: ["autonomous", "bonus", "tie", "scoring"],
    summary:
      "The Autonomous Bonus is 12 points to the alliance that wins the Autonomous Period. If Autonomous is tied, each alliance receives 6 points.",
    source: VEX_OVERRIDE.sources.manualPage,
    sourceLabel: "Override manual",
  },
  {
    id: "skills",
    title: "World Skills ranking fields",
    tags: ["skills", "rank", "driver", "coding", "world"],
    summary:
      "VEX Events ranks World Skills by the highest Robot Skills score. Autonomous Coding Skills and Driver Skills comprise that score, while each category's highest individual score is used in tie-break information.",
    source: VEX_OVERRIDE.sources.worldSkills,
    sourceLabel: "VEX Events World Skills",
  },
] as const;
