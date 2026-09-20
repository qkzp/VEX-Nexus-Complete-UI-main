import assert from "node:assert/strict";
import test from "node:test";

type RobotEngine = typeof import("../src/lib/robot-engine");

// Node's native TypeScript runner needs the source extension, while the
// project's bundler-based TypeScript setup intentionally omits it. A URL keeps
// both tools happy without changing repository module configuration.
const robotEngine = (await import(
  new URL("../src/lib/robot-engine.ts", import.meta.url).href,
)) as RobotEngine;

const {
  calculateCompoundRatio,
  calculateDrivetrainSpeed,
  calculateGearRatio,
  detectPortConflicts,
  validateCodeConfiguration,
} = robotEngine;

test("calculates a single VEX gear reduction", () => {
  const ratio = calculateGearRatio({
    drivingTeeth: 36,
    drivenTeeth: 60,
  });

  assert.equal(ratio.speedMultiplier, 0.6);
  assert.equal(ratio.torqueMultiplier, 60 / 36);
  assert.equal(ratio.reductionRatio, 60 / 36);
  assert.equal(ratio.direction, "reversed");
});

test("calculates compound transmission ratio and direction", () => {
  const ratio = calculateCompoundRatio([
    { drivingTeeth: 12, drivenTeeth: 36 },
    { drivingTeeth: 48, drivenTeeth: 36 },
    { drivingTeeth: 6, drivenTeeth: 12, transmissionType: "sprocket" },
  ]);

  assert.equal(ratio.stages.length, 3);
  assert.equal(ratio.speedMultiplier, 2 / 9);
  assert.equal(ratio.torqueMultiplier, 9 / 2);
  assert.equal(ratio.direction, "same");
});

test("calculates theoretical drivetrain speed from the robot profile", () => {
  const speed = calculateDrivetrainSpeed({
    motorRpm: 600,
    wheelDiameterInches: 3.25,
    gearStages: [{ drivingTeeth: 36, drivenTeeth: 60 }],
  });

  assert.equal(speed.wheelRpm, 360);
  assert.ok(Math.abs(speed.wheelCircumferenceInches - Math.PI * 3.25) < 1e-10);
  assert.ok(Math.abs(speed.theoreticalSpeedFeetPerSecond - 5.105088) < 0.00001);
  assert.equal(speed.estimatedSpeedFeetPerSecond, speed.theoreticalSpeedFeetPerSecond);
});

test("detects Smart and three-wire port conflicts after normalizing form values", () => {
  const conflicts = detectPortConflicts([
    { kind: "smart", port: 1, deviceName: "Left Drive" },
    { kind: "smart", port: "1", deviceName: "Intake" },
    { kind: "three-wire", port: "a", deviceName: "Clamp" },
    { kind: "three-wire", port: "A", deviceName: "Wing" },
    { kind: "smart", port: 2, deviceName: "Right Drive" },
  ]);

  assert.equal(conflicts.length, 2);
  assert.deepEqual(
    conflicts.map((conflict) => [conflict.kind, conflict.port]),
    [
      ["smart", 1],
      ["three-wire", "A"],
    ],
  );
  assert.equal(conflicts[0].assignments.length, 2);
});

test("accepts a complete robot code configuration", () => {
  const validation = validateCodeConfiguration({
    language: "vexcode-python",
    programMode: "competition",
    motors: [
      {
        id: "left-front",
        name: "Left Front Drive",
        variableName: "left_front",
        port: 1,
        cartridgeRpm: 600,
      },
      {
        id: "left-rear",
        name: "Left Rear Drive",
        variableName: "left_rear",
        port: 2,
        cartridgeRpm: 600,
      },
      {
        id: "right-front",
        name: "Right Front Drive",
        variableName: "right_front",
        port: 3,
        cartridgeRpm: 600,
        reversed: true,
      },
      {
        id: "right-rear",
        name: "Right Rear Drive",
        variableName: "right_rear",
        port: 4,
        cartridgeRpm: 600,
        reversed: true,
      },
    ],
    drivetrain: {
      type: "tank",
      motorIds: ["left-front", "left-rear", "right-front", "right-rear"],
      wheelDiameterInches: 3.25,
      gearStages: [{ drivingTeeth: 36, drivenTeeth: 60 }],
    },
    sensors: [
      {
        id: "inertial",
        name: "Inertial Sensor",
        sensorType: "inertial",
        variableName: "inertial_sensor",
        port: 5,
      },
    ],
    pneumatics: [
      {
        id: "clamp",
        name: "Clamp",
        variableName: "clamp",
        port: "A",
      },
    ],
    controllerMappings: [
      { control: "Axis3", action: "drive-left" },
      { control: "Axis2", action: "drive-right" },
    ],
    requiredControllerActions: ["drive-left", "drive-right"],
  });

  assert.equal(validation.isValid, true);
  assert.equal(validation.canGenerateCode, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});

test("reports the blocking code-generation configuration problems together", () => {
  const validation = validateCodeConfiguration({
    language: "vexcode-python",
    programMode: "driver-control",
    motors: [
      {
        id: "left-drive",
        name: "Left Drive",
        variableName: "drive",
        port: 1,
        cartridgeRpm: 600,
      },
      {
        id: "right-drive",
        name: "Right Drive",
        variableName: "drive",
        port: 1,
        cartridgeRpm: 600,
      },
    ],
    drivetrain: {
      type: "tank",
      motorIds: ["left-drive", "right-drive"],
      // Omitted on purpose: this should be an explicit unknown-gear warning.
    },
    sensors: [
      {
        id: "mystery",
        name: "Mystery Sensor",
        sensorType: "made-up-sensor",
        variableName: "mystery_sensor",
        port: 1,
      },
    ],
    pneumatics: [
      {
        id: "clamp",
        name: "Clamp",
        variableName: "clamp",
        port: "A",
      },
      {
        id: "wing",
        name: "Wing",
        variableName: "wing",
        port: "A",
      },
    ],
    controllerMappings: [],
    requiredControllerActions: ["intake"],
  });

  assert.equal(validation.isValid, false);
  assert.equal(validation.canGenerateCode, false);

  const errorCodes = new Set(validation.errors.map((issue) => issue.code));
  assert.ok(errorCodes.has("DUPLICATE_DEVICE_VARIABLE_NAME"));
  assert.ok(errorCodes.has("UNSUPPORTED_SENSOR"));
  assert.ok(errorCodes.has("DUPLICATE_PORT_ASSIGNMENT"));
  assert.ok(errorCodes.has("CONFLICTING_PNEUMATIC_ASSIGNMENT"));
  assert.ok(errorCodes.has("MISSING_CONTROLLER_MAPPING"));
  assert.ok(validation.warnings.some((issue) => issue.code === "UNKNOWN_GEAR_RATIO"));
});
