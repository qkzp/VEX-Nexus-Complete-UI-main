import assert from "node:assert/strict";
import test from "node:test";
import { buildMotionSteps, toFieldCoordinates, validateRoute } from "../src/lib/autonomous.ts";
import { buildAutonomousProgram, buildPython, buildCpp, emptyProfile, validateAutonomous, validateGenerator } from "../src/lib/vex-codegen.ts";
import { robot, route } from "./fixtures/robot.ts";

const profile = { ...emptyProfile(), driveStyle: "tank" as const, leftAxis: "Axis3", rightAxis: "Axis2" };

test("field edges map exactly to 144 inches and turns use clockwise screen coordinates", () => {
  assert.deepEqual(toFieldCoordinates({ x: 95, y: 95 }), { x: 144, y: 144 });
  const steps = buildMotionSteps(0, [{ x: 0, y: 0 }, { x: 95, y: 0 }, { x: 95, y: 95 }]);
  assert.deepEqual(steps.map(s => [s.index, s.driveInches, s.turnDegrees]), [[1, 144, 0], [2, 144, 90]]);
});

test("duplicate points do not reset heading and wraparound uses the short turn", () => {
  const steps = buildMotionSteps(170, [{ x: 50, y: 50 }, { x: 50, y: 50 }, { x: 0, y: 49 }]);
  assert.equal(steps.length, 1);
  assert.ok(steps[0].turnDegrees > 10 && steps[0].turnDegrees < 12);
});

test("invalid routes cannot reach code generation", () => {
  assert.ok(validateRoute({ ...route, startPoint: null }).length);
  assert.ok(validateRoute({ ...route, speed: NaN }).length);
  assert.ok(validateRoute({ ...route, routePoints: [{ x: 96, y: 0 }] }).length);
  assert.throws(() => buildAutonomousProgram(robot, { ...route, timeLimit: 0 }, "python"));
});

test("preflight catches ambiguous sides, missing gearing, and sensor port collisions", () => {
  const changed = structuredClone(robot);
  changed.configuration!.motors[0].label = "Drive motor";
  changed.configuration!.customProperties = {};
  changed.configuration!.sensors.push({ id: "imu", label: "Inertial", type: "INERTIAL", smartPort: 2, threeWirePort: null });
  const errors = validateAutonomous(changed, route).join(" ");
  assert.match(errors, /Left or Right/);
  assert.match(errors, /transmission/);
  assert.match(errors, /Smart Ports/);
});

test("exports real simultaneous motor moves, reversed ports and bounded competition callbacks", () => {
  assert.deepEqual(validateAutonomous(robot, route), []);
  const py = buildAutonomousProgram(robot, route, "python");
  const cpp = buildAutonomousProgram(robot, route, "cpp");
  assert.match(py, /Ports.PORT2, GearSetting.RATIO_6_1, True/);
  assert.match(py, /spin_for\(.*wait=False/);
  assert.match(py, /Competition\(driver_control, autonomous\)/);
  assert.match(py, /deadline = brain.timer.time\(MSEC\) \+ 15000/);
  assert.match(py, /if not auton_move\(553\.8462, -553\.8462, deadline\)/);
  assert.match(cpp, /Competition.autonomous\(autonomous\)/);
  assert.match(cpp, /spinFor\(.*velocityUnits::pct, false/);
  assert.doesNotMatch(py + cpp, /Replace with your drivetrain/);
});

test("device identifiers match their declarations, including reverse pneumatics", () => {
  const controls = { ...profile, mappings: [{ id: "toggle1", action: "Retract clamp", button: "A", target: "p:clamp", behavior: "toggle" as const, direction: "reverse" as const, speed: 100, stopMode: "coast" as const, controller: "primary" as const }] };
  const py = buildPython(robot, controls, route), cpp = buildCpp(robot, controls, route);
  assert.match(py, /device_clamp_pneumatic_A = DigitalOut/);
  assert.match(py, /device_clamp_pneumatic_A.set\(not toggle_/);
  assert.match(cpp, /device_clamp_pneumatic_A.set\(!toggle_/);
  assert.match(py, /device_123_intake_motor_3 = Motor/);
});

test("removed group targets and overlapping motor mappings cannot silently generate broken controls", () => {
  const mapping = { id: "a", action: "Intake", button: "R1", target: "intake", behavior: "hold" as const, direction: "forward" as const, speed: 100, stopMode: "coast" as const, controller: "primary" as const };
  assert.match(validateGenerator(robot, { ...profile, mappings: [{ ...mapping, target: "deleted" }] }).join(" "), /removed device/);
  assert.match(validateGenerator(robot, { ...profile, mappings: [mapping, { ...mapping, id: "b", button: "R2" }] }).join(" "), /overlapping/);
});

test("opposing intake buttons produce one combined motor command", () => {
  const common = { action: "Intake", target: "intake", behavior: "hold" as const, speed: 100, stopMode: "brake" as const, controller: "primary" as const };
  const controls = { ...profile, mappings: [
    { ...common, id: "in", button: "R1", direction: "forward" as const },
    { ...common, id: "out", button: "R2", direction: "reverse" as const },
  ] };
  assert.deepEqual(validateGenerator(robot, controls), []);
  const code = buildPython(robot, controls);
  const lines = code.split("\n").filter(line => line.includes("run_motor(device_123_intake"));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /100 if controller.buttonR1.pressing\(\).*\+.*-100 if controller.buttonR2.pressing/);
});

test("mechanism actions run after their selected segment and share the timeout", () => {
  const planned = { ...route, actions: [
    { id: "clamp", afterStep: 0, kind: "pneumatic" as const, targetId: "clamp", value: 1, durationMs: 200 },
    { id: "score", afterStep: 1, kind: "motor" as const, targetId: "intake", value: -80, durationMs: 750 },
  ] };
  const py = buildAutonomousProgram(robot, planned, "python");
  assert.ok(py.indexOf("device_clamp_pneumatic_A.set(True)") < py.indexOf("# Step 1: drive"));
  assert.ok(py.indexOf("device_123_intake_motor_3.spin(FORWARD, -80") > py.indexOf("# Step 1: drive"));
  assert.match(py, /if not auton_wait\(750, deadline\)/);
  const cpp = buildAutonomousProgram(robot, planned, "cpp");
  assert.match(cpp, /device_123_intake_motor_3.spin\(fwd, -80, percent\)/);
  assert.match(cpp, /if \(!autonWait\(750, deadline\)\) return;/);
  assert.throws(() => buildAutonomousProgram(robot, { ...planned, actions: [{ ...planned.actions[1], targetId: "left" }] }, "python"), /non-drive motor/);
  assert.throws(() => buildAutonomousProgram(robot, { ...planned, actions: [{ ...planned.actions[1], afterStep: 99 }] }, "cpp"), /existing motion step/);
});
