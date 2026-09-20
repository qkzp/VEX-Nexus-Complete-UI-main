"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Compass,
  Gauge,
  MapPinned,
  RotateCw,
  Ruler,
  Save,
  ShieldCheck,
  TimerReset,
  Trash2,
  Undo2,
  Waypoints,
} from "lucide-react";
import { flushPendingTeamSection, saveTeamSection, type SyncStatus } from "@/lib/client/team-sync";
import { VEX_OVERRIDE } from "@/lib/vex-official";

type FieldLabRobot = {
  id: string;
  name: string;
  revision: number;
};

type PlannerPoint = {
  x: number;
  y: number;
};

type RoutineStatus = "draft" | "testing" | "comp-ready";

type FieldLabRoutine = {
  id: string;
  name: string;
  alliance: "red" | "blue";
  selectedRobotId: string | null;
  startHeading: number;
  startPoint: PlannerPoint | null;
  routePoints: PlannerPoint[];
  notes: string;
  pitNotes: string;
  status: RoutineStatus;
  ownerLabel: string;
  updatedAt: string | null;
};

type EventSummary = {
  id: number;
  name: string;
  sku: string;
  divisionName: string;
  start: string | null;
  venue: string;
};

type FieldLabState = {
  language: "python" | "cpp";
  activeRoutineId: string | null;
  routines: FieldLabRoutine[];
  selectedRobotId: string | null;
  routeName: string;
  alliance: "red" | "blue";
  startHeading: number;
  startPoint: PlannerPoint | null;
  routePoints: PlannerPoint[];
  notes: string;
  pitNotes: string;
  status: RoutineStatus;
  ownerLabel: string;
};

type FieldLabProps = {
  teamId: string;
  robots: FieldLabRobot[];
  activeRobotId: string | null;
  initialState: Record<string, unknown>;
  selectedEvent: EventSummary | null;
};

type MotionStep = {
  index: number;
  from: PlannerPoint;
  to: PlannerPoint;
  targetHeading: number;
  turnDegrees: number;
  driveInches: number;
};

const GRID_SIZE = 96;
const FIELD_INCHES = 144;

