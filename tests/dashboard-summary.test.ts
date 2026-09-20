import assert from "node:assert/strict";
import test from "node:test";
import { createDashboardSummary } from "../src/lib/workspace/dashboard-summary.ts";

const links = {
  createRobot: "/robots?create=1",
  robots: "/robots",
  testing: "/testing",
  autonomous: "/field-lab",
  buildLog: "/build-log",
  tasks: "/team/tasks",
  eventMode: "/events",
};

const configuredRobot = {
  id: "robot-1",
  name: "DR48 V1",
  configuration: {
    drivetrainType: "TANK",
    configurationVersion: 2,
    isComplete: true,
    motors: [{ id: "motor-1" }, { id: "motor-2" }],
    sensors: [{ id: "sensor-1" }],
    pneumatics: [],
  },
};

function summary(overrides: Partial<Parameters<typeof createDashboardSummary>[0]> = {}) {
  return createDashboardSummary({
    robots: [configuredRobot],
    tasks: [],
    evidence: [],
    routines: [],
    testRuns: [],
    competition: null,
    links,
    ...overrides,
  });
}

test("asks a team with no robot to create a robot before presenting downstream work", () => {
  const result = summary({ robots: [] });
  assert.equal(result.nextMove.title, "Create the first robot profile");
  assert.equal(result.nextMove.href, links.createRobot);
  assert.equal(result.readinessCompleteCount, 1);
});

test("keeps incomplete hardware ahead of testing and autonomous suggestions", () => {
  const result = summary({
    robots: [{ ...configuredRobot, configuration: { ...configuredRobot.configuration, isComplete: false, drivetrainType: null } }],
  });
  assert.match(result.nextMove.title, /Finish DR48 V1 robot setup/);
  assert.match(result.nextMove.detail, /Drivetrain setup is incomplete/);
  assert.equal(result.nextMove.href, links.robots);
});

test("surfaces a failed current-revision run before proposing new autonomous work", () => {
  const result = summary({
    testRuns: [{ id: "run-1", robotId: "robot-1", revision: 2, route: "skills", success: false, createdAt: new Date("2026-09-20T16:00:00Z") }],
    routines: [{ id: "routine-1", robotId: "robot-1", name: "skills", updatedAt: new Date("2026-09-20T15:00:00Z") }],
  });
  assert.match(result.nextMove.title, /Review failed testing/);
  assert.equal(result.robotHealth[0]?.failedRuns, 1);
});

test("only credits autonomous testing when a saved route matches a current-revision run", () => {
  const result = summary({
    routines: [{ id: "routine-1", robotId: "robot-1", name: "Red match", updatedAt: new Date("2026-09-20T15:00:00Z") }],
    testRuns: [
      { id: "old-run", robotId: "robot-1", revision: 1, route: "Red match", success: true, createdAt: new Date("2026-09-20T14:00:00Z") },
      { id: "other-run", robotId: "robot-1", revision: 2, route: "Skills", success: true, createdAt: new Date("2026-09-20T16:00:00Z") },
    ],
  });
  assert.equal(result.hasAutonomousTestEvidence, false);
  assert.match(result.nextMove.title, /Test DR48 V1 autonomous/);
});

test("does not credit a non-autonomous test that happens to share a route name", () => {
  const result = summary({
    routines: [{ id: "routine-1", robotId: "robot-1", name: "Red match", updatedAt: new Date("2026-09-20T15:00:00Z") }],
    testRuns: [
      { id: "drive-test", robotId: "robot-1", revision: 2, route: "Red match", type: "DRIVETRAIN", success: true, createdAt: new Date("2026-09-20T16:00:00Z") },
    ],
  });
  assert.equal(result.robotHealth[0]?.testRuns, 1);
  assert.equal(result.robotHealth[0]?.autonomousTestRuns, 0);
  assert.equal(result.hasAutonomousTestEvidence, false);
});
