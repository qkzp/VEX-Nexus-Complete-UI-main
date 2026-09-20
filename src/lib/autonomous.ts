export type PlannerPoint = { x: number; y: number };
export type MotionStep = { index: number; from: PlannerPoint; to: PlannerPoint; targetHeading: number; turnDegrees: number; driveInches: number };
export type AutonomousAction = {
  id: string;
  afterStep: number;
  kind: "wait" | "motor" | "pneumatic";
  targetId: string;
  value: number;
  durationMs: number;
};
export type AutonomousRoute = {
  name: string;
  startHeading: number;
  startPoint: PlannerPoint | null;
  routePoints: PlannerPoint[];
  speed?: number;
  timeLimit?: number;
  actions?: AutonomousAction[];
};

export const GRID_SIZE = 96;
export const FIELD_INCHES = 144;
const round = (n: number) => Math.round(n * 100) / 100;

export function toFieldCoordinates(point: PlannerPoint): PlannerPoint {
  return { x: round(point.x / (GRID_SIZE - 1) * FIELD_INCHES), y: round(point.y / (GRID_SIZE - 1) * FIELD_INCHES) };
}

export function buildMotionSteps(startHeading: number, path: PlannerPoint[]): MotionStep[] {
  let heading = startHeading;
  const steps: MotionStep[] = [];
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1], to = path[i];
    const dx = to.x - from.x, dy = to.y - from.y;
    if (Math.hypot(dx, dy) < 0.001) continue;
    const targetHeading = Math.atan2(dy, dx) * 180 / Math.PI;
    const turnDegrees = ((targetHeading - heading + 540) % 360 + 360) % 360 - 180;
    steps.push({ index: steps.length + 1, from, to, targetHeading: round(targetHeading), turnDegrees: round(turnDegrees), driveInches: round(Math.hypot(dx, dy) * FIELD_INCHES / (GRID_SIZE - 1)) });
    heading = targetHeading;
  }
  return steps;
}

export function validateRoute(route: AutonomousRoute): string[] {
  const issues: string[] = [];
  if (!Array.isArray(route.routePoints)) return ["Invalid route waypoints."];
  if (typeof route.name !== "string") issues.push("Give the routine a name.");
  if (!route.startPoint || !route.routePoints.length) issues.push("Place a start and at least one waypoint.");
  if (!Number.isFinite(route.startHeading) || Math.abs(route.startHeading) > 180) issues.push("Start heading must be between -180 and 180 degrees.");
  if ([route.startPoint, ...route.routePoints].some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0 || p.x > 95 || p.y > 95)) issues.push("Keep all waypoints inside the field.");
  if (route.routePoints.length > 100) issues.push("Use at most 100 waypoints per routine.");
  if (!Number.isFinite(route.speed ?? 35) || (route.speed ?? 35) < 5 || (route.speed ?? 35) > 100) issues.push("Drive speed must be 5–100%.");
  if (![15, 60].includes(route.timeLimit ?? 15)) issues.push("Choose a 15-second match or 60-second skills routine.");
  if (!issues.length && !buildMotionSteps(route.startHeading, [route.startPoint!, ...route.routePoints]).length) issues.push("Add a waypoint different from the start.");
  if (route.actions !== undefined && !Array.isArray(route.actions)) return [...issues, "Invalid mechanism actions."];
  const count = !issues.length && route.startPoint ? buildMotionSteps(route.startHeading, [route.startPoint, ...route.routePoints]).length : 0;
  if ((route.actions?.length ?? 0) > 100) issues.push("Use at most 100 mechanism actions.");
  for (const action of route.actions ?? []) {
    if (!action || !Number.isInteger(action.afterStep) || action.afterStep < 0 || action.afterStep > count) { issues.push("Assign every mechanism action to an existing motion step."); continue; }
    if (!["wait", "motor", "pneumatic"].includes(action.kind) || !Number.isFinite(action.value) || !Number.isFinite(action.durationMs) || action.durationMs < 0 || action.durationMs > 10000) issues.push("Check each action's type, value, and duration (0–10000 ms).");
    if (action.kind === "motor" && (Math.abs(action.value) > 100 || action.durationMs < 1)) issues.push("Motor actions need a speed from -100 to 100% and a positive duration.");
    if (action.kind === "pneumatic" && ![0, 1].includes(action.value)) issues.push("Pneumatic actions must extend or retract.");
  }
  return issues;
}
