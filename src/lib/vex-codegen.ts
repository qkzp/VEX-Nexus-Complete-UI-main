import { buildMotionSteps, validateRoute, type AutonomousRoute, type AutonomousAction } from "./autonomous.ts";

export type Motor = { id: string; label: string; port: number; cartridge: string; customRpm: number | null; reversed: boolean; purpose: string; mechanismId: string | null };
export type Pneumatic = { id: string; label: string; threeWirePort: string };
export type Robot = {
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

export type DriveStyle = "" | "tank" | "arcade-left" | "arcade-right" | "split-arcade";
export type Group = { id: string; name: string; motorIds: string[] };
export type Mapping = {
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
export type RobotCodeProfile = {
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
export type Stored = Record<string, RobotCodeProfile>;

export const emptyProfile = (): RobotCodeProfile => ({
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

export function ident(value: string, fallback: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `device_${clean || "unnamed"}_${fallback}`;
}
function motorRpm(motor: Motor) {
  if (motor.cartridge === "RPM_100") return 100;
  if (motor.cartridge === "RPM_200") return 200;
  if (motor.cartridge === "RPM_600") return 600;
  return motor.customRpm ?? 200;
}
export function motorWatts(motor: Motor) { return motor.cartridge === "CUSTOM" && motor.customRpm === 200 ? 5.5 : 11; }
function pythonGear(motor: Motor) { const rpm = motorRpm(motor); return rpm === 100 ? "GearSetting.RATIO_36_1" : rpm === 600 ? "GearSetting.RATIO_6_1" : "GearSetting.RATIO_18_1"; }
function cppGear(motor: Motor) { const rpm = motorRpm(motor); return rpm === 100 ? "ratio36_1" : rpm === 600 ? "ratio6_1" : "ratio18_1"; }
function clampLinePython(value: string) { return `max(-100, min(100, ${value}))`; }
function clampLineCpp(value: string) { return `std::max(-100.0, std::min(100.0, ${value}))`; }

export function axisStick(axis: string) {
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

export function driveSides(config: NonNullable<Robot["configuration"]>) {
  const drive = config.motors.filter((m) => m.purpose === "DRIVE");
  const left = drive.filter((m) => /left/i.test(m.label));
  const right = drive.filter((m) => /right/i.test(m.label));
  return {
    left,
    right,
  };
}

export function validateGenerator(robot: Robot, profile?: RobotCodeProfile): string[] {
  const config = robot.configuration;
  if (!config) return ["Save a hardware configuration for this robot first."];
  const issues: string[] = [];
  const sides = driveSides(config);
  const drive = config.motors.filter(m => m.purpose === "DRIVE");
  if (!sides.left.length || !sides.right.length || drive.some(m => /left/i.test(m.label) === /right/i.test(m.label))) issues.push("Name every drive motor with exactly one side: Left or Right.");
  if (!["TANK", "ARCADE"].includes(config.drivetrainType ?? "")) issues.push("Generation supports tank and arcade drivetrains. Select one in the robot profile.");
  const smart = [...config.motors.map(m => m.port), ...config.sensors.flatMap(s => s.smartPort === null ? [] : [s.smartPort])];
  if (smart.some(p => !Number.isInteger(p) || p < 1 || p > 21) || new Set(smart).size !== smart.length) issues.push("Resolve invalid or duplicate Smart Ports, including sensors.");
  const adi = [...config.pneumatics.map(p => p.threeWirePort.toUpperCase()), ...config.sensors.flatMap(s => s.threeWirePort ? [s.threeWirePort.toUpperCase()] : [])];
  if (adi.some(p => !/^[A-H]$/.test(p)) || new Set(adi).size !== adi.length) issues.push("Resolve invalid or duplicate three-wire ports.");
  if (config.motors.some(m => !["RPM_100", "RPM_200", "RPM_600"].includes(m.cartridge))) issues.push("This generator supports 11W V5 motors with 100, 200, or 600 RPM cartridges. Custom motors need a separate configuration.");
  if (new Set(drive.map(m => m.cartridge)).size > 1) issues.push("Use matching cartridges on all drive motors.");
  if (config.motors.reduce((n, m) => n + motorWatts(m), 0) > 88) issues.push("Total motor power exceeds the configured 88W limit.");
  if (drive.reduce((n, m) => n + motorWatts(m), 0) > 55) issues.push("Drive motor power exceeds the configured 55W V5RC limit. Review the robot profile.");
  if (profile) {
    const axes = profile.driveStyle === "tank" ? [profile.leftAxis, profile.rightAxis] : [profile.forwardAxis, profile.turnAxis];
    if (!profile.driveStyle || axes.some(a => !["Axis1", "Axis2", "Axis3", "Axis4"].includes(a)) || axes[0] === axes[1]) issues.push("Select two different controller axes.");
    if (![profile.deadband, profile.slew].every(Number.isFinite) || profile.deadband < 0 || profile.deadband > 25 || profile.slew < 1 || profile.slew > 100) issues.push("Check deadband and slew values.");
    const used = new Map<string, Mapping>();
    const buttons = new Set<string>();
    for (const m of profile.mappings) {
      const group = profile.groups.find(g => g.id === m.target);
      const targets = group ? group.motorIds : [m.target];
      const button = `${m.controller}:${m.button}`;
      if (buttons.has(button)) issues.push("Assign each controller button only once.");
      buttons.add(button);
      if (!m.action.trim() || !["A", "B", "X", "Y", "Up", "Down", "Left", "Right", "L1", "L2", "R1", "R2"].includes(m.button) || !Number.isFinite(m.speed) || m.speed < 1 || m.speed > 100) issues.push("Complete each action's name, button, and speed.");
      if (!targets.length || targets.some(id => !config.motors.some(motor => motor.id === id && motor.purpose !== "DRIVE") && !config.pneumatics.some(p => `p:${p.id}` === id))) issues.push("An action targets an empty group or a removed device. Choose an available mechanism.");
      for (const target of targets) {
        const previous = used.get(target);
        if (previous && (target.startsWith("p:") || previous.behavior !== "hold" || m.behavior !== "hold" || previous.direction === m.direction || previous.stopMode !== m.stopMode)) issues.push("A mechanism has overlapping actions. Use opposite hold buttons with matching stop modes, or one toggle action.");
        used.set(target, m);
      }
    }
  }
  return [...new Set(issues)];
}

export function transmissionRatio(robot: Robot): number | null {
  const custom = robot.configuration?.customProperties as { transmission?: { speedMultiplier?: number } } | null;
  const multiplier = custom?.transmission?.speedMultiplier;
  return typeof multiplier === "number" && Number.isFinite(multiplier) && multiplier > 0 ? 1 / multiplier : null;
}

export function validateAutonomous(robot: Robot, route: AutonomousRoute): string[] {
  const issues = [...validateGenerator(robot), ...validateRoute(route)];
  const config = robot.configuration;
  if (!config?.wheelDiameterIn || !Number.isFinite(config.wheelDiameterIn) || config.wheelDiameterIn <= 0) issues.push("Record wheel diameter in the robot profile.");
  if (!config?.trackWidthIn || !Number.isFinite(config.trackWidthIn) || config.trackWidthIn <= 0) issues.push("Record track width in the robot profile.");
  if (!transmissionRatio(robot)) issues.push("Save the robot's transmission, including Direct drive when appropriate.");
  for (const action of Array.isArray(route.actions) ? route.actions : []) {
    if (!action) continue;
    if (action.kind === "motor" && !config?.motors.some(m => m.id === action.targetId && m.purpose !== "DRIVE")) issues.push("Select a saved non-drive motor for every motor action.");
    if (action.kind === "pneumatic" && !config?.pneumatics.some(p => p.id === action.targetId)) issues.push("Select a saved pneumatic for every pneumatic action.");
  }
  return issues;
}

function assertGeneration(robot: Robot, profile: RobotCodeProfile, route?: AutonomousRoute) {
  const errors = [...validateGenerator(robot, profile), ...(route ? validateAutonomous(robot, route) : [])];
  if (errors.length) throw new Error([...new Set(errors)].join(" "));
}

function motorMoves(robot: Robot, route: AutonomousRoute) {
  const config = robot.configuration!;
  const degreesPerInch = 360 * transmissionRatio(robot)! / (Math.PI * config.wheelDiameterIn!);
  const steps = buildMotionSteps(route.startHeading, [route.startPoint!, ...route.routePoints]);
  return steps.flatMap(step => {
    const turn = step.turnDegrees * Math.PI / 180 * config.trackWidthIn! / 2 * degreesPerInch;
    const drive = step.driveInches * degreesPerInch;
    return [...(Math.abs(turn) > 0.01 ? [{ left: turn, right: -turn, afterStep: -1, label: `Step ${step.index}: turn ${step.turnDegrees} degrees` }] : []), { left: drive, right: drive, afterStep: step.index, label: `Step ${step.index}: drive ${step.driveInches} inches` }];
  });
}

function actionLines(robot: Robot, actions: AutonomousAction[], python: boolean): string[] {
  return actions.flatMap(action => {
    const motor = robot.configuration!.motors.find(m => m.id === action.targetId);
    const pneumatic = robot.configuration!.pneumatics.find(p => p.id === action.targetId);
    const motorName = motor ? ident(motor.label, `motor_${motor.port}`) : "";
    const pneumaticName = pneumatic ? ident(pneumatic.label, `pneumatic_${pneumatic.threeWirePort}`) : "";
    if (python) return [
      "    if brain.timer.time(MSEC) >= deadline:", "        auton_stop()", "        return",
      ...(action.kind === "motor" ? [`    ${motorName}.spin(FORWARD, ${action.value}, PERCENT)`] : []),
      ...(action.kind === "pneumatic" ? [`    ${pneumaticName}.set(${action.value ? "True" : "False"})`] : []),
      `    if not auton_wait(${action.durationMs}, deadline):`, "        return",
      ...(action.kind === "motor" ? [`    ${motorName}.stop(BRAKE)`] : []),
    ];
    return [
      "  if (Brain.Timer.time(msec) >= deadline) { autonStop(); return; }",
      ...(action.kind === "motor" ? [`  ${motorName}.spin(fwd, ${action.value}, percent);`] : []),
      ...(action.kind === "pneumatic" ? [`  ${pneumaticName}.set(${action.value ? "true" : "false"});`] : []),
      `  if (!autonWait(${action.durationMs}, deadline)) return;`,
      ...(action.kind === "motor" ? [`  ${motorName}.stop(brake);`] : []),
    ];
  });
}

function autonomousPython(robot: Robot, route: AutonomousRoute): string[] {
  const sides = driveSides(robot.configuration!);
  const names = (motors: Motor[]) => motors.map(m => ident(m.label, `motor_${m.port}`)).join(", ");
  return [
    `auton_left = MotorGroup(${names(sides.left)})`, `auton_right = MotorGroup(${names(sides.right)})`,
    "", "def auton_stop():", "    auton_left.stop(BRAKE)", "    auton_right.stop(BRAKE)",
    ...robot.configuration!.motors.filter(m => m.purpose !== "DRIVE").map(m => `    ${ident(m.label, `motor_${m.port}`)}.stop(BRAKE)`),
    "", "def auton_wait(duration_ms, deadline):", "    end = brain.timer.time(MSEC) + duration_ms",
    "    while brain.timer.time(MSEC) < end:", "        if brain.timer.time(MSEC) >= deadline:", "            auton_stop()", "            return False", "        wait(10, MSEC)", "    return True",
    "", "def auton_move(left_deg, right_deg, deadline):",
    "    if brain.timer.time(MSEC) >= deadline:", "        auton_stop()", "        return False",
    `    auton_left.spin_for(FORWARD if left_deg >= 0 else REVERSE, abs(left_deg), DEGREES, ${route.speed ?? 35}, PERCENT, wait=False)`,
    `    auton_right.spin_for(FORWARD if right_deg >= 0 else REVERSE, abs(right_deg), DEGREES, ${route.speed ?? 35}, PERCENT, wait=False)`,
    "    while not auton_left.is_done() or not auton_right.is_done():",
    "        if brain.timer.time(MSEC) >= deadline:", "            auton_stop()", "            brain.screen.print('Autonomous timed out')", "            return False",
    "        wait(10, MSEC)", "    auton_stop()", "    return True", "",
    "def autonomous():", `    # Routine: ${route.name.replace(/[\r\n]/g, " ")}`,
    "    # Encoder-based motion. Tune on the field; no obstacle detection or inertial correction.",
    `    deadline = brain.timer.time(MSEC) + ${(route.timeLimit ?? 15) * 1000}`,
    ...actionLines(robot, (route.actions ?? []).filter(a => a.afterStep === 0), true),
    ...motorMoves(robot, route).flatMap(move => [`    # ${move.label}`, `    if not auton_move(${move.left.toFixed(4)}, ${move.right.toFixed(4)}, deadline):`, "        return", ...actionLines(robot, (route.actions ?? []).filter(a => a.afterStep === move.afterStep), true)]),
    "    auton_stop()",
  ];
}

function autonomousCpp(robot: Robot, route: AutonomousRoute): string[] {
  const sides = driveSides(robot.configuration!);
  const names = (motors: Motor[]) => motors.map(m => ident(m.label, `motor_${m.port}`)).join(", ");
  return [
    `motor_group auton_left(${names(sides.left)});`, `motor_group auton_right(${names(sides.right)});`,
    `void autonStop() { auton_left.stop(brake); auton_right.stop(brake); ${robot.configuration!.motors.filter(m => m.purpose !== "DRIVE").map(m => `${ident(m.label, `motor_${m.port}`)}.stop(brake);`).join(" ")} }`,
    "bool autonWait(double durationMs, double deadline) {",
    "  const double end = Brain.Timer.time(msec) + durationMs;",
    "  while (Brain.Timer.time(msec) < end) {",
    "    if (Brain.Timer.time(msec) >= deadline) { autonStop(); return false; }",
    "    wait(10, msec);", "  }", "  return true;", "}",
    "bool autonMove(double leftDeg, double rightDeg, double deadline) {",
    "  if (Brain.Timer.time(msec) >= deadline) { autonStop(); return false; }",
    `  auton_left.spinFor(leftDeg >= 0 ? fwd : reverse, std::abs(leftDeg), degrees, ${route.speed ?? 35}, velocityUnits::pct, false);`,
    `  auton_right.spinFor(rightDeg >= 0 ? fwd : reverse, std::abs(rightDeg), degrees, ${route.speed ?? 35}, velocityUnits::pct, false);`,
    "  while (!auton_left.isDone() || !auton_right.isDone()) {",
    "    if (Brain.Timer.time(msec) >= deadline) { autonStop(); Brain.Screen.print(\"Autonomous timed out\"); return false; }",
    "    wait(10, msec);", "  }", "  autonStop();", "  return true;", "}",
    "void autonomous() {", `  // Routine: ${route.name.replace(/[\r\n\\]/g, " ")}`,
    "  // Encoder-based motion; tune on the field. No obstacle detection or inertial correction.",
    `  const double deadline = Brain.Timer.time(msec) + ${(route.timeLimit ?? 15) * 1000};`,
    ...actionLines(robot, (route.actions ?? []).filter(a => a.afterStep === 0), false),
    ...motorMoves(robot, route).flatMap(move => [`  // ${move.label}`, `  if (!autonMove(${move.left.toFixed(4)}, ${move.right.toFixed(4)}, deadline)) return;`, ...actionLines(robot, (route.actions ?? []).filter(a => a.afterStep === move.afterStep), false)]),
    "  autonStop();", "}",
  ];
}

export function buildAutonomousProgram(robot: Robot, route: AutonomousRoute, language: "python" | "cpp") {
  const profile = { ...emptyProfile(), driveStyle: "tank" as const, leftAxis: "Axis3", rightAxis: "Axis2" };
  return language === "python" ? buildPython(robot, profile, route) : buildCpp(robot, profile, route);
}

export function buildPython(robot: Robot, profile: RobotCodeProfile, route?: AutonomousRoute) {
  assertGeneration(robot, profile, route);
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
    ...(route ? autonomousPython(robot, route) : ["def autonomous():", "    pass"]),
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
      if (pneumatic) lines.push(`        ${ident(pneumatic.label, `pneumatic_${pneumatic.threeWirePort}`)}.set(${mapping.direction === "reverse" ? `not ${pressed}` : pressed})`);
      // Hold actions are combined per motor below; opposing buttons cancel to zero.
    } else {
      const key = ident(mapping.id, "toggle");
      lines.push(`        current_${key} = ${pressed}`, `        if current_${key} and not previous_${key}:`, `            toggle_${key} = not toggle_${key}`);
      if (pneumatic) lines.push(`        ${ident(pneumatic.label, `pneumatic_${pneumatic.threeWirePort}`)}.set(${mapping.direction === "reverse" ? `not toggle_${key}` : `toggle_${key}`})`);
      for (const m of targetMotors) lines.push(`        run_motor(${ident(m.label, `motor_${m.port}`)}, ${signed} if toggle_${key} else 0, ${pythonStop(mapping.stopMode)})`);
      lines.push(`        previous_${key} = current_${key}`);
    }
  }
  for (const motor of config.motors) {
    const holds = profile.mappings.filter(m => m.behavior === "hold" && (m.target === motor.id || groups.get(m.target)?.motorIds.includes(motor.id)));
    if (!holds.length) continue;
    const terms = holds.map(m => `(${m.direction === "reverse" ? -m.speed : m.speed} if ${m.controller === "partner" ? "partner" : "controller"}.button${m.button}.pressing() else 0)`);
    lines.push(`        run_motor(${ident(motor.label, `motor_${motor.port}`)}, ${terms.join(" + ")}, ${pythonStop(holds[0].stopMode)})`);
  }
  lines.push("        wait(20, MSEC)", "", "competition = Competition(driver_control, autonomous)", "", "while True:", "    wait(100, MSEC)");
  return lines.join("\n");
}

export function buildCpp(robot: Robot, profile: RobotCodeProfile, route?: AutonomousRoute) {
  assertGeneration(robot, profile, route);
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
    ...(route ? autonomousCpp(robot, route) : ["void autonomous() {}"]),
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
      if (pneumatic) lines.push(`    ${ident(pneumatic.label, `pneumatic_${pneumatic.threeWirePort}`)}.set(${mapping.direction === "reverse" ? `!${pressed}` : pressed});`);
      // Hold actions are combined per motor below; opposing buttons cancel to zero.
    } else {
      const key = ident(mapping.id, "toggle");
      lines.push(`    bool current_${key} = ${pressed};`, `    if (current_${key} && !previous_${key}) toggle_${key} = !toggle_${key};`);
      if (pneumatic) lines.push(`    ${ident(pneumatic.label, `pneumatic_${pneumatic.threeWirePort}`)}.set(${mapping.direction === "reverse" ? `!toggle_${key}` : `toggle_${key}`});`);
      for (const m of targetMotors) lines.push(`    runMotor(${ident(m.label, `motor_${m.port}`)}, toggle_${key} ? ${signed} : 0, ${cppStop(mapping.stopMode)});`);
      lines.push(`    previous_${key} = current_${key};`);
    }
  }
  for (const motor of config.motors) {
    const holds = profile.mappings.filter(m => m.behavior === "hold" && (m.target === motor.id || groups.get(m.target)?.motorIds.includes(motor.id)));
    if (!holds.length) continue;
    const terms = holds.map(m => `(${m.controller === "partner" ? "Partner" : "Controller"}.Button${m.button}.pressing() ? ${m.direction === "reverse" ? -m.speed : m.speed} : 0)`);
    lines.push(`    runMotor(${ident(motor.label, `motor_${motor.port}`)}, ${terms.join(" + ")}, ${cppStop(holds[0].stopMode)});`);
  }
  lines.push("    wait(20, msec);", "  }", "}", "", "int main() {", "  Competition.autonomous(autonomous);", "  Competition.drivercontrol(usercontrol);", "  while (true) wait(100, msec);", "}");
  return lines.join("\n");
}
