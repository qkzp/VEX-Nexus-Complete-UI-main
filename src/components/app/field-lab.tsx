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
  Play,
  Pause,
} from "lucide-react";
import { readPendingTeamSection, flushPendingTeamSection, saveTeamSection, type SyncStatus } from "@/lib/client/team-sync";
import { CodeExport } from "@/components/app/code-export";
import { buildAutonomousProgram, validateAutonomous, type Robot } from "@/lib/vex-codegen";
import { buildMotionSteps, toFieldCoordinates, GRID_SIZE, type AutonomousAction, type MotionStep, type PlannerPoint } from "@/lib/autonomous";
import { VEX_OVERRIDE } from "@/lib/vex-official";

type FieldLabRobot = {
  id: string;
  name: string;
  revision: number;
  configuration: Robot["configuration"];
};

type RoutineStatus = "draft" | "testing" | "comp-ready";

type FieldLabRoutine = {
  id: string;
  name: string;
  alliance: "red" | "blue";
  selectedRobotId: string | null;
  startHeading: number;
  speed: number;
  timeLimit: number;
  startPoint: PlannerPoint | null;
  routePoints: PlannerPoint[];
  actions: AutonomousAction[];
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
  speed: number;
  timeLimit: number;
  language: "python" | "cpp";
  activeRoutineId: string | null;
  routines: FieldLabRoutine[];
  selectedRobotId: string | null;
  routeName: string;
  alliance: "red" | "blue";
  startHeading: number;
  startPoint: PlannerPoint | null;
  routePoints: PlannerPoint[];
  actions: AutonomousAction[];
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


const DEFAULT_STATE: FieldLabState = {
  language: "python",
  activeRoutineId: null,
  routines: [],
  selectedRobotId: null,
  routeName: "override_auton",
  alliance: "red",
  startHeading: 0,
  speed: 35,
  timeLimit: 15,
  startPoint: null,
  routePoints: [],
  actions: [],
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

function parseActions(value: unknown): AutonomousAction[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AutonomousAction => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.targetId === "string" && ["wait", "motor", "pneumatic"].includes(item.kind) && Number.isFinite(item.afterStep) && Number.isFinite(item.value) && Number.isFinite(item.durationMs)));
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
    speed: clamp(Number(row.speed) || 35, 5, 100),
    timeLimit: row.timeLimit === 60 ? 60 : 15,
    startPoint: parsePoint(row.startPoint),
    routePoints: parsePoints(row.routePoints),
    actions: parseActions(row.actions),
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
  const activeRoutineId = typeof raw.activeRoutineId === "string" ? raw.activeRoutineId : raw.activeRoutineId === null ? null : routines[0]?.id ?? null;
  const activeRoutine = routines.find((routine) => routine.id === activeRoutineId) ?? null;

  return {
    language: raw.language === "cpp" ? "cpp" : "python",
    activeRoutineId,
    routines,
    selectedRobotId: Object.hasOwn(raw, "selectedRobotId") ? (typeof raw.selectedRobotId === "string" ? raw.selectedRobotId : null) : activeRoutine?.selectedRobotId ?? fallbackRobotId,
    routeName: typeof raw.routeName === "string" ? raw.routeName : activeRoutine?.name ?? DEFAULT_STATE.routeName,
    alliance: raw.alliance === "blue" ? "blue" : raw.alliance === "red" ? "red" : activeRoutine?.alliance ?? "red",
    startHeading: Number.isFinite(Number(raw.startHeading)) ? clamp(Number(raw.startHeading), -180, 180) : activeRoutine?.startHeading ?? 0,
    speed: clamp(Number(raw.speed ?? activeRoutine?.speed) || 35, 5, 100),
    timeLimit: (raw.timeLimit ?? activeRoutine?.timeLimit) === 60 ? 60 : 15,
    startPoint: Object.hasOwn(raw, "startPoint") ? parsePoint(raw.startPoint) : activeRoutine?.startPoint ?? null,
    routePoints: Array.isArray(raw.routePoints) ? parsePoints(raw.routePoints) : activeRoutine?.routePoints ?? [],
    actions: parseActions(raw.actions ?? activeRoutine?.actions),
    notes: (typeof raw.notes === "string" ? raw.notes : ""),
    pitNotes: (typeof raw.pitNotes === "string" ? raw.pitNotes : ""),
    status: raw.status === "testing" || raw.status === "comp-ready" ? raw.status : "draft",
    ownerLabel: (typeof raw.ownerLabel === "string" && raw.ownerLabel.trim() ? raw.ownerLabel : "Team workspace"),
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
  const [preview, setPreview] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [placementMode, setPlacementMode] = useState<"start" | "route">("route");

  useEffect(() => {
    const pending = readPendingTeamSection<Record<string, unknown>>(teamId, "fieldLab");
    // Restore the external browser cache after hydration; the server cannot read it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pending) setPlanner(parseState(pending, fallbackRobotId));
    const retry = () => { void flushPendingTeamSection(teamId, "fieldLab").then(status => status && setSync(status)); };
    retry();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [teamId, fallbackRobotId]);

  const selectedRobot = robots.find((robot) => robot.id === planner.selectedRobotId) ?? null;
  const fullPath = useMemo(
    () => (planner.startPoint ? [planner.startPoint, ...planner.routePoints] : planner.routePoints),
    [planner.startPoint, planner.routePoints],
  );
  const steps = useMemo(() => buildMotionSteps(planner.startHeading, fullPath), [planner.startHeading, fullPath]);
  const warnings = useMemo(() => buildWarnings(fullPath, steps), [fullPath, steps]);
  const routeDistance = useMemo(() => round(steps.reduce((sum, step) => sum + step.driveInches, 0), 2), [steps]);
  const route = { name: planner.routeName, startHeading: planner.startHeading, startPoint: planner.startPoint, routePoints: planner.routePoints, speed: planner.speed, timeLimit: planner.timeLimit, actions: planner.actions };
  const preflight = selectedRobot ? validateAutonomous(selectedRobot, route) : ["Select a saved robot to generate code."];
  const generatedCode = preflight.length || !selectedRobot ? "" : buildAutonomousProgram(selectedRobot, route, planner.language);
  const previewIndex = Math.min(Math.floor(preview), Math.max(0, fullPath.length - 1));
  const previewFrom = fullPath[previewIndex];
  const previewTo = fullPath[Math.min(previewIndex + 1, fullPath.length - 1)];
  const previewPoint = previewFrom && previewTo ? { x: previewFrom.x + (previewTo.x - previewFrom.x) * (preview % 1), y: previewFrom.y + (previewTo.y - previewFrom.y) * (preview % 1) } : null;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setPreview(value => (value + 0.035 >= fullPath.length - 1 ? 0 : value + 0.035)), 40);
    return () => clearInterval(timer);
  }, [playing, fullPath.length]);

  function persist(next: FieldLabState) {
    setPlaying(false);
    setPreview(0);
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
      speed: planner.speed,
      timeLimit: planner.timeLimit,
      startPoint: planner.startPoint,
      routePoints: planner.routePoints,
      actions: planner.actions,
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
      speed: routine.speed,
      timeLimit: routine.timeLimit,
      startPoint: routine.startPoint,
      routePoints: routine.routePoints,
      actions: routine.actions,
      notes: routine.notes,
      pitNotes: routine.pitNotes,
      status: routine.status,
      ownerLabel: routine.ownerLabel,
    });
  }

  function deleteRoutine(routineId: string) {
    const routines = planner.routines.filter((entry) => entry.id !== routineId);
    if (routineId !== planner.activeRoutineId) { persist({ ...planner, routines }); return; }
    const fallback = routines[0] ?? null;
    persist({
      ...planner,
      routines,
      activeRoutineId: fallback?.id ?? null,
      selectedRobotId: fallback?.selectedRobotId ?? fallbackRobotId,
      routeName: fallback?.name ?? DEFAULT_STATE.routeName,
      alliance: fallback?.alliance ?? "red",
      startHeading: fallback?.startHeading ?? 0,
      speed: fallback?.speed ?? 35,
      timeLimit: fallback?.timeLimit ?? 15,
      startPoint: fallback?.startPoint ?? null,
      routePoints: fallback?.routePoints ?? [],
      actions: fallback?.actions ?? [],
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
      actions: [],
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
    persist({ ...planner, startPoint: null, routePoints: [], actions: [] });
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
            <Link className="button button-quiet button-large" href={`/events?team=${encodeURIComponent(teamId)}`}>
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
            <label>Drive speed %<input type="number" min="5" max="100" value={planner.speed} onChange={e => updateDraft({ speed: clamp(Number(e.target.value) || 5, 5, 100) })}/></label>
            <label>Time budget<select value={planner.timeLimit} onChange={e => updateDraft({ timeLimit: Number(e.target.value) })}><option value="15">Match - 15 seconds</option><option value="60">Skills - 60 seconds</option></select></label>
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
              <button className="button button-quiet" type="button" disabled={!planner.startPoint} onClick={() => updateDraft({ startPoint: planner.startPoint ? { x: 95 - planner.startPoint.x, y: planner.startPoint.y } : null, routePoints: planner.routePoints.map(p => ({ x: 95 - p.x, y: p.y })), startHeading: ((180 - planner.startHeading + 540) % 360) - 180, alliance: planner.alliance === "red" ? "blue" : "red" })}>Mirror route</button>
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
            <Image src="/override-field-autonomous.webp" alt="Override field interior, nominal 144 by 144 inches" width={716} height={716} loading="eager" />
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
            {previewPoint && <span className="field-preview-robot" style={{ ...pointToPercent(previewPoint), transform: `translate(-50%, -50%) rotate(${previewFrom && previewTo && previewIndex < fullPath.length - 1 ? Math.atan2(previewTo.y - previewFrom.y, previewTo.x - previewFrom.x) * 180 / Math.PI : steps.at(-1)?.targetHeading ?? planner.startHeading}deg)` }} aria-hidden="true">➤</span>}
            {planner.startPoint ? <span className="field-route-marker start" style={{ ...pointToPercent(planner.startPoint), transform: `translate(-50%, -50%) rotate(${planner.startHeading}deg)` }}><span>S</span></span> : null}
            {planner.routePoints.map((point, index) => <span key={`${pointKey(point)}-${index}`} className="field-route-marker waypoint" style={pointToPercent(point)}>{index + 1}</span>)}
          </button>

          <div className="auton-preview-controls"><button type="button" className="button button-quiet" disabled={steps.length === 0} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15}/> : <Play size={15}/>} {playing ? "Pause" : "Preview route"}</button><input aria-label="Route preview position" type="range" min="0" max={Math.max(0, fullPath.length - 1)} step="0.01" value={preview} onChange={e => { setPlaying(false); setPreview(Number(e.target.value)); }}/><span>Geometry preview</span></div>
          <div className="analysis-disclaimer">
            <Waypoints size={15} /> Place your start, then click to add waypoints. 0 degrees faces right, +90 degrees faces down; positive turns are clockwise. Coordinates are inches from the upper-left. Alliance is a label; use Mirror to reflect the path.
          </div>

          <details className="auton-waypoint-editor"><summary>Edit coordinates - inches</summary><p>Enter a starting point or adjust any waypoint without using the field.</p><button type="button" className="button button-quiet" onClick={() => updateDraft(planner.startPoint ? { routePoints: [...planner.routePoints, { x: 47.5, y: 47.5 }] } : { startPoint: { x: 47.5, y: 47.5 } })}>Add {planner.startPoint ? "waypoint" : "start"} at center</button>{fullPath.map((point, index) => <div className="auton-point-row" key={index}><strong>{index === 0 ? "Start" : `Point ${index}`}</strong>{(["x", "y"] as const).map(axis => <label key={axis}>{axis.toUpperCase()}<input type="number" min="0" max="144" step="0.1" value={toFieldCoordinates(point)[axis]} onChange={e => { const next = { ...point, [axis]: clamp(Number(e.target.value) || 0, 0, 144) / 144 * 95 }; updateDraft(index === 0 ? { startPoint: next } : { routePoints: planner.routePoints.map((p, i) => i === index - 1 ? next : p) }); }}/></label>)}{index > 0 && <button type="button" className="button button-quiet" aria-label={`Remove waypoint ${index}`} onClick={() => updateDraft({ routePoints: planner.routePoints.filter((_, i) => i !== index - 1) })}><Trash2 size={14}/></button>}</div>)}</details>
          <section className="auton-actions-editor" aria-label="Mechanism sequence">
            <div className="suite-panel-heading"><div><span className="section-overline">Scoring actions</span><h2>More than a drive path.</h2></div><button className="button button-quiet" type="button" onClick={() => updateDraft({ actions: [...planner.actions, { id: createId(), afterStep: steps.length, kind: "wait", targetId: "", value: 0, durationMs: 500 }] })}>Add action</button></div>
            <p className="form-helper">Actions run in list order at the selected step. Motor actions run for the specified time, then brake. Negative speed reverses the motor. All actions share the routine time budget.</p>
            {planner.actions.map((action, index) => {
              const edit = (patch: Partial<AutonomousAction>) => updateDraft({ actions: planner.actions.map(a => a.id === action.id ? { ...a, ...patch } : a) });
              return <div className="auton-action-row" key={action.id}>
                <strong>Action {index + 1}</strong>
                <label>When<select value={action.afterStep} onChange={e => edit({ afterStep: Number(e.target.value) })}><option value="0">Before driving</option>{steps.map(step => <option key={step.index} value={step.index}>After step {step.index}</option>)}</select></label>
                <label>Action<select value={action.kind} onChange={e => edit({ kind: e.target.value as AutonomousAction["kind"], targetId: "", value: 0 })}><option value="wait">Wait</option><option value="motor">Run motor</option><option value="pneumatic">Set pneumatic</option></select></label>
                {action.kind !== "wait" && <label>Device<select value={action.targetId} onChange={e => edit({ targetId: e.target.value })}><option value="">Select device</option>{action.kind === "motor" ? selectedRobot?.configuration?.motors.filter(m => m.purpose !== "DRIVE").map(m => <option key={m.id} value={m.id}>{m.label}</option>) : selectedRobot?.configuration?.pneumatics.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>}
                {action.kind === "motor" && <label>Speed %<input type="number" min="-100" max="100" value={action.value} onChange={e => edit({ value: clamp(Number(e.target.value) || 0, -100, 100) })}/></label>}
                {action.kind === "pneumatic" && <label>State<select value={action.value} onChange={e => edit({ value: Number(e.target.value) })}><option value="0">Retract / off</option><option value="1">Extend / on</option></select></label>}
                <label>{action.kind === "pneumatic" ? "Settle time ms" : "Duration ms"}<input type="number" min={action.kind === "motor" ? 1 : 0} max="10000" step="50" value={action.durationMs} onChange={e => edit({ durationMs: clamp(Number(e.target.value) || 0, 0, 10000) })}/></label>
                <button className="button button-quiet" type="button" aria-label={`Remove action ${index + 1}`} onClick={() => updateDraft({ actions: planner.actions.filter(a => a.id !== action.id) })}><Trash2 size={14}/></button>
              </div>;
            })}
            {!planner.actions.length && <p className="suite-empty">Add an intake, clamp, or pause at a waypoint.</p>}
          </section>
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
                <span>{String(step.index).padStart(2, "0")}</span>
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
              <p>Encoder-based motor commands using your saved ports, wheel diameter, track width, and gearing. Includes a competition callback and tank controls (Axis3 left / Axis2 right). Turns require field calibration.</p>
            </div>
            {preflight.length > 0 && <div className="auton-preflight" role="status"><strong>Before you export</strong><ul>{preflight.map(issue => <li key={issue}>{issue}</li>)}</ul><Link href={`/robots/${planner.selectedRobotId ?? ""}?team=${encodeURIComponent(teamId)}`}>Open robot configuration</Link></div>}
            <CodeExport code={generatedCode} language={planner.language} name={planner.routeName} />
            <p className="form-helper">Create a new VEXcode text project with no auto-configured devices, then replace main.py or src/main.cpp. Compile in VEXcode before downloading. Preview is a geometric illustration; it does not predict collisions, wheel slip, or scoring.</p>
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
