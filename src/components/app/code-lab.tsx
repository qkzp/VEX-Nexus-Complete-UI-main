"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Braces, CheckCircle2, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { saveTeamSection, flushPendingTeamSection, type SyncStatus } from "@/lib/client/team-sync";
import { VEX_V5_CONTROLLER_AXES, VEX_V5_CONTROLLER_BUTTONS } from "@/lib/vex-hardware";

const API_PYTHON = "https://api.vex.com/v5/home/python/index.html";
const API_CPP = "https://api.vex.com/v5/home/cpp/index.html";

type Motor = { id: string; label: string; port: number; cartridge: string; customRpm: number | null; reversed: boolean; purpose: string; mechanismId: string | null };
type Pneumatic = { id: string; label: string; threeWirePort: string };
type Robot = {
  id: string;
  name: string;
  configuration: null | {
    drivetrainType: string | null;
    wheelDiameterIn: number | null;
    trackWidthIn: number | null;
    customProperties: unknown;
    configurationVersion: number;
    motors: Motor[];
    sensors: { id: string; label: string; smartPort: number | null; threeWirePort: string | null; type: string }[];
    pneumatics: Pneumatic[];
    mechanisms: { id: string; name: string; type: string }[];
  };
};

type DriveStyle = "" | "tank" | "arcade-left" | "arcade-right" | "split-arcade";
type Group = { id: string; name: string; motorIds: string[] };
type Mapping = {
  id: string;
  action: string;
  button: string;
  target: string;
  behavior: "hold" | "toggle";
  direction: "forward" | "reverse";
  speed: number;
  stopMode: "coast" | "brake" | "hold";
  controller: "primary" | "partner";
};
type RobotCodeProfile = {
  driveStyle: DriveStyle;
  forwardAxis: string;
  turnAxis: string;
  leftAxis: string;
  rightAxis: string;
  deadband: number;
  curve: "linear" | "squared" | "cubic";
  slew: number;
  driveStopMode: "coast" | "brake" | "hold";
  groups: Group[];
  mappings: Mapping[];
};
type Stored = Record<string, RobotCodeProfile>;

const emptyProfile = (): RobotCodeProfile => ({
  driveStyle: "",
  forwardAxis: "",
  turnAxis: "",
  leftAxis: "",
  rightAxis: "",
  deadband: 5,
  curve: "linear",
  slew: 100,
  driveStopMode: "coast",
  groups: [],
  mappings: [],
});

function ident(value: string, fallback: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return clean || fallback;
}
function motorRpm(motor: Motor) {
  if (motor.cartridge === "RPM_100") return 100;
  if (motor.cartridge === "RPM_200") return 200;
  if (motor.cartridge === "RPM_600") return 600;
  return motor.customRpm ?? 200;
}
function motorWatts(motor: Motor) { return motor.cartridge === "CUSTOM" && motor.customRpm === 200 ? 5.5 : 11; }
function pythonGear(motor: Motor) { const rpm = motorRpm(motor); return rpm === 100 ? "GearSetting.RATIO_36_1" : rpm === 600 ? "GearSetting.RATIO_6_1" : "GearSetting.RATIO_18_1"; }
function cppGear(motor: Motor) { const rpm = motorRpm(motor); return rpm === 100 ? "ratio36_1" : rpm === 600 ? "ratio6_1" : "ratio18_1"; }
function clampLinePython(value: string) { return `max(-100, min(100, ${value}))`; }
function clampLineCpp(value: string) { return `std::max(-100.0, std::min(100.0, ${value}))`; }

function axisStick(axis: string) {
  if (axis === "Axis3" || axis === "Axis4") return "left";
  if (axis === "Axis1" || axis === "Axis2") return "right";
  return "";
}

