"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, ClipboardCheck, FileText, Link2, TimerReset } from "lucide-react";
import { useRouter } from "next/navigation";
import { createTestRunAction, type WorkspaceActionState } from "@/lib/actions/workspace";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

type TestRunType = "DRIVETRAIN" | "AUTONOMOUS" | "MECHANISM" | "OTHER";

type Robot = {
  id: string;
  name: string;
  configuration: null | {
    configurationVersion: number;
    mechanisms: { id: string; name: string; type: string }[];
  };
};

type PersistedRun = {
  id: string;
  robotId: string;
  configurationVersion: number;
  type: TestRunType;
  name: string;
  durationSeconds: number | null;
  score: number | null;
  passed: boolean;
  notes: string | null;
  createdAt: string;
  task: { id: string; title: string; status: string } | null;
  buildLogId: string | null;
  notebookEntryId: string | null;
};

type TestTask = {
  id: string;
  title: string;
  robotId: string | null;
  status: string;
};

type DisplayRun = PersistedRun & {
  source: "Saved record" | "Legacy shared record";
};

const EMPTY: WorkspaceActionState = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function legacyRuns(initialState: Record<string, unknown>): DisplayRun[] {
  const records: DisplayRun[] = [];
  const rawRuns = Array.isArray(initialState.runs) ? initialState.runs : [];
  const rawCycles = Array.isArray(initialState.cycles) ? initialState.cycles : [];

  for (const value of rawRuns) {
    if (!isRecord(value)) continue;
    const id = typeof value.id === "string" ? value.id : "";
    const robotId = typeof value.robotId === "string" ? value.robotId : "";
    const name = typeof value.route === "string" ? value.route.trim() : "";
    const createdAt = validTimestamp(value.createdAt);
    const configurationVersion = Number(value.revision);
    const durationSeconds = Number(value.time);
    const score = value.score === null || value.score === undefined || value.score === "" ? null : Number(value.score);

    if (!id || !robotId || !name || !createdAt || !Number.isInteger(configurationVersion) || !Number.isFinite(durationSeconds)) continue;
    records.push({
      id: `legacy-run-${id}`,
      robotId,
      configurationVersion,
      type: "AUTONOMOUS",
      name,
      durationSeconds,
      score: Number.isFinite(score) ? score : null,
      passed: value.success === true,
      notes: typeof value.note === "string" ? value.note : null,
      createdAt,
      task: null,
      buildLogId: null,
      notebookEntryId: null,
      source: "Legacy shared record",
    });
  }

  for (const value of rawCycles) {
    if (!isRecord(value)) continue;
    const id = typeof value.id === "string" ? value.id : "";
    const robotId = typeof value.robotId === "string" ? value.robotId : "";
    const mechanism = typeof value.mechanism === "string" ? value.mechanism.trim() : "";
    const version = typeof value.mechanismVersion === "string" ? value.mechanismVersion.trim() : "";
    const createdAt = validTimestamp(value.createdAt);
    const configurationVersion = Number(value.revision);

    if (!id || !robotId || !mechanism || !createdAt || !Number.isInteger(configurationVersion)) continue;
    records.push({
      id: `legacy-cycle-${id}`,
      robotId,
      configurationVersion,
      type: "MECHANISM",
      name: version ? `${mechanism} (${version})` : mechanism,
      durationSeconds: null,
      score: null,
      passed: value.success === true,
      notes: typeof value.note === "string" ? value.note : null,
      createdAt,
      task: null,
      buildLogId: null,
      notebookEntryId: null,
      source: "Legacy shared record",
    });
  }

  return records;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function typeLabel(type: TestRunType) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function FormMessage({ state }: { state: WorkspaceActionState }) {
  if (state.error) return <p className="form-message is-error" role="alert">{state.error}</p>;
  if (state.success) return <p className="form-message is-success" role="status">{state.success}</p>;
  return null;
}

export function TestingCenter({
  teamId,
  activeRobotId,
  robots,
  initialState,
  persistedRuns,
  openTasks,
}: {
  teamId: string;
  activeRobotId: string | null;
  robots: Robot[];
  initialState: Record<string, unknown>;
  persistedRuns: PersistedRun[];
  openTasks: TestTask[];
}) {
  const router = useRouter();
  const [robotId, setRobotId] = useState(activeRobotId ?? robots[0]?.id ?? "");
  const [testType, setTestType] = useState<TestRunType>("AUTONOMOUS");
  const [state, formAction, pending] = useActionState(createTestRunAction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  useFormErrorFocus(state.error, formRef);

  const robot = robots.find((candidate) => candidate.id === robotId) ?? null;
  const configurationVersion = robot?.configuration?.configurationVersion ?? 0;
  const legacy = legacyRuns(initialState);
  const saved: DisplayRun[] = persistedRuns.map((run) => ({ ...run, source: "Saved record" }));
  const currentRuns = [...saved, ...legacy]
    .filter((run) => run.robotId === robotId && run.configurationVersion === configurationVersion)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const eligibleTasks = openTasks.filter((task) => !task.robotId || task.robotId === robotId);
  const autonomousRuns = currentRuns.filter((run) => run.type === "AUTONOMOUS");
  const passedRuns = currentRuns.filter((run) => run.passed);
  const autonomousPassed = autonomousRuns.filter((run) => run.passed);
  const timedAutonomousRuns = autonomousRuns.filter((run) => run.durationSeconds !== null);
  const averageAutonomousTime = timedAutonomousRuns.length
    ? timedAutonomousRuns.reduce((total, run) => total + (run.durationSeconds ?? 0), 0) / timedAutonomousRuns.length
    : null;
  const linkedEvidence = currentRuns.filter((run) => run.buildLogId || run.notebookEntryId).length;

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <section className="workspace-page suite-page">
      <header className="suite-hero compact">
        <div>
          <div className="suite-badges">
            <span className="analysis-badge"><Activity size={13} /> TEST EVIDENCE</span>
            <span className="status-chip good">DATABASE RECORDS</span>
          </div>
          <p className="page-kicker">Testing</p>
          <h1>Reliability belongs to a robot revision.</h1>
          <p>Every new test is saved against the selected robot and its current configuration revision. Results below show recorded evidence only.</p>
        </div>
      </header>

      <section className="suite-panel">
        <label className="robot-select-label">Robot
          <select value={robotId} onChange={(event) => setRobotId(event.target.value)}>
            <option value="">Select robot</option>
            {robots.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.id === activeRobotId ? "Current: " : ""}{candidate.name}</option>)}
          </select>
        </label>
        {robot ? <p className="form-helper">Current configuration revision: <strong>v{configurationVersion || "unconfigured"}</strong>. Tests from other revisions are kept separate.</p> : <p className="form-helper">Create a robot before recording test evidence.</p>}
      </section>

      <div className="test-kpis" aria-label="Current robot test statistics">
        <div><span>CURRENT PASS RATE</span><strong>{currentRuns.length ? `${Math.round((passedRuns.length / currentRuns.length) * 100)}%` : "--"}</strong><small>{currentRuns.length ? `${passedRuns.length} of ${currentRuns.length} recorded tests` : "No current-revision tests"}</small></div>
        <div><span>AUTONOMOUS PASS</span><strong>{autonomousRuns.length ? `${Math.round((autonomousPassed.length / autonomousRuns.length) * 100)}%` : "--"}</strong><small>{autonomousRuns.length ? `${autonomousPassed.length} of ${autonomousRuns.length} autonomous runs` : "No autonomous runs"}</small></div>
        <div><span>AVG. AUTO TIME</span><strong>{averageAutonomousTime === null ? "--" : `${averageAutonomousTime.toFixed(2)}s`}</strong><small>{timedAutonomousRuns.length ? `${timedAutonomousRuns.length} timed runs` : "No timing recorded"}</small></div>
        <div><span>LINKED EVIDENCE</span><strong>{linkedEvidence}</strong><small>{currentRuns.length ? `${currentRuns.length - linkedEvidence} without linked evidence` : "No test records"}</small></div>
      </div>

      <section className="suite-panel">
        <div className="suite-panel-heading">
          <div><span className="section-overline">New record</span><h2>Log a test result</h2></div>
          <TimerReset size={18} />
        </div>
        <form ref={formRef} action={formAction} className="structured-form document-form testing-record-form" aria-busy={pending}>
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="robotId" value={robotId} />
          <input type="hidden" name="configurationVersion" value={configurationVersion} />
          <label>Test type
            <select name="type" value={testType} onChange={(event) => setTestType(event.target.value as TestRunType)} disabled={!robot}>
              <option value="AUTONOMOUS">Autonomous</option>
              <option value="DRIVETRAIN">Drivetrain</option>
              <option value="MECHANISM">Mechanism</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>Test or route name
            <input name="name" required minLength={2} maxLength={180} disabled={!robot} list={testType === "MECHANISM" ? "mechanism-options" : undefined} placeholder={testType === "AUTONOMOUS" ? "e.g. Left-side preload route" : "Name the test"} />
            {testType === "MECHANISM" ? <datalist id="mechanism-options">{robot?.configuration?.mechanisms.map((mechanism) => <option key={mechanism.id} value={mechanism.name} />)}</datalist> : null}
          </label>
          <label>Duration in seconds <input name="durationSeconds" type="number" min="0.01" max="86400" step="0.01" disabled={!robot} placeholder="Optional" /></label>
          <label>Score <input name="score" type="number" step="0.01" disabled={!robot} placeholder="Optional" /></label>
          <label>Result
            <select name="passed" required defaultValue="" disabled={!robot}>
              <option value="" disabled>Select result</option>
              <option value="pass">Passed</option>
              <option value="fail">Failed</option>
            </select>
          </label>
          <label>Related task
            <select name="taskId" defaultValue="" disabled={!robot}>
              <option value="">No task linked</option>
              {eligibleTasks.map((task) => <option key={task.id} value={task.id}>{task.title} ({statusLabel(task.status)})</option>)}
            </select>
          </label>
          <label className="field-wide">Observation<textarea name="notes" rows={3} maxLength={4000} disabled={!robot} placeholder="Record what happened, including failures or conditions that affected the result." /></label>
          <label className="checkbox-field"><input name="createEvidence" type="checkbox" defaultChecked disabled={!robot} /> Create a linked build-log evidence record</label>
          <label className="checkbox-field"><input name="completeTask" type="checkbox" disabled={!robot} /> Mark the selected task complete</label>
          <FormMessage state={state} />
          <button className="button button-primary" type="submit" disabled={!robot || pending}>{pending ? <InlineSpinner /> : <ClipboardCheck size={15} />}{pending ? "Saving..." : "Save test record"}</button>
        </form>
        {state.notebookDraftId ? <p className="form-helper testing-notebook-handoff"><Link href={`/notebook?team=${encodeURIComponent(teamId)}&fromTest=${encodeURIComponent(state.notebookDraftId)}`}><FileText size={14} /> Review this result in an editable notebook draft <Link2 size={13} /></Link></p> : null}
      </section>

      <section className="suite-panel">
        <div className="suite-panel-heading">
          <div><span className="section-overline">Recorded evidence</span><h2>Current revision history</h2></div>
          <CheckCircle2 size={18} />
        </div>
        <div className="run-table">
          <div className="run-row test-run-row head"><span>Test</span><span>Time</span><span>Score</span><span>Result</span><span>Evidence</span><span>Notes</span></div>
          {currentRuns.slice(0, 20).map((run) => <div className="run-row test-run-row" key={run.id}>
            <strong><small>{typeLabel(run.type)}</small>{run.name}</strong>
            <span data-label="Time">{run.durationSeconds === null ? "--" : `${run.durationSeconds.toFixed(2)}s`}</span>
            <span data-label="Score">{run.score === null ? "--" : run.score}</span>
            <span data-label="Result" className={run.passed ? "pass-text" : "fail-text"}>{run.passed ? "PASS" : "FAIL"}</span>
            <span data-label="Evidence">{run.buildLogId || run.notebookEntryId ? "Linked" : run.source}</span>
            <small data-label="Notes">{run.notes || formatDate(run.createdAt)}</small>
          </div>)}
          {!currentRuns.length ? <div className="suite-empty">No tests are recorded for this robot revision yet.</div> : null}
        </div>
      </section>
    </section>
  );
}