const DEFAULT_STATE: FieldLabState = {
  language: "python",
  activeRoutineId: null,
  routines: [],
  selectedRobotId: null,
  routeName: "override_auton",
  alliance: "red",
  startHeading: 0,
  startPoint: null,
  routePoints: [],
  notes: "",
  pitNotes: "",
  status: "draft",
  ownerLabel: "Team workspace",
};

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `routine-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function parsePoint(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const x = Number(row.x);
  const y = Number(row.y);
  return Number.isFinite(x) && Number.isFinite(y)
    ? { x: clamp(x, 0, GRID_SIZE - 1), y: clamp(y, 0, GRID_SIZE - 1) }
    : null;
}

function parsePoints(value: unknown) {
  return Array.isArray(value) ? value.map(parsePoint).filter((point): point is PlannerPoint => Boolean(point)) : [];
}

function parseRoutine(value: unknown, fallbackRobotId: string | null): FieldLabRoutine | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name = typeof row.name === "string" && row.name.trim() ? row.name : "unnamed_routine";
  return {
    id: typeof row.id === "string" && row.id ? row.id : createId(),
    name,
    alliance: row.alliance === "blue" ? "blue" : "red",
    selectedRobotId: typeof row.selectedRobotId === "string" ? row.selectedRobotId : fallbackRobotId,
    startHeading: Number.isFinite(Number(row.startHeading)) ? clamp(Number(row.startHeading), -180, 180) : 0,
    startPoint: parsePoint(row.startPoint),
    routePoints: parsePoints(row.routePoints),
    notes: typeof row.notes === "string" ? row.notes : "",
    pitNotes: typeof row.pitNotes === "string" ? row.pitNotes : "",
    status: row.status === "testing" || row.status === "comp-ready" ? row.status : "draft",
    ownerLabel: typeof row.ownerLabel === "string" && row.ownerLabel.trim() ? row.ownerLabel : "Team workspace",
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null,
  };
}

function parseState(initialState: Record<string, unknown>, fallbackRobotId: string | null): FieldLabState {
  const raw = initialState && typeof initialState === "object" ? initialState : {};
  const routines = Array.isArray(raw.routines)
    ? raw.routines.map((routine) => parseRoutine(routine, fallbackRobotId)).filter((routine): routine is FieldLabRoutine => Boolean(routine))
    : [];
  const activeRoutineId = typeof raw.activeRoutineId === "string" ? raw.activeRoutineId : routines[0]?.id ?? null;
  const activeRoutine = routines.find((routine) => routine.id === activeRoutineId) ?? null;

  return {
    language: raw.language === "cpp" ? "cpp" : "python",
    activeRoutineId,
    routines,
    selectedRobotId: activeRoutine?.selectedRobotId ?? (typeof raw.selectedRobotId === "string" ? raw.selectedRobotId : fallbackRobotId),
    routeName: activeRoutine?.name ?? (typeof raw.routeName === "string" && raw.routeName.trim() ? raw.routeName : DEFAULT_STATE.routeName),
    alliance: activeRoutine?.alliance ?? (raw.alliance === "blue" ? "blue" : "red"),
    startHeading: activeRoutine?.startHeading ?? (Number.isFinite(Number(raw.startHeading)) ? clamp(Number(raw.startHeading), -180, 180) : 0),
    startPoint: activeRoutine?.startPoint ?? parsePoint(raw.startPoint),
    routePoints: activeRoutine?.routePoints ?? parsePoints(raw.routePoints),
    notes: activeRoutine?.notes ?? (typeof raw.notes === "string" ? raw.notes : ""),
    pitNotes: activeRoutine?.pitNotes ?? (typeof raw.pitNotes === "string" ? raw.pitNotes : ""),
    status: activeRoutine?.status ?? (raw.status === "testing" || raw.status === "comp-ready" ? raw.status : "draft"),
    ownerLabel: activeRoutine?.ownerLabel ?? (typeof raw.ownerLabel === "string" && raw.ownerLabel.trim() ? raw.ownerLabel : "Team workspace"),
  };
}

function toPersistedState(state: FieldLabState): FieldLabState {
  return state;
}

function pointKey(point: PlannerPoint) {
  return `${point.x},${point.y}`;
}

function pointToPercent(point: PlannerPoint) {
  return {
    left: `${(point.x / (GRID_SIZE - 1)) * 100}%`,
    top: `${(point.y / (GRID_SIZE - 1)) * 100}%`,
  };
}

function toFieldCoordinates(point: PlannerPoint) {
  const tileSize = FIELD_INCHES / GRID_SIZE;
  return {
    x: round((point.x + 0.5) * tileSize, 2),
    y: round((point.y + 0.5) * tileSize, 2),
  };
}

function segmentHeading(from: PlannerPoint, to: PlannerPoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return round((Math.atan2(dy, dx) * 180) / Math.PI, 1);
}

function normalizeDegrees(value: number) {
  let result = value;
  while (result <= -180) result += 360;
  while (result > 180) result -= 360;
  return round(result, 1);
}

function segmentDistance(from: PlannerPoint, to: PlannerPoint) {
  const fieldFrom = toFieldCoordinates(from);
  const fieldTo = toFieldCoordinates(to);
  const dx = fieldTo.x - fieldFrom.x;
  const dy = fieldTo.y - fieldFrom.y;
  return round(Math.sqrt(dx * dx + dy * dy), 2);
}

function buildMotionSteps(startHeading: number, path: PlannerPoint[]) {
  let heading = startHeading;
  return path.slice(1).map((point, index) => {
    const previous = path[index];
    const targetHeading = segmentHeading(previous, point);
    const turnDegrees = normalizeDegrees(targetHeading - heading);
    const driveInches = segmentDistance(previous, point);
    heading = targetHeading;
    return {
      index: index + 1,
      from: previous,
      to: point,
      targetHeading,
      turnDegrees,
      driveInches,
    } satisfies MotionStep;
  });
}

function buildWarnings(path: PlannerPoint[], steps: MotionStep[]) {
  const warnings: string[] = [];
  if (path.length < 2) warnings.push("Add at least one movement segment before trusting this autonomous.");
  const totalDistance = steps.reduce((sum, step) => sum + step.driveInches, 0);
  if (totalDistance > 220) warnings.push("This route exceeds 220 inches of travel and may be unrealistic for a 15-second autonomous.");
  if (steps.length > 18) warnings.push("This route has more than 18 segments. Consider simplifying it for match reliability.");
  if (steps.some((step) => Math.abs(step.turnDegrees) > 150)) warnings.push("One or more turns exceed 150 degrees, which often causes match-time drift.");
  if (steps.some((step) => step.driveInches < 1.5)) warnings.push("Some segments are shorter than 1.5 inches and may be too fine to repeat consistently on the field.");
  if (steps.some((step) => step.driveInches > 60)) warnings.push("One or more drive segments exceed 60 inches. Long dead-reckoning moves usually need extra correction.");
  return warnings;
}

function buildPythonCode(name: string, startHeading: number, steps: MotionStep[], eventSummary: EventSummary | null, notes: string) {
  const stepTable = steps.map((step) => [
    "    {",
    `        "label": "Step ${step.index}",`,
    `        "turn_deg": ${step.turnDegrees},`,
    `        "drive_in": ${step.driveInches},`,
    `        "end_heading_deg": ${step.targetHeading},`,
    "    },",
  ].join("\n"));
  return [
    "from vex import *",
    "",
    "brain = Brain()",
    "competition = Competition()",
    "",
    `ROUTE_NAME = "${name}"`,
    `START_HEADING_DEG = ${round(startHeading, 1)}`,
    eventSummary ? `MATCH_EVENT = "${eventSummary.name}"` : "MATCH_EVENT = \"No event linked\"",
    eventSummary ? `MATCH_DIVISION = "${eventSummary.divisionName}"` : "MATCH_DIVISION = \"No division linked\"",
    "AUTON_STEPS = [",
    ...stepTable,
    "]",
    "",
    "def turn_degrees(delta_deg):",
    "    # Replace with your drivetrain turn helper.",
    "    brain.screen.print(f\"Turn {delta_deg} deg\")",
    "    brain.screen.next_row()",
    "",
    "def drive_forward_inches(distance_in):",
    "    # Replace with your drivetrain drive helper.",
    "    brain.screen.print(f\"Drive {distance_in} in\")",
    "    brain.screen.next_row()",
    "",
    "def run_auton_step(step):",
    "    turn_degrees(step[\"turn_deg\"])",
    "    drive_forward_inches(step[\"drive_in\"])",
    "",
    "def pre_auton():",
    "    brain.screen.clear_screen()",
    "    brain.screen.set_cursor(1, 1)",
    "    brain.screen.print(ROUTE_NAME)",
    "    brain.screen.next_row()",
    "    brain.screen.print(f\"Start heading {START_HEADING_DEG} deg\")",
    "    brain.screen.next_row()",
    "    brain.screen.print(MATCH_EVENT)",
    "    brain.screen.next_row()",
    notes ? `    # Team notes: ${notes.replace(/\n/g, " ").replace(/"/g, "'")}` : "    # Team notes: none recorded",
    "",
    "def autonomous():",
    "    pre_auton()",
    "    for step in AUTON_STEPS:",
    "        run_auton_step(step)",
    "",
    "def drivercontrol():",
    "    while True:",
    "        wait(20, MSEC)",
    "",
    "competition.autonomous(autonomous)",
    "competition.drivercontrol(drivercontrol)",
    "",
    "while True:",
    "    wait(100, MSEC)",
  ].join("\n");
}