function pythonStop(mode: Mapping["stopMode"] | RobotCodeProfile["driveStopMode"]) {
  return mode === "hold" ? "HOLD" : mode === "brake" ? "BRAKE" : "COAST";
}
function cppStop(mode: Mapping["stopMode"] | RobotCodeProfile["driveStopMode"]) {
  return mode === "hold" ? "hold" : mode === "brake" ? "brake" : "coast";
}

function driveSides(config: NonNullable<Robot["configuration"]>) {
  const drive = config.motors.filter((m) => m.purpose === "DRIVE");
  const left = drive.filter((m) => /left/i.test(m.label));
  const right = drive.filter((m) => /right/i.test(m.label));
  const half = Math.floor(drive.length / 2);
  return {
    left: left.length && right.length ? left : drive.slice(0, half),
    right: left.length && right.length ? right : drive.slice(half),
  };
}

function buildPython(robot: Robot, profile: RobotCodeProfile) {
  const config = robot.configuration!;
  const sides = driveSides(config);
  const usesPartner = profile.mappings.some((m) => m.controller === "partner");
  const lines: string[] = ["from vex import *", "", "brain = Brain()", "controller = Controller(PRIMARY)"];
  if (usesPartner) lines.push("partner = Controller(PARTNER)");
  for (const motor of config.motors) {
    lines.push(`${ident(motor.label, `motor_${motor.port}`)} = Motor(Ports.PORT${motor.port}, ${pythonGear(motor)}, ${motor.reversed ? "True" : "False"})`);
  }
  for (const pneumatic of config.pneumatics) {
    lines.push(`${ident(pneumatic.label, `pneumatic_${pneumatic.threeWirePort}`)} = DigitalOut(brain.three_wire_port.${pneumatic.threeWirePort.toLowerCase()})`);
  }
  lines.push(
    "",
    `DEADBAND = ${profile.deadband}`,
    `SLEW_STEP = ${profile.slew}`,
    `DRIVE_STOP = ${pythonStop(profile.driveStopMode)}`,
    "",
    "def shape_axis(value):",
    "    if abs(value) < DEADBAND:",
    "        return 0",
  );
  if (profile.curve === "squared") lines.push("    return (value * abs(value)) / 100");
  else if (profile.curve === "cubic") lines.push("    return (value * value * value) / 10000");
  else lines.push("    return value");
  lines.push(
    "",
    "def slew(current, target):",
    "    delta = target - current",
    "    if abs(delta) <= SLEW_STEP:",
    "        return target",
    "    return current + (SLEW_STEP if delta > 0 else -SLEW_STEP)",
    "",
    "def run_motor(motor, velocity_pct, stop_mode=COAST):",
    "    velocity_pct = max(-100, min(100, velocity_pct))",
    "    if velocity_pct == 0:",
    "        motor.stop(stop_mode)",
    "    else:",
    "        motor.spin(FORWARD, velocity_pct, PERCENT)",
    "",
    "def autonomous():",
    "    # Add only autonomous steps you have tested on the real robot.",
    "    pass",
    "",
    "def driver_control():",
    "    left_output = 0",
    "    right_output = 0",
  );
  for (const mapping of profile.mappings.filter((m) => m.behavior === "toggle")) {
    const key = ident(mapping.id, "toggle");
    lines.push(`    toggle_${key} = False`, `    previous_${key} = False`);
  }
  lines.push("    while True:");
  if (profile.driveStyle === "tank") {
    lines.push(
      `        left_target = shape_axis(controller.${profile.leftAxis.toLowerCase()}.position())`,
      `        right_target = shape_axis(controller.${profile.rightAxis.toLowerCase()}.position())`,
    );
  } else {
    lines.push(
      `        forward = shape_axis(controller.${profile.forwardAxis.toLowerCase()}.position())`,
      `        turn = shape_axis(controller.${profile.turnAxis.toLowerCase()}.position())`,
      `        left_target = ${clampLinePython("forward + turn")}`,
      `        right_target = ${clampLinePython("forward - turn")}`,
    );
  }
  lines.push("        left_output = slew(left_output, left_target)", "        right_output = slew(right_output, right_target)");
  for (const m of sides.left) lines.push(`        run_motor(${ident(m.label, `motor_${m.port}`)}, left_output, DRIVE_STOP)`);
  for (const m of sides.right) lines.push(`        run_motor(${ident(m.label, `motor_${m.port}`)}, right_output, DRIVE_STOP)`);

  const groups = new Map(profile.groups.map((g) => [g.id, g]));
  for (const mapping of profile.mappings) {
    const group = groups.get(mapping.target);
    const targetMotors = group ? config.motors.filter((m) => group.motorIds.includes(m.id)) : config.motors.filter((m) => m.id === mapping.target);
    const pneumatic = config.pneumatics.find((p) => `p:${p.id}` === mapping.target);
    const controllerName = mapping.controller === "partner" ? "partner" : "controller";
    const pressed = `${controllerName}.button${mapping.button}.pressing()`;
    const signed = mapping.direction === "reverse" ? -mapping.speed : mapping.speed;
    if (mapping.behavior === "hold") {
      if (pneumatic) lines.push(`        ${ident(pneumatic.label, "pneumatic")}.set(${pressed})`);
      for (const m of targetMotors) lines.push(`        run_motor(${ident(m.label, `motor_${m.port}`)}, ${signed} if ${pressed} else 0, ${pythonStop(mapping.stopMode)})`);
    } else {
      const key = ident(mapping.id, "toggle");
      lines.push(`        current_${key} = ${pressed}`, `        if current_${key} and not previous_${key}:`, `            toggle_${key} = not toggle_${key}`);
      if (pneumatic) lines.push(`        ${ident(pneumatic.label, "pneumatic")}.set(toggle_${key})`);
      for (const m of targetMotors) lines.push(`        run_motor(${ident(m.label, `motor_${m.port}`)}, ${signed} if toggle_${key} else 0, ${pythonStop(mapping.stopMode)})`);
      lines.push(`        previous_${key} = current_${key}`);
    }
  }
  lines.push("        wait(20, MSEC)", "", "competition = Competition(driver_control, autonomous)");
  return lines.join("\n");
}

