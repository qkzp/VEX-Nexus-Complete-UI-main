export type DashboardRobot = {
  id: string;
  name: string;
  configuration: {
    drivetrainType: string | null;
    configurationVersion: number;
    isComplete: boolean;
    motors: { id: string }[];
    sensors: { id: string }[];
    pneumatics: { id: string }[];
  } | null;
};

export type DashboardTask = {
  id: string;
  title: string;
  robotId: string | null;
  priority: string;
  status: string;
  dueAt: Date | null;
};

export type DashboardEvidence = {
  robotId: string | null;
  occurredOn: Date;
};

export type DashboardRoutine = {
  id: string;
  robotId: string;
  name: string;
  updatedAt: Date;
};

export type DashboardTestRun = {
  id: string;
  robotId: string;
  revision: number;
  route: string;
  type?: "DRIVETRAIN" | "AUTONOMOUS" | "MECHANISM" | "OTHER";
  success: boolean;
  createdAt: Date;
};

export type DashboardCompetition = {
  id: string;
  name: string;
  startsAt: Date | null;
} | null;

export type ReadinessCheck = {
  id: string;
  group: "Workspace setup" | "Robot readiness" | "Autonomous" | "Engineering evidence" | "Competition";
  label: string;
  detail: string;
  complete: boolean;
  href: string;
};

export type RobotHealth = {
  robotId: string;
  name: string;
  deviceCount: number;
  hardwareConfigured: boolean;
  drivetrainConfigured: boolean;
  testRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastTestAt: Date | null;
  autonomousRoutes: number;
  autonomousTestRuns: number;
  successfulAutonomousRuns: number;
  failedAutonomousRuns: number;
  evidenceEntries: number;
};

export type NextMove = {
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
  tone: "setup" | "attention" | "action";
};

export type DashboardSummary = {
  nextMove: NextMove;
  readinessChecks: ReadinessCheck[];
  readinessCompleteCount: number;
  robotHealth: RobotHealth[];
  hasAutonomousTestEvidence: boolean;
  evidenceCount: number;
};

type DashboardSummaryInput = {
  robots: DashboardRobot[];
  tasks: DashboardTask[];
  evidence: DashboardEvidence[];
  routines: DashboardRoutine[];
  testRuns: DashboardTestRun[];
  competition: DashboardCompetition;
  links: {
    createRobot: string;
    robots: string;
    testing: string;
    autonomous: string;
    buildLog: string;
    tasks: string;
    eventMode: string;
  };
};

function routeKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function deviceCount(robot: DashboardRobot) {
  return (robot.configuration?.motors.length ?? 0) + (robot.configuration?.sensors.length ?? 0) + (robot.configuration?.pneumatics.length ?? 0);
}

function robotHealth(input: DashboardSummaryInput, robot: DashboardRobot): RobotHealth {
  const configuration = robot.configuration;
  const currentRevisionRuns = input.testRuns.filter(
    (run) => run.robotId === robot.id && run.revision === (configuration?.configurationVersion ?? 0),
  );
  const routines = input.routines.filter((routine) => routine.robotId === robot.id);
  const routineNames = new Set(routines.map((routine) => routeKey(routine.name)));
  const autonomousRuns = currentRevisionRuns.filter(
    (run) => (run.type === undefined || run.type === "AUTONOMOUS") && routineNames.has(routeKey(run.route)),
  );
  const latestRun = currentRevisionRuns.reduce<Date | null>(
    (latest, run) => (!latest || run.createdAt > latest ? run.createdAt : latest),
    null,
  );

  return {
    robotId: robot.id,
    name: robot.name,
    deviceCount: deviceCount(robot),
    hardwareConfigured: Boolean(configuration?.isComplete),
    drivetrainConfigured: Boolean(configuration?.drivetrainType),
    testRuns: currentRevisionRuns.length,
    successfulRuns: currentRevisionRuns.filter((run) => run.success).length,
    failedRuns: currentRevisionRuns.filter((run) => !run.success).length,
    lastTestAt: latestRun,
    autonomousRoutes: routines.length,
    autonomousTestRuns: autonomousRuns.length,
    successfulAutonomousRuns: autonomousRuns.filter((run) => run.success).length,
    failedAutonomousRuns: autonomousRuns.filter((run) => !run.success).length,
    evidenceEntries: input.evidence.filter((entry) => entry.robotId === robot.id).length,
  };
}