function buildCppCode(name: string, startHeading: number, steps: MotionStep[], eventSummary: EventSummary | null, notes: string) {
  const stepTable = steps.map((step) => [
    "  {",
    `    "Step ${step.index}",`,
    `    ${step.turnDegrees},`,
    `    ${step.driveInches},`,
    `    ${step.targetHeading},`,
    "  },",
  ].join("\n"));
  return [
    "#include \"vex.h\"",
    "#include <vector>",
    "using namespace vex;",
    "",
    "brain Brain;",
    "competition Competition;",
    "",
    "struct AutonStep {",
    "  const char* label;",
    "  double turnDeg;",
    "  double driveIn;",
    "  double endHeadingDeg;",
    "};",
    "",
    `const char* ROUTE_NAME = "${name}";`,
    `const double START_HEADING_DEG = ${round(startHeading, 1)};`,
    eventSummary ? `const char* MATCH_EVENT = "${eventSummary.name.replace(/"/g, "'")}";` : "const char* MATCH_EVENT = \"No event linked\";",
    eventSummary ? `const char* MATCH_DIVISION = "${eventSummary.divisionName.replace(/"/g, "'")}";` : "const char* MATCH_DIVISION = \"No division linked\";",
    "",
    "std::vector<AutonStep> buildAutonSteps() {",
    "  return {",
    ...stepTable,
    "  };",
    "}",
    "",
    "void turnDegrees(double deltaDeg) {",
    "  // Replace with your drivetrain turn helper.",
    "  Brain.Screen.print(\"Turn %.1f deg\", deltaDeg);",
    "  Brain.Screen.newLine();",
    "}",
    "",
    "void driveForwardInches(double distanceIn) {",
    "  // Replace with your drivetrain drive helper.",
    "  Brain.Screen.print(\"Drive %.2f in\", distanceIn);",
    "  Brain.Screen.newLine();",
    "}",
    "",
    "void runAutonStep(const AutonStep& step) {",
    "  turnDegrees(step.turnDeg);",
    "  driveForwardInches(step.driveIn);",
    "}",
    "",
    "void preAuton() {",
    "  Brain.Screen.clearScreen();",
    "  Brain.Screen.setCursor(1, 1);",
    "  Brain.Screen.print(ROUTE_NAME);",
    "  Brain.Screen.newLine();",
    "  Brain.Screen.print(\"Start heading %.1f deg\", START_HEADING_DEG);",
    "  Brain.Screen.newLine();",
    "  Brain.Screen.print(MATCH_EVENT);",
    "  Brain.Screen.newLine();",
    notes ? `  // Team notes: ${notes.replace(/\n/g, " ").replace(/"/g, "'")}` : "  // Team notes: none recorded",
    "}",
    "",
    "void autonomous() {",
    "  preAuton();",
    "  std::vector<AutonStep> steps = buildAutonSteps();",
    "  for (const AutonStep& step : steps) {",
    "    runAutonStep(step);",
    "  }",
    "}",
    "",
    "void drivercontrol() {",
    "  while (true) {",
    "    wait(20, msec);",
    "  }",
    "}",
    "",
    "int main() {",
    "  Competition.autonomous(autonomous);",
    "  Competition.drivercontrol(drivercontrol);",
    "  while (true) {",
    "    wait(100, msec);",
    "  }",
    "}",
  ].join("\n");
}