function buildCpp(robot: Robot, profile: RobotCodeProfile) {
  const config = robot.configuration!;
  const sides = driveSides(config);
  const usesPartner = profile.mappings.some((m) => m.controller === "partner");
  const lines: string[] = [
    "#include \"vex.h\"",
    "#include <algorithm>",
    "#include <cmath>",
    "using namespace vex;",
    "",
    "brain Brain;",
    "controller Controller(primary);",
  ];
  if (usesPartner) lines.push("controller Partner(partner);");
  lines.push("competition Competition;");
  for (const m of config.motors) lines.push(`motor ${ident(m.label, `motor_${m.port}`)}(PORT${m.port}, ${cppGear(m)}, ${m.reversed ? "true" : "false"});`);
  for (const p of config.pneumatics) lines.push(`digital_out ${ident(p.label, `pneumatic_${p.threeWirePort}`)}(Brain.ThreeWirePort.${p.threeWirePort.toUpperCase()});`);
  lines.push(
    "",
    `const double DEADBAND = ${profile.deadband};`,
    `const double SLEW_STEP = ${profile.slew};`,
    "double shapeAxis(double value) {",
    "  if (std::abs(value) < DEADBAND) return 0;",
  );
  if (profile.curve === "squared") lines.push("  return value * std::abs(value) / 100.0;");
  else if (profile.curve === "cubic") lines.push("  return value * value * value / 10000.0;");
  else lines.push("  return value;");
  lines.push(
    "}",
    "double slew(double current, double target) {",
    "  double delta = target - current;",
    "  if (std::abs(delta) <= SLEW_STEP) return target;",
    "  return current + (delta > 0 ? SLEW_STEP : -SLEW_STEP);",
    "}",
    "void runMotor(motor& m, double velocityPct, brakeType stopMode = coast) {",
    "  velocityPct = std::max(-100.0, std::min(100.0, velocityPct));",
    "  if (velocityPct == 0) m.stop(stopMode); else m.spin(fwd, velocityPct, percent);",
    "}",
    "",
    "void autonomous() {",
    "  // Add only autonomous steps you have tested on the real robot.",
    "}",
    "",
    "void usercontrol() {",
    "  double leftOutput = 0;",
    "  double rightOutput = 0;",
  );
  for (const mapping of profile.mappings.filter((m) => m.behavior === "toggle")) {
    const key = ident(mapping.id, "toggle");
    lines.push(`  bool toggle_${key} = false;`, `  bool previous_${key} = false;`);
  }
  lines.push("  while (true) {");
  if (profile.driveStyle === "tank") {
    lines.push(`    double leftTarget = shapeAxis(Controller.${profile.leftAxis}.position());`, `    double rightTarget = shapeAxis(Controller.${profile.rightAxis}.position());`);
  } else {
    lines.push(
      `    double forward = shapeAxis(Controller.${profile.forwardAxis}.position());`,
      `    double turn = shapeAxis(Controller.${profile.turnAxis}.position());`,
      `    double leftTarget = ${clampLineCpp("forward + turn")};`,
      `    double rightTarget = ${clampLineCpp("forward - turn")};`,
    );
  }
  lines.push("    leftOutput = slew(leftOutput, leftTarget);", "    rightOutput = slew(rightOutput, rightTarget);");
  for (const m of sides.left) lines.push(`    runMotor(${ident(m.label, `motor_${m.port}`)}, leftOutput, ${cppStop(profile.driveStopMode)});`);
  for (const m of sides.right) lines.push(`    runMotor(${ident(m.label, `motor_${m.port}`)}, rightOutput, ${cppStop(profile.driveStopMode)});`);

  const groups = new Map(profile.groups.map((g) => [g.id, g]));
  for (const mapping of profile.mappings) {
    const group = groups.get(mapping.target);
    const targetMotors = group ? config.motors.filter((m) => group.motorIds.includes(m.id)) : config.motors.filter((m) => m.id === mapping.target);
    const pneumatic = config.pneumatics.find((p) => `p:${p.id}` === mapping.target);
    const controllerName = mapping.controller === "partner" ? "Partner" : "Controller";
    const pressed = `${controllerName}.Button${mapping.button}.pressing()`;
    const signed = mapping.direction === "reverse" ? -mapping.speed : mapping.speed;
    if (mapping.behavior === "hold") {
      if (pneumatic) lines.push(`    ${ident(pneumatic.label, "pneumatic")}.set(${pressed});`);
      for (const m of targetMotors) lines.push(`    runMotor(${ident(m.label, `motor_${m.port}`)}, ${pressed} ? ${signed} : 0, ${cppStop(mapping.stopMode)});`);
    } else {
      const key = ident(mapping.id, "toggle");
      lines.push(`    bool current_${key} = ${pressed};`, `    if (current_${key} && !previous_${key}) toggle_${key} = !toggle_${key};`);
      if (pneumatic) lines.push(`    ${ident(pneumatic.label, "pneumatic")}.set(toggle_${key});`);
      for (const m of targetMotors) lines.push(`    runMotor(${ident(m.label, `motor_${m.port}`)}, toggle_${key} ? ${signed} : 0, ${cppStop(mapping.stopMode)});`);
      lines.push(`    previous_${key} = current_${key};`);
    }
  }
  lines.push("    wait(20, msec);", "  }", "}", "", "int main() {", "  Competition.autonomous(autonomous);", "  Competition.drivercontrol(usercontrol);", "  while (true) wait(100, msec);", "}");
  return lines.join("\n");
}