export function createDashboardSummary(input: DashboardSummaryInput): DashboardSummary {
  const health = input.robots.map((robot) => robotHealth(input, robot));
  const primaryRobot = input.robots[0] ?? null;
  const primaryHealth = primaryRobot ? health.find((row) => row.robotId === primaryRobot.id) ?? null : null;
  const hasHardware = health.some((row) => row.hardwareConfigured);
  const hasTestEvidence = health.some((row) => row.testRuns > 0);
  const hasAutonomousRoute = health.some((row) => row.autonomousRoutes > 0);
  const hasAutonomousTestEvidence = health.some((row) => row.autonomousTestRuns > 0);
  const evidenceCount = input.evidence.length;

  const readinessChecks: ReadinessCheck[] = [
    {
      id: "team-workspace",
      group: "Workspace setup",
      label: "Team workspace created",
      detail: "A shared team workspace is active.",
      complete: true,
      href: input.links.tasks,
    },
    {
      id: "robot-profile",
      group: "Robot readiness",
      label: "Robot profile created",
      detail: primaryRobot ? `${primaryRobot.name} is available to the workspace.` : "Create the first robot profile.",
      complete: Boolean(primaryRobot),
      href: primaryRobot ? input.links.robots : input.links.createRobot,
    },
    {
      id: "hardware",
      group: "Robot readiness",
      label: "Robot hardware configured",
      detail: hasHardware ? "At least one robot is marked hardware complete." : "Finish the active robot's saved configuration.",
      complete: hasHardware,
      href: primaryRobot ? input.links.robots : input.links.createRobot,
    },
    {
      id: "test-evidence",
      group: "Robot readiness",
      label: "Current robot test evidence recorded",
      detail: hasTestEvidence ? "A current robot revision has recorded test runs." : "Run and record the first current-revision test.",
      complete: hasTestEvidence,
      href: input.links.testing,
    },
    {
      id: "autonomous-route",
      group: "Autonomous",
      label: "Autonomous route created",
      detail: hasAutonomousRoute ? "A saved route is attached to a current robot." : "Plan the first route in the field planner.",
      complete: hasAutonomousRoute,
      href: input.links.autonomous,
    },
    {
      id: "autonomous-test",
      group: "Autonomous",
      label: "Autonomous route tested",
      detail: hasAutonomousTestEvidence ? "A saved route name matches recorded current-revision test evidence." : "Record a test run for a saved route.",
      complete: hasAutonomousTestEvidence,
      href: input.links.testing,
    },
    {
      id: "engineering-evidence",
      group: "Engineering evidence",
      label: "Engineering evidence added",
      detail: evidenceCount ? "Build logs or notebook entries document real work." : "Add a build log or notebook entry after meaningful work.",
      complete: evidenceCount > 0,
      href: input.links.buildLog,
    },
    {
      id: "competition",
      group: "Competition",
      label: "Competition selected",
      detail: input.competition ? `${input.competition.name} is attached to this team.` : "Select an event before pit preparation.",
      complete: Boolean(input.competition),
      href: input.links.eventMode,
    },
  ];

  let nextMove: NextMove;
  if (!primaryRobot) {
    nextMove = {
      title: "Create the first robot profile",
      detail: "Start with the robot your team is actually building so hardware, tests, and work can stay connected.",
      actionLabel: "Create robot",
      href: input.links.createRobot,
      tone: "setup",
    };
  } else if (!primaryHealth?.hardwareConfigured) {
    const drivetrainNote = primaryHealth?.drivetrainConfigured ? "Drivetrain saved; complete the remaining hardware review." : "Drivetrain setup is incomplete.";
    nextMove = {
      title: `Finish ${primaryRobot.name} robot setup`,
      detail: `${primaryHealth?.deviceCount ?? 0} device${primaryHealth?.deviceCount === 1 ? "" : "s"} configured. ${drivetrainNote}`,
      actionLabel: "Continue setup",
      href: input.links.robots,
      tone: "setup",
    };
  } else if ((primaryHealth?.failedRuns ?? 0) > 0) {
    nextMove = {
      title: `Review failed testing on ${primaryRobot.name}`,
      detail: `${primaryHealth?.failedRuns} failed current-revision run${primaryHealth?.failedRuns === 1 ? " is" : "s are"} recorded. Review the observations before adding more work.`,
      actionLabel: "Review tests",
      href: input.links.testing,
      tone: "attention",
    };
  } else if (!primaryHealth?.testRuns) {
    nextMove = {
      title: `Test ${primaryRobot.name}`,
      detail: "Hardware is marked complete, but this current robot revision has no recorded test evidence yet.",
      actionLabel: "Start test",
      href: input.links.testing,
      tone: "action",
    };
  } else if (!primaryHealth.autonomousRoutes) {
    nextMove = {
      title: `Plan autonomous for ${primaryRobot.name}`,
      detail: "The robot has test evidence, but no saved autonomous route yet.",
      actionLabel: "Plan autonomous",
      href: input.links.autonomous,
      tone: "action",
    };
  } else if (!primaryHealth.autonomousTestRuns) {
    nextMove = {
      title: `Test ${primaryRobot.name} autonomous`,
      detail: `${primaryHealth.autonomousRoutes} saved route${primaryHealth.autonomousRoutes === 1 ? "" : "s"} need current-revision test evidence.`,
      actionLabel: "Record test",
      href: input.links.testing,
      tone: "action",
    };
  } else if (!primaryHealth.evidenceEntries) {
    nextMove = {
      title: `Add evidence for ${primaryRobot.name}`,
      detail: "The robot has work recorded in testing, but no build log or notebook entry attached to it yet.",
      actionLabel: "Add evidence",
      href: input.links.buildLog,
      tone: "action",
    };
  } else if (input.competition) {
    nextMove = {
      title: `Prepare for ${input.competition.name}`,
      detail: "Review the selected event and make sure the robot's real readiness evidence is up to date.",
      actionLabel: "Open event mode",
      href: input.links.eventMode,
      tone: "action",
    };
  } else if (input.tasks[0]) {
    nextMove = {
      title: input.tasks[0].title,
      detail: "This is the highest-priority open task currently saved for the team.",
      actionLabel: "Open tasks",
      href: input.links.tasks,
      tone: "action",
    };
  } else {
    nextMove = {
      title: `Document the next improvement for ${primaryRobot.name}`,
      detail: "Create an assigned task before the next build-session decision gets lost.",
      actionLabel: "Create task",
      href: input.links.tasks,
      tone: "action",
    };
  }

  return {
    nextMove,
    readinessChecks,
    readinessCompleteCount: readinessChecks.filter((check) => check.complete).length,
    robotHealth: health,
    hasAutonomousTestEvidence,
    evidenceCount,
  };
}
