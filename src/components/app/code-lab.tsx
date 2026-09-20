"use client";

import { CodeExport } from "@/components/app/code-export";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Braces, CheckCircle2, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { saveTeamSection, readPendingTeamSection, flushPendingTeamSection, type SyncStatus } from "@/lib/client/team-sync";
import { VEX_V5_CONTROLLER_AXES, VEX_V5_CONTROLLER_BUTTONS } from "@/lib/vex-hardware";

const API_PYTHON = "https://api.vex.com/v5/home/python/index.html";
const API_CPP = "https://api.vex.com/v5/home/cpp/index.html";

import { emptyProfile, motorWatts, axisStick, buildPython, buildCpp, validateGenerator, validateAutonomous, type Robot, type RobotCodeProfile, type Stored, type DriveStyle, type Mapping } from "@/lib/vex-codegen";
import type { AutonomousRoute } from "@/lib/autonomous";

export function CodeLab({ teamId, activeRobotId, robots, initialState, routines = [] }: { teamId: string; activeRobotId: string | null; robots: Robot[]; initialState: Record<string, unknown>; routines?: (AutonomousRoute & { id: string; selectedRobotId: string | null })[] }) {
  const initialStored = (initialState && typeof initialState === "object" ? initialState : {}) as Stored;
  const [robotId, setRobotId] = useState(activeRobotId ?? robots[0]?.id ?? "");
  const [stored, setStored] = useState<Stored>(initialStored);
  const robot = robots.find((r) => r.id === robotId) ?? null;
  const rawProfile = stored[robotId] ?? emptyProfile();
  const profile: RobotCodeProfile = { ...emptyProfile(), ...rawProfile, driveStopMode: rawProfile.driveStopMode ?? "coast", mappings: (rawProfile.mappings ?? []).map((m) => ({ ...m, stopMode: m.stopMode ?? "coast", controller: m.controller ?? "primary" })) };
  const [language, setLanguage] = useState<"python" | "cpp">("python");
  const [code, setCode] = useState("");
  const [routineId, setRoutineId] = useState("");
  const routine = routines.find(r => r.id === routineId && r.selectedRobotId === robotId);
  const [sync, setSync] = useState<SyncStatus>("saved");
  const config = robot?.configuration ?? null;

  useEffect(() => {
    const pending = readPendingTeamSection<Record<string, unknown>>(teamId, "codeLab");
    // Restore the external browser cache after hydration; the server cannot read it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pending) setStored(pending as Stored);
    const retry = () => { void flushPendingTeamSection(teamId, "codeLab").then(status => status && setSync(status)); };
    retry();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [teamId]);
  function change(patch: Partial<RobotCodeProfile>) {
    if (!robotId) return;
    const next = { ...stored, [robotId]: { ...profile, ...patch } };
    setStored(next); setCode(""); setSync("saving");
    void saveTeamSection(teamId, "codeLab", next).then(setSync);
  }
  const driveMotors = config?.motors.filter((m) => m.purpose === "DRIVE") ?? [];
  const totalWatts = config?.motors.reduce((sum, m) => sum + motorWatts(m), 0) ?? 0;
  const driveWatts = driveMotors.reduce((sum, m) => sum + motorWatts(m), 0);
  const portConflict = config ? new Set(config.motors.map((m) => m.port)).size !== config.motors.length : false;
  const driveSidesKnown = driveMotors.some((m) => /left/i.test(m.label)) && driveMotors.some((m) => /right/i.test(m.label));
  const controlsComplete = profile.driveStyle === "tank" ? Boolean(profile.leftAxis && profile.rightAxis) : Boolean(profile.driveStyle && profile.forwardAxis && profile.turnAxis);
  const arcadeStickValid = profile.driveStyle === "arcade-left" ? axisStick(profile.forwardAxis) === "left" && axisStick(profile.turnAxis) === "left" : profile.driveStyle === "arcade-right" ? axisStick(profile.forwardAxis) === "right" && axisStick(profile.turnAxis) === "right" : profile.driveStyle !== "split-arcade" || (axisStick(profile.forwardAxis) && axisStick(profile.turnAxis) && axisStick(profile.forwardAxis) !== axisStick(profile.turnAxis));
  const mappingsComplete = profile.mappings.every((m) => Boolean(m.action.trim() && m.button && m.target && m.speed >= 1 && m.speed <= 100));
  const duplicateButtonKeys = profile.mappings.map((m) => `${m.controller}:${m.button}`).filter((key, index, list) => key.endsWith(":") ? false : list.indexOf(key) !== index);
  const generatorIssues = robot ? [...validateGenerator(robot, profile), ...(routine ? validateAutonomous(robot, routine) : [])] : [];
  const canGenerate = !generatorIssues.length && Boolean(robot && config && driveMotors.length >= 2 && controlsComplete && arcadeStickValid && mappingsComplete && !duplicateButtonKeys.length && !portConflict && totalWatts <= 88 && driveWatts <= 55);

  function addGroup() { change({ groups: [...profile.groups, { id: crypto.randomUUID(), name: "", motorIds: [] }] }); }
  function addMapping() { change({ mappings: [...profile.mappings, { id: crypto.randomUUID(), action: "", button: "", target: "", behavior: "hold", direction: "forward", speed: 100, stopMode: "coast", controller: "primary" }] }); }
  function generate() { if (!robot || !config || !canGenerate) return; setCode(language === "python" ? buildPython(robot, profile, routine) : buildCpp(robot, profile, routine)); }

  return <section className="workspace-page suite-page code-lab-v2">
    <header className="suite-hero compact"><div><div className="suite-badges"><span className="official-badge"><ShieldCheck size={13}/> VEX API-AWARE</span><span className={`status-chip ${sync === "saved" ? "good" : sync === "offline" ? "warn" : "neutral"}`}>{sync === "saved" ? "Team-synced" : sync === "saving" ? "Saving…" : sync === "offline" ? "Offline cache" : "Save retry needed"}</span></div><p className="page-kicker">Code Lab</p><h1>Generate controls from the robot you already configured.</h1><p>No duplicate hardware form. Pick a saved team robot, define how the V5 Controller should behave, and generate a competition-template starter.</p></div><a className="button button-quiet" href={language === "python" ? API_PYTHON : API_CPP} target="_blank" rel="noreferrer">Official VEX API <ExternalLink size={14}/></a></header>

    <section className="suite-panel code-robot-source"><div className="suite-panel-heading"><div><span className="section-overline">1 · Source of truth</span><h2>Saved robot configuration</h2></div></div>
      <label className="robot-select-label">Robot<select value={robotId} onChange={(e) => { setRobotId(e.target.value); setCode(""); }}><option value="">Select robot</option>{robots.map((r) => <option key={r.id} value={r.id}>{r.id === activeRobotId ? "★ " : ""}{r.name}</option>)}</select></label>
      {!robot ? <div className="suite-empty">Create a robot profile first.</div> : !config ? <div className="suite-empty">This robot has no hardware configuration yet.</div> : <div className="code-source-grid"><div><span>Revision</span><strong>v{config.configurationVersion}</strong></div><div><span>Drive motors</span><strong>{driveMotors.length || "—"}</strong></div><div><span>Total motor power</span><strong className={totalWatts > 88 ? "fail-text" : ""}>{totalWatts.toFixed(1)}W / 88W</strong></div><div><span>Drive-purpose power</span><strong className={driveWatts > 55 ? "fail-text" : ""}>{driveWatts.toFixed(1)}W / 55W</strong></div><div><span>Wheel</span><strong>{config.wheelDiameterIn ? `${config.wheelDiameterIn} in` : "Not recorded"}</strong></div><div><span>Track width</span><strong>{config.trackWidthIn ? `${config.trackWidthIn} in` : "Not recorded"}</strong></div></div>}
    </section>

    {config ? <>
      <section className="suite-panel controls-builder-panel"><div className="suite-panel-heading"><div><span className="section-overline">2 · Drive controls</span><h2>Choose exactly how the sticks drive.</h2></div><Braces size={18}/></div>
        <div className="form-grid three-col"><label>Drive style<select value={profile.driveStyle} onChange={(e) => change({ driveStyle: e.target.value as DriveStyle, forwardAxis: "", turnAxis: "", leftAxis: "", rightAxis: "" })}><option value="">Select</option><option value="tank">Tank · one axis per side</option><option value="arcade-left">Arcade · one left stick</option><option value="arcade-right">Arcade · one right stick</option><option value="split-arcade">Split arcade · forward and turn on different sticks</option></select></label>
          {profile.driveStyle === "tank" ? <><label>Left axis<select value={profile.leftAxis} onChange={(e) => change({ leftAxis: e.target.value })}><option value="">Select</option>{VEX_V5_CONTROLLER_AXES.map((a) => <option key={a}>{a}</option>)}</select></label><label>Right axis<select value={profile.rightAxis} onChange={(e) => change({ rightAxis: e.target.value })}><option value="">Select</option>{VEX_V5_CONTROLLER_AXES.map((a) => <option key={a}>{a}</option>)}</select></label></> : <><label>Forward axis<select value={profile.forwardAxis} onChange={(e) => change({ forwardAxis: e.target.value })}><option value="">Select</option>{VEX_V5_CONTROLLER_AXES.map((a) => <option key={a}>{a}</option>)}</select></label><label>Turn axis<select value={profile.turnAxis} onChange={(e) => change({ turnAxis: e.target.value })}><option value="">Select</option>{VEX_V5_CONTROLLER_AXES.map((a) => <option key={a}>{a}</option>)}</select></label></>}
          <label>Deadband %<input type="number" min="0" max="25" value={profile.deadband} onChange={(e) => change({ deadband: Math.max(0, Math.min(25, Number(e.target.value) || 0)) })}/></label><label>Joystick curve<select value={profile.curve} onChange={(e) => change({ curve: e.target.value as RobotCodeProfile["curve"] })}><option value="linear">Linear</option><option value="squared">Squared</option><option value="cubic">Cubic</option></select></label><label>Slew step % / 20 ms<input type="number" min="1" max="100" value={profile.slew} onChange={(e) => change({ slew: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}/></label><label>Drive stop mode<select value={profile.driveStopMode} onChange={(e)=>change({driveStopMode:e.target.value as RobotCodeProfile["driveStopMode"]})}><option value="coast">Coast</option><option value="brake">Brake</option><option value="hold">Hold</option></select></label>
        </div>
        {!driveSidesKnown && driveMotors.length ? <div className="analysis-disclaimer"><TriangleAlert size={15}/> Name drive motors with “Left” and “Right” so generated drive grouping is unambiguous. Generation is blocked until all drive motors have an unambiguous side.</div> : null}
        {!arcadeStickValid ? <div className="analysis-disclaimer"><TriangleAlert size={15}/> One-stick Arcade requires both axes from the selected stick; Split Arcade requires axes from different sticks.</div> : null}
      </section>

      <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">3 · Mechanism groups</span><h2>Group motors that should move together.</h2></div><button className="button button-quiet" type="button" onClick={addGroup}>Add group</button></div>
        <div className="motor-group-list">{profile.groups.map((group) => <div className="motor-group-row" key={group.id}><input value={group.name} placeholder="e.g. Intake" onChange={(e) => change({ groups: profile.groups.map((g) => g.id === group.id ? { ...g, name: e.target.value } : g) })}/><div className="motor-checkboxes">{config.motors.filter((m) => m.purpose !== "DRIVE").map((m) => <label key={m.id}><input type="checkbox" checked={group.motorIds.includes(m.id)} onChange={(e) => change({ groups: profile.groups.map((g) => g.id === group.id ? { ...g, motorIds: e.target.checked ? [...g.motorIds, m.id] : g.motorIds.filter((id) => id !== m.id) } : g) })}/>{m.label} · P{m.port}</label>)}</div><button type="button" className="icon-delete" onClick={() => change({ groups: profile.groups.filter((g) => g.id !== group.id) })}>×</button></div>)}{!profile.groups.length ? <div className="suite-empty">Optional. Create groups for paired intakes, lifts, conveyors, or other multi-motor mechanisms.</div> : null}</div>
      </section>

      <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">4 · V5 Controller</span><h2>Map each button to a named action.</h2></div><button className="button button-quiet" type="button" onClick={addMapping}>Add action</button></div>
        <div className="controller-builder-grid"><div className="v5-controller-visual" aria-label="V5 Controller mapping overview"><div className="controller-photo-frame"><Image src="/v5-controller-photo.jpg" alt="VEX V5 handheld controller" width={1024} height={1024} priority={false} /></div><div className="controller-button-chip-list">{VEX_V5_CONTROLLER_BUTTONS.map((b) => <span key={b} className={profile.mappings.some((m) => m.button === b) ? "mapped" : ""}>{b}</span>)}</div></div>
        <div className="controller-mapping-list">{profile.mappings.map((m) => <div className="controller-mapping-row v2" key={m.id}><input value={m.action} placeholder="What does this do?" onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, action: e.target.value } : x) })}/><select value={m.button} onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, button: e.target.value } : x) })}><option value="">Button</option>{VEX_V5_CONTROLLER_BUTTONS.map((b) => <option key={b}>{b}</option>)}</select><select value={m.target} onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, target: e.target.value } : x) })}><option value="">Target</option>{profile.groups.map((g) => <option key={g.id} value={g.id}>Group · {g.name || "Unnamed"}</option>)}{config.motors.filter((x) => x.purpose !== "DRIVE").map((x) => <option key={x.id} value={x.id}>Motor · {x.label}</option>)}{config.pneumatics.map((p) => <option key={p.id} value={`p:${p.id}`}>Pneumatic · {p.label}</option>)}</select><select value={m.controller} onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, controller: e.target.value as Mapping["controller"] } : x) })}><option value="primary">Primary controller</option><option value="partner">Partner controller</option></select><select value={m.behavior} onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, behavior: e.target.value as Mapping["behavior"] } : x) })}><option value="hold">Hold button</option><option value="toggle">Toggle on press</option></select><select value={m.direction} onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, direction: e.target.value as Mapping["direction"] } : x) })}><option value="forward">Forward / extend</option><option value="reverse">Reverse / retract</option></select><input type="number" min="1" max="100" value={m.speed} aria-label="Speed percent" onChange={(e) => change({ mappings: profile.mappings.map((x) => x.id === m.id ? { ...x, speed: Math.max(1, Math.min(100, Number(e.target.value) || 1)) } : x) })}/><select aria-label="Motor stop mode" value={m.stopMode} onChange={(e)=>change({mappings:profile.mappings.map((x)=>x.id===m.id?{...x,stopMode:e.target.value as Mapping["stopMode"]}:x)})}><option value="coast">Coast when off</option><option value="brake">Brake when off</option><option value="hold">Hold when off</option></select><button type="button" className="icon-delete" onClick={() => change({ mappings: profile.mappings.filter((x) => x.id !== m.id) })}>×</button></div>)}{!profile.mappings.length ? <div className="suite-empty">Nothing is assumed. Add only the controller actions your robot actually uses.</div> : null}</div></div>
      </section>

      {!mappingsComplete ? <div className="analysis-disclaimer"><TriangleAlert size={15}/> Every controller action needs a name, controller button, target, and valid speed before code generation.</div> : null}
      {duplicateButtonKeys.length ? <div className="analysis-disclaimer"><TriangleAlert size={15}/> The same controller button is assigned to more than one action. Resolve the duplicate mapping so behavior is deterministic.</div> : null}

      <section className="suite-panel code-generator-panel"><div className="suite-panel-heading"><div><span className="section-overline">5 · Generate & preflight</span><h2>Competition starter code</h2></div><div className="segmented"><button type="button" className={language === "python" ? "active" : ""} onClick={() => { setLanguage("python"); setCode(""); }}>Python</button><button type="button" className={language === "cpp" ? "active" : ""} onClick={() => { setLanguage("cpp"); setCode(""); }}>C++</button></div></div>
        <label className="auton-routine-picker">Autonomous routine<select value={routine?.id ?? ""} onChange={e => { setRoutineId(e.target.value); setCode(""); }}><option value="">Driver controls only - autonomous does nothing</option>{routines.filter(r => r.selectedRobotId === robotId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><span className="form-helper">Save a route in Autonomous Studio to include it with these driver controls.</span></label>
        <div className="validation-row"><div className={!portConflict ? "validation-card pass" : "validation-card fail"}>{!portConflict ? <CheckCircle2 size={17}/> : <TriangleAlert size={17}/>}<span>Port map<strong>{!portConflict ? "Passed" : "Conflict"}</strong></span></div><div className={controlsComplete && arcadeStickValid ? "validation-card pass" : "validation-card fail"}><Braces size={17}/><span>Controls<strong>{controlsComplete && arcadeStickValid ? "Defined" : "Incomplete"}</strong></span></div><div className={totalWatts <= 88 && driveWatts <= 55 ? "validation-card pass" : "validation-card fail"}><ShieldCheck size={17}/><span>Motor limits<strong>{totalWatts <= 88 && driveWatts <= 55 ? "Preflight passed" : "Review required"}</strong></span></div><div className="validation-card pass"><CheckCircle2 size={17}/><span>Output clamp<strong>-100% to 100%</strong></span></div><div className="validation-card pass"><CheckCircle2 size={17}/><span>Competition template<strong>Included</strong></span></div></div>
        <div className="auton-preflight" role="status">{generatorIssues.length > 0 && <ul>{generatorIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}</div><div className="generation-actions"><button className="button button-primary" type="button" disabled={!canGenerate} onClick={generate}>Generate starter code</button><p>{canGenerate ? "Generated code uses only saved ports and the controls above." : "Complete the failed preflight checks before generation."}</p></div><CodeExport code={code} language={language} name={robot?.name ?? "robot"}/><pre className="generated-code"><code>{code || "// No code generated yet."}</code></pre><p className="form-helper">API-aware means PitRelay generates against the documented VEX Controller, Motor, Brain, Competition, wait, and timing APIs it knows. It does not claim a hardware-in-the-loop compile unless you actually build the project in VEXcode / the VEX VS Code extension.</p>
      </section>
    </> : null}
  </section>;
}