export function CodeLab({ teamId, activeRobotId, robots, initialState }: { teamId: string; activeRobotId: string | null; robots: Robot[]; initialState: Record<string, unknown> }) {
  const initialStored = (initialState && typeof initialState === "object" ? initialState : {}) as Stored;
  const [robotId, setRobotId] = useState(activeRobotId ?? robots[0]?.id ?? "");
  const [stored, setStored] = useState<Stored>(initialStored);
  const robot = robots.find((r) => r.id === robotId) ?? null;
  const rawProfile = stored[robotId] ?? emptyProfile();
  const profile: RobotCodeProfile = { ...emptyProfile(), ...rawProfile, driveStopMode: rawProfile.driveStopMode ?? "coast", mappings: (rawProfile.mappings ?? []).map((m) => ({ ...m, stopMode: m.stopMode ?? "coast", controller: m.controller ?? "primary" })) };
  const [language, setLanguage] = useState<"python" | "cpp">("python");
  const [code, setCode] = useState("");
  const [sync, setSync] = useState<SyncStatus>("saved");
  const config = robot?.configuration ?? null;

  useEffect(() => { void flushPendingTeamSection(teamId, "codeLab").then((status) => status && setSync(status)); }, [teamId]);
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
  const canGenerate = Boolean(robot && config && driveMotors.length >= 2 && controlsComplete && arcadeStickValid && mappingsComplete && !duplicateButtonKeys.length && !portConflict && totalWatts <= 88 && driveWatts <= 55);

  function addGroup() { change({ groups: [...profile.groups, { id: crypto.randomUUID(), name: "", motorIds: [] }] }); }
  function addMapping() { change({ mappings: [...profile.mappings, { id: crypto.randomUUID(), action: "", button: "", target: "", behavior: "hold", direction: "forward", speed: 100, stopMode: "coast", controller: "primary" }] }); }
  function generate() { if (!robot || !config || !canGenerate) return; setCode(language === "python" ? buildPython(robot, profile) : buildCpp(robot, profile)); }

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
        {!driveSidesKnown && driveMotors.length ? <div className="analysis-disclaimer"><TriangleAlert size={15}/> Name drive motors with “Left” and “Right” so generated drive grouping is unambiguous. Otherwise PitRelay splits the saved drive motors in port order.</div> : null}
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
        <div className="validation-row"><div className={!portConflict ? "validation-card pass" : "validation-card fail"}>{!portConflict ? <CheckCircle2 size={17}/> : <TriangleAlert size={17}/>}<span>Port map<strong>{!portConflict ? "Passed" : "Conflict"}</strong></span></div><div className={controlsComplete && arcadeStickValid ? "validation-card pass" : "validation-card fail"}><Braces size={17}/><span>Controls<strong>{controlsComplete && arcadeStickValid ? "Defined" : "Incomplete"}</strong></span></div><div className={totalWatts <= 88 && driveWatts <= 55 ? "validation-card pass" : "validation-card fail"}><ShieldCheck size={17}/><span>Motor limits<strong>{totalWatts <= 88 && driveWatts <= 55 ? "Preflight passed" : "Review required"}</strong></span></div><div className="validation-card pass"><CheckCircle2 size={17}/><span>Output clamp<strong>-100% to 100%</strong></span></div><div className="validation-card pass"><CheckCircle2 size={17}/><span>Competition template<strong>Included</strong></span></div></div>
        <div className="generation-actions"><button className="button button-primary" type="button" disabled={!canGenerate} onClick={generate}>Generate starter code</button><p>{canGenerate ? "Generated code uses only saved ports and the controls above." : "Complete the failed preflight checks before generation."}</p></div><pre className="generated-code"><code>{code || "// No code generated yet."}</code></pre><p className="form-helper">API-aware means PitRelay generates against the documented VEX Controller, Motor, Brain, Competition, wait, and timing APIs it knows. It does not claim a hardware-in-the-loop compile unless you actually build the project in VEXcode / the VEX VS Code extension.</p>
      </section>
    </> : null}
  </section>;
}