function statusLabel(status: RoutineStatus) {
  if (status === "comp-ready") return "Comp-ready";
  if (status === "testing") return "Testing";
  return "Draft";
}

function formatEventDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}

export function FieldLab({ teamId, robots, activeRobotId, initialState, selectedEvent }: FieldLabProps) {
  const fallbackRobotId = activeRobotId ?? robots[0]?.id ?? null;
  const [planner, setPlanner] = useState<FieldLabState>(() => parseState(initialState, fallbackRobotId));
  const [sync, setSync] = useState<SyncStatus>("saved");
  const [placementMode, setPlacementMode] = useState<"start" | "route">("route");

  useEffect(() => {
    void flushPendingTeamSection(teamId, "fieldLab").then((status) => status && setSync(status));
  }, [teamId]);

  const selectedRobot = robots.find((robot) => robot.id === planner.selectedRobotId) ?? null;
  const fullPath = useMemo(
    () => (planner.startPoint ? [planner.startPoint, ...planner.routePoints] : planner.routePoints),
    [planner.startPoint, planner.routePoints],
  );
  const steps = useMemo(() => buildMotionSteps(planner.startHeading, fullPath), [planner.startHeading, fullPath]);
  const warnings = useMemo(() => buildWarnings(fullPath, steps), [fullPath, steps]);
  const routeDistance = useMemo(() => round(steps.reduce((sum, step) => sum + step.driveInches, 0), 2), [steps]);
  const generatedCode = useMemo(() => {
    if (!steps.length) return "";
    return planner.language === "python"
      ? buildPythonCode(planner.routeName, planner.startHeading, steps, selectedEvent, planner.notes)
      : buildCppCode(planner.routeName, planner.startHeading, steps, selectedEvent, planner.notes);
  }, [planner.language, planner.routeName, planner.startHeading, planner.notes, steps, selectedEvent]);

  function persist(next: FieldLabState) {
    setPlanner(next);
    setSync("saving");
    void saveTeamSection(teamId, "fieldLab", toPersistedState(next)).then(setSync);
  }

  function updateDraft(patch: Partial<FieldLabState>) {
    persist({ ...planner, ...patch });
  }

  function currentRoutineFromDraft(): FieldLabRoutine {
    return {
      id: planner.activeRoutineId ?? createId(),
      name: planner.routeName.trim() || "unnamed_routine",
      alliance: planner.alliance,
      selectedRobotId: planner.selectedRobotId,
      startHeading: planner.startHeading,
      startPoint: planner.startPoint,
      routePoints: planner.routePoints,
      notes: planner.notes,
      pitNotes: planner.pitNotes,
      status: planner.status,
      ownerLabel: planner.ownerLabel.trim() || "Team workspace",
      updatedAt: nowIso(),
    };
  }

  function saveRoutine() {
    const routine = currentRoutineFromDraft();
    const existingIndex = planner.routines.findIndex((entry) => entry.id === routine.id);
    const routines = existingIndex >= 0
      ? planner.routines.map((entry, index) => (index === existingIndex ? routine : entry))
      : [routine, ...planner.routines];
    persist({ ...planner, activeRoutineId: routine.id, routines });
  }

  function loadRoutine(routineId: string) {
    const routine = planner.routines.find((entry) => entry.id === routineId);
    if (!routine) return;
    persist({
      ...planner,
      activeRoutineId: routine.id,
      selectedRobotId: routine.selectedRobotId,
      routeName: routine.name,
      alliance: routine.alliance,
      startHeading: routine.startHeading,
      startPoint: routine.startPoint,
      routePoints: routine.routePoints,
      notes: routine.notes,
      pitNotes: routine.pitNotes,
      status: routine.status,
      ownerLabel: routine.ownerLabel,
    });
  }

  function deleteRoutine(routineId: string) {
    const routines = planner.routines.filter((entry) => entry.id !== routineId);
    const fallback = routines[0] ?? null;
    persist({
      ...planner,
      routines,
      activeRoutineId: fallback?.id ?? null,
      selectedRobotId: fallback?.selectedRobotId ?? fallbackRobotId,
      routeName: fallback?.name ?? DEFAULT_STATE.routeName,
      alliance: fallback?.alliance ?? "red",
      startHeading: fallback?.startHeading ?? 0,
      startPoint: fallback?.startPoint ?? null,
      routePoints: fallback?.routePoints ?? [],
      notes: fallback?.notes ?? "",
      pitNotes: fallback?.pitNotes ?? "",
      status: fallback?.status ?? "draft",
      ownerLabel: fallback?.ownerLabel ?? "Team workspace",
    });
  }

  function newRoutine() {
    persist({
      ...planner,
      activeRoutineId: null,
      selectedRobotId: planner.selectedRobotId ?? fallbackRobotId,
      routeName: "override_auton",
      alliance: "red",
      startHeading: 0,
      startPoint: null,
      routePoints: [],
      notes: "",
      pitNotes: "",
      status: "draft",
      ownerLabel: "Team workspace",
    });
  }

  function handleFieldClick(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(Math.round(((event.clientX - rect.left) / rect.width) * (GRID_SIZE - 1)), 0, GRID_SIZE - 1);
    const y = clamp(Math.round(((event.clientY - rect.top) / rect.height) * (GRID_SIZE - 1)), 0, GRID_SIZE - 1);
    const point = { x, y };
    if (placementMode === "start" || !planner.startPoint) {
      persist({ ...planner, startPoint: point });
      if (placementMode === "start") setPlacementMode("route");
      return;
    }
    if (planner.routePoints.length && pointKey(planner.routePoints[planner.routePoints.length - 1]) === pointKey(point)) return;
    persist({ ...planner, routePoints: [...planner.routePoints, point] });
  }

  function undoLast() {
    if (planner.routePoints.length) {
      persist({ ...planner, routePoints: planner.routePoints.slice(0, -1) });
      return;
    }
    if (planner.startPoint) persist({ ...planner, startPoint: null });
  }

  function clearRoute() {
    persist({ ...planner, startPoint: null, routePoints: [] });
  }

  return (
    <section className="workspace-page suite-page competition-page">
      <header className="competition-hero">
        <div className="competition-hero-copy">
          <div className="suite-badges">
            <span className="official-badge">
              <ShieldCheck size={13} /> OFFICIAL FIELD REFERENCE
            </span>
            <span className={`status-chip ${sync === "saved" ? "good" : sync === "offline" ? "warn" : "neutral"}`}>
              {sync === "saved" ? "Planner synced" : sync === "saving" ? "Saving..." : sync === "offline" ? "Offline cache" : "Save retry needed"}
            </span>
            <span className={`status-chip ${planner.status === "comp-ready" ? "good" : planner.status === "testing" ? "neutral" : "warn"}`}>
              {statusLabel(planner.status)}
            </span>
          </div>
          <p className="page-kicker">Autonomous Studio</p>
          <h1>Plan the route your robot will actually run.</h1>
          <p>Build a measured route on the official field, keep the starting pose explicit, and turn the path into a team-owned Python or C++ starter.</p>
          <div className="competition-hero-actions">
            <a className="button button-primary button-large" href={VEX_OVERRIDE.sources.manualPage} target="_blank" rel="noreferrer">
              Official game manual <ArrowRight size={15} />
            </a>
            <Link className="button button-quiet button-large" href="/events">
              Event Mode <ArrowRight size={15} />
            </Link>
          </div>
          <div className="competition-trust-line">
            <ShieldCheck size={15} /> The field image is official. Generated code is clearly labeled as a starter and only reflects the team route you saved here.
          </div>
        </div>

        <div className="competition-field-hero" aria-label="Official VEX Override competition field">
          <div className="field-visual-toolbar">
            <span><i /> OVERRIDE // AUTONOMOUS</span>
            <span>{VEX_OVERRIDE.fieldSize}</span>
          </div>
          <Image src={VEX_OVERRIDE.images.iso} alt="Official VEX Override field perspective" width={1100} height={760} priority />
          <div className="field-hero-caption">
            <span>Official season field image</span>
            <a href={VEX_OVERRIDE.sources.manualPage} target="_blank" rel="noreferrer">
              Open source <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </header>

      <div className="field-lab-grid editable">
        <section className="suite-panel field-lab-map-panel">
          <div className="suite-panel-heading">
            <div>
              <span className="section-overline">Route planner</span>
              <h2>Trajectory editor</h2>
            </div>
            <div className="segmented">
              <button type="button" className={placementMode === "start" ? "active" : ""} onClick={() => setPlacementMode("start")}>Place robot</button>
              <button type="button" className={placementMode === "route" ? "active" : ""} onClick={() => setPlacementMode("route")}>Draw route</button>
            </div>
          </div>

          <div className="field-planner-readout" aria-label="Route editing status">
            <span><MapPinned size={14} /> {planner.startPoint ? `Start ${toFieldCoordinates(planner.startPoint).x}, ${toFieldCoordinates(planner.startPoint).y} in` : "Place a starting pose"}</span>
            <span><Ruler size={14} /> {routeDistance || 0} in total distance</span>
            <span><Gauge size={14} /> {steps.length} movement steps</span>
          </div>

          <div className="field-route-toolbar">
            <label>
              Robot
              <select value={planner.selectedRobotId ?? ""} onChange={(event) => updateDraft({ selectedRobotId: event.target.value || null })}>
                <option value="">Select robot</option>
                {robots.map((robot) => <option key={robot.id} value={robot.id}>{robot.name}</option>)}
              </select>
            </label>
            <label>
              Routine name
              <input value={planner.routeName} onChange={(event) => updateDraft({ routeName: event.target.value })} placeholder="override_auton" />
            </label>
            <label>
              Alliance
              <select value={planner.alliance} onChange={(event) => updateDraft({ alliance: event.target.value as FieldLabState["alliance"] })}>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
              </select>
            </label>
            <label>
              Start heading
              <input type="number" min="-180" max="180" value={planner.startHeading} onChange={(event) => updateDraft({ startHeading: clamp(Number(event.target.value) || 0, -180, 180) })} />
            </label>
            <label>
              Routine status
              <select value={planner.status} onChange={(event) => updateDraft({ status: event.target.value as RoutineStatus })}>
                <option value="draft">Draft</option>
                <option value="testing">Testing</option>
                <option value="comp-ready">Comp-ready</option>
              </select>
            </label>
            <label>
              Shared owner label
              <input value={planner.ownerLabel} onChange={(event) => updateDraft({ ownerLabel: event.target.value })} placeholder="Driver team" />
            </label>
            <div className="route-tool-buttons route-tool-buttons-primary">
              <button className="button button-primary" type="button" onClick={saveRoutine}>
                <Save size={14} /> Save routine
              </button>
              <button className="button button-quiet" type="button" onClick={newRoutine}>
                New draft
              </button>
            </div>
            <div className="route-tool-buttons">
              <button className="button button-quiet" type="button" onClick={undoLast}>
                <Undo2 size={14} /> Undo
              </button>
              <button className="button button-quiet" type="button" onClick={() => updateDraft({ routePoints: [] })}>
                <RotateCw size={14} /> Reset path
              </button>
              <button className="button button-quiet" type="button" onClick={clearRoute}>
                <Trash2 size={14} /> Clear all
              </button>
            </div>
          </div>

          <button type="button" className={`field-route-board ${planner.alliance}`} onClick={handleFieldClick} aria-label="Interactive Override field route planner">
            <Image src={VEX_OVERRIDE.images.top} alt="Top-down official Override field layout" width={1200} height={1200} loading="eager" />
            <div className="field-route-grid" aria-hidden="true" />
            <span className="field-route-coordinate origin" aria-hidden="true">0, 0</span>
            <span className="field-route-coordinate extent" aria-hidden="true">144, 144</span>
            <span className="field-route-mode" aria-hidden="true"><Compass size={13} /> {placementMode === "start" ? "Place start pose" : "Add waypoint"}</span>
            <svg className="field-route-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {fullPath.slice(1).map((point, index) => {
                const prev = fullPath[index];
                const x1 = (prev.x / (GRID_SIZE - 1)) * 100;
                const y1 = (prev.y / (GRID_SIZE - 1)) * 100;
                const x2 = (point.x / (GRID_SIZE - 1)) * 100;
                const y2 = (point.y / (GRID_SIZE - 1)) * 100;
                return <line key={`${pointKey(prev)}-${pointKey(point)}-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </svg>
            {planner.startPoint ? <span className="field-route-marker start" style={{ ...pointToPercent(planner.startPoint), transform: `translate(-50%, -50%) rotate(${planner.startHeading}deg)` }}><span>S</span></span> : null}
            {planner.routePoints.map((point, index) => <span key={`${pointKey(point)}-${index}`} className="field-route-marker waypoint" style={pointToPercent(point)}>{index + 1}</span>)}
          </button>

          <div className="analysis-disclaimer">
            <Waypoints size={15} /> Place the robot once, then add route points in order. The planner snaps to its internal grid and emits measured turn-and-drive steps, not fake field coordinates.
          </div>

          {warnings.length ? (
            <div className="field-warning-list">
              {warnings.map((warning) => (
                <div key={warning} className="field-warning-item">
                  <AlertTriangle size={15} />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="analysis-disclaimer">
              <CheckCircle2 size={15} /> No obvious route-risk warnings are triggered by this draft.
            </div>
          )}
        </section>

        <aside className="suite-panel field-lab-sidebar">
          <div className="suite-panel-heading">
            <div>
              <span className="section-overline">Workspace context</span>
              <h2>Robot and event</h2>
            </div>
          </div>
          <p className="source-status">Team workspace: {teamId}</p>
          {selectedRobot ? (
            <div className="field-lab-robot-card">
              <span>Selected robot</span>
              <strong>{selectedRobot.name}</strong>
              <small>Configuration revision v{selectedRobot.revision}</small>
            </div>
          ) : (
            <div className="suite-empty">Choose a saved robot so this routine stays tied to a real team configuration.</div>
          )}
          <div className="field-lab-robot-card">
            <span>Selected event</span>
            <strong>{selectedEvent?.name || "No event selected"}</strong>
            <small>{selectedEvent ? `${selectedEvent.divisionName} · ${formatEventDate(selectedEvent.start)} · ${selectedEvent.venue}` : "Pick an official event in Event Mode to tie this routine to a match context."}</small>
          </div>

          <div className="competition-metric-strip field-lab-metric-strip" aria-label="Autonomous planner summary">
            <div className="competition-metric">
              <TimerReset size={18} />
              <strong>{VEX_OVERRIDE.scoring.autonomousBonus}</strong>
              <span>Autonomous bonus</span>
            </div>
            <div className="competition-metric">
              <Waypoints size={18} />
              <strong>{planner.routePoints.length}</strong>
              <span>Route points</span>
            </div>
            <div className="competition-metric">
              <Code2 size={18} />
              <strong>{routeDistance || 0}</strong>
              <span>Path inches</span>
            </div>
            <div className="competition-metric">
              <CheckCircle2 size={18} />
              <strong>{steps.length}</strong>
              <span>Motion steps</span>
            </div>
          </div>

          <div className="suite-panel nested-field-panel trajectory-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">Trajectory</span>
                <h2>Motion sequence</h2>
              </div>
              <span className="trajectory-total">{routeDistance || 0} in</span>
            </div>
            {steps.length ? <ol className="trajectory-list">
              {steps.map((step) => <li key={`${step.index}-${pointKey(step.to)}`}>
                <span>{String(step.index + 1).padStart(2, "0")}</span>
                <div><strong>{step.driveInches} in drive</strong><small>Turn {step.turnDegrees >= 0 ? "+" : ""}{step.turnDegrees} deg to {step.targetHeading} deg</small></div>
              </li>)}
            </ol> : <div className="trajectory-empty">Your measured segments will appear here as you draw.</div>}
          </div>

          <div className="suite-panel nested-field-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">Saved routines</span>
                <h2>Team-shared autonomous library</h2>
              </div>
            </div>
            <div className="field-routine-list">
              {planner.routines.map((routine) => (
                <article key={routine.id} className={routine.id === planner.activeRoutineId ? "is-active" : ""}>
                  <div>
                    <strong>{routine.name}</strong>
                    <small>{statusLabel(routine.status)} · {routine.ownerLabel}</small>
                    <small>{routine.updatedAt ? `Updated ${new Date(routine.updatedAt).toLocaleString()}` : "Not timestamped yet"}</small>
                  </div>
                  <div className="field-routine-actions">
                    <button type="button" className="button button-quiet" onClick={() => loadRoutine(routine.id)}>Load</button>
                    <button type="button" className="button button-quiet" onClick={() => deleteRoutine(routine.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {!planner.routines.length ? <div className="suite-empty">No saved routines yet. Save the current draft to create a shared autonomous library for this team.</div> : null}
            </div>
          </div>

          <div className="suite-panel nested-field-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">Generated output</span>
                <h2>Autonomous code</h2>
              </div>
              <div className="segmented">
                <button type="button" className={planner.language === "python" ? "active" : ""} onClick={() => updateDraft({ language: "python" })}>Python</button>
                <button type="button" className={planner.language === "cpp" ? "active" : ""} onClick={() => updateDraft({ language: "cpp" })}>C++</button>
              </div>
            </div>
            <div className="field-lab-code-intro">
              <strong>What this generates</strong>
              <p>Structured starter code with route constants, helper functions, and ordered turn-and-drive steps for the selected routine.</p>
            </div>
            <pre className="generated-code field-lab-code"><code>{generatedCode || "// Place the robot and add at least one route point to generate autonomous starter code."}</code></pre>
          </div>

          <div className="suite-panel nested-field-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">Team handoff</span>
                <h2>Shared notes</h2>
              </div>
            </div>
            <div className="field-lab-note-guide">
              <span>Strategy notes are for match intent. Pit / driver notes are for setup, execution, and retest details.</span>
            </div>
            <label>
              Strategy notes
              <textarea value={planner.notes} onChange={(event) => updateDraft({ notes: event.target.value })} placeholder="Scoring plan, side choice, fallback objective, match purpose." />
            </label>
            <label>
              Pit / driver notes
              <textarea value={planner.pitNotes} onChange={(event) => updateDraft({ pitNotes: event.target.value })} placeholder="Who tested it, preload notes, setup reminders, and field reset cautions." />
            </label>
          </div>
        </aside>
      </div>
    </section>
  );
}
