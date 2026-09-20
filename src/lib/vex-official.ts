export const VEX_OVERRIDE = {
  season: "2026-27",
  game: "Override",
  seasonId: 204,
  manualVersion: "2.0",
  released: "2026-09-03",
  effective: "2026-09-10",
  nextVersion: "2.1",
  nextRelease: "2026-10-08",
  nextEffective: "2026-10-15",
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
    "SC8 changes Autonomous Win Point requirements; review your routine against the manual",
    "SG11 updates handling of Match Loads",
    "SG12 replaces the height restriction with a scoring-object placement restriction",
    "Possession definition updated for concave robot surfaces",
  ],
} as const;

export const RULE_TOPICS = [
  {
    id: "authority",
    title: "Which rules source controls?",
    tags: ["official", "manual", "qa", "source"],
    summary:
      "Use the current official Game Manual and the official V5RC Q&A for binding competition rules. BoltCanvas explanations are secondary summaries and never override either source.",
    source: VEX_OVERRIDE.sources.qa,
    sourceLabel: "Official V5RC Q&A",
  },
  {
    id: "manual-version",
    title: "Current Override manual version",
    tags: ["version", "update", "2.0", "manual"],
    summary:
      "Rules reference checked September 20, 2026: Override Version 2.0, effective September 10. Version 2.1 is scheduled for October 8, effective October 15. Check the official manual for subsequent updates.",
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
