/**
 * Pure VEX V5 robot calculations and code-generation validation.
 *
 * This module deliberately has no framework, storage, or UI dependencies so it
 * can be shared by profile editors, calculators, API routes, and generators.
 */

export const VEX_SMART_PORT_MIN = 1;
export const VEX_SMART_PORT_MAX = 21;

export const VEX_THREE_WIRE_PORTS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
] as const;

export const VEX_V5_CARTRIDGE_RPM = {
  red: 100,
  green: 200,
  blue: 600,
} as const;

export const SUPPORTED_CODE_LANGUAGES = [
  "vexcode-python",
  "vexcode-cpp",
  "pros-cpp",
] as const;

export const SUPPORTED_DRIVETRAIN_TYPES = [
  "tank",
  "arcade",
  "holonomic",
  "x-drive",
  "mecanum",
  "custom",
] as const;

export const VEX_SMART_SENSOR_TYPES = [
  "inertial",
  "rotation",
  "optical",
  "distance",
  "vision",
  "gps",
  "ai-vision",
  "electromagnet",
] as const;

export const VEX_THREE_WIRE_SENSOR_TYPES = [
  "bumper",
  "limit-switch",
  "line-tracker",
  "potentiometer",
  "sonar",
  "digital-in",
  "digital-out",
] as const;

export type ThreeWirePort = (typeof VEX_THREE_WIRE_PORTS)[number];
export type MotorCartridgeColor = keyof typeof VEX_V5_CARTRIDGE_RPM;
export type MotorCartridgeRpm =
  (typeof VEX_V5_CARTRIDGE_RPM)[MotorCartridgeColor];
export type CodeLanguage = (typeof SUPPORTED_CODE_LANGUAGES)[number];
export type DrivetrainType = (typeof SUPPORTED_DRIVETRAIN_TYPES)[number];
export type SupportedSmartSensorType = (typeof VEX_SMART_SENSOR_TYPES)[number];
export type SupportedThreeWireSensorType =
  (typeof VEX_THREE_WIRE_SENSOR_TYPES)[number];
export type PortKind = "smart" | "three-wire";
export type TransmissionType = "gear" | "sprocket" | "belt";
export type RotationDirection = "same" | "reversed";
export type ProgramMode = "autonomous" | "driver-control" | "competition";

export interface GearStage {
  /** Number of teeth on the input / driving gear or sprocket. */
  drivingTeeth: number;
  /** Number of teeth on the output / driven gear or sprocket. */
  drivenTeeth: number;
  /** Gears reverse rotation; normal sprocket and belt stages do not. */
  transmissionType?: TransmissionType;
  /** Optional UI label, retained in the calculation result. */
  label?: string;
}

export interface GearRatioResult {
  drivingTeeth: number;
  drivenTeeth: number;
  transmissionType: TransmissionType;
  label?: string;
  /** Output RPM divided by input RPM. A 36T:60T stage is 0.6. */
  speedMultiplier: number;
  /** Ideal output torque divided by input torque. */
  torqueMultiplier: number;
  /** Driven teeth divided by driving teeth. A reduction is greater than one. */
  reductionRatio: number;
  direction: RotationDirection;
}

export interface CompoundGearRatioResult {
  stages: readonly GearRatioResult[];
  speedMultiplier: number;
  torqueMultiplier: number;
  reductionRatio: number;
  direction: RotationDirection;
}

export interface DrivetrainSpeedInput {
  motorRpm: number;
  wheelDiameterInches: number;
  /** Omit only when the drivetrain is direct-drive (1:1). */
  gearStages?: readonly GearStage[];
  /**
   * Optional estimated mechanical efficiency from 0 (exclusive) through 1.
   * It affects the estimated speed only; theoretical speed always remains ideal.
   */
  estimatedEfficiency?: number;
}

export interface DrivetrainSpeedResult {
  motorRpm: number;
  wheelRpm: number;
  wheelDiameterInches: number;
  wheelCircumferenceInches: number;
  gearRatio: CompoundGearRatioResult;
  theoreticalSpeedInchesPerSecond: number;
  theoreticalSpeedFeetPerSecond: number;
  theoreticalSpeedMetersPerSecond: number;
  estimatedEfficiency: number;
  estimatedSpeedInchesPerSecond: number;
  estimatedSpeedFeetPerSecond: number;
  estimatedSpeedMetersPerSecond: number;
}

export interface PortAssignment {
  kind: PortKind;
  /** Smart ports accept 1-21; three-wire ports accept A-H. String input is normalized. */
  port: number | string;
  deviceName: string;
  deviceType?: string;
  deviceId?: string;
}

export interface PortConflict {
  kind: PortKind;
  port: number | string;
  assignments: readonly PortAssignment[];
}

export interface InvalidPortAssignment {
  assignment: PortAssignment;
  reason: "invalid-smart-port" | "invalid-three-wire-port";
}

export interface MotorConfiguration {
  id: string;
  name: string;
  port?: number;
  cartridgeRpm?: number;
  reversed?: boolean;
  variableName?: string;
  purpose?: string;
}

export interface SensorConfiguration {
  id: string;
  name: string;
  sensorType: string;
  port?: number | string;
  /** If omitted, standard three-wire sensor types infer a three-wire port. */
  portKind?: PortKind;
  variableName?: string;
  purpose?: string;
}

export interface PneumaticConfiguration {
  id: string;
  name: string;
  port?: string;
  variableName?: string;
  purpose?: string;
}

export interface ControllerMapping {
  id?: string;
  control: string;
  action: string;
  behavior?: "hold" | "toggle" | "press" | "timed" | "macro" | "conditional";
}

export interface DrivetrainCodeConfiguration {
  type: DrivetrainType;
  motorIds: readonly string[];
  wheelDiameterInches?: number;
  /** [] explicitly means direct-drive. undefined means the ratio is unknown. */
  gearStages?: readonly GearStage[];
}

export interface RobotCodeConfiguration {
  language?: CodeLanguage;
  programMode?: ProgramMode;
  motors: readonly MotorConfiguration[];
  drivetrain?: DrivetrainCodeConfiguration;
  sensors?: readonly SensorConfiguration[];
  pneumatics?: readonly PneumaticConfiguration[];
  controllerMappings?: readonly ControllerMapping[];
  /** Actions which must be bound before driver-control code can be generated. */
  requiredControllerActions?: readonly string[];
}

export const CODE_CONFIGURATION_ISSUE_CODES = [
  "MISSING_CONFIGURATION",
  "MISSING_CODE_LANGUAGE",
  "UNSUPPORTED_CODE_LANGUAGE",
  "INVALID_PROGRAM_MODE",
  "MISSING_MOTORS",
  "MISSING_MOTOR_PORT",
  "INVALID_SMART_PORT",
  "MISSING_MOTOR_CARTRIDGE",
  "UNSUPPORTED_MOTOR_CARTRIDGE",
  "MISSING_DEVICE_VARIABLE_NAME",
  "INVALID_DEVICE_VARIABLE_NAME",
  "DUPLICATE_DEVICE_VARIABLE_NAME",
  "DUPLICATE_DEVICE_ID",
  "UNSUPPORTED_SENSOR",
  "MISSING_SENSOR_PORT",
  "INVALID_THREE_WIRE_PORT",
  "SENSOR_PORT_KIND_MISMATCH",
  "MISSING_PNEUMATIC_PORT",
  "INVALID_DRIVETRAIN_TYPE",
  "MISSING_DRIVETRAIN_MOTORS",
  "UNKNOWN_DRIVETRAIN_MOTOR",
  "DUPLICATE_DRIVETRAIN_MOTOR",
  "INVALID_DRIVETRAIN_MOTOR_COUNT",
  "UNKNOWN_WHEEL_DIAMETER",
  "INVALID_WHEEL_DIAMETER",
  "UNKNOWN_GEAR_RATIO",
  "INVALID_GEAR_RATIO",
  "DUPLICATE_PORT_ASSIGNMENT",
  "CONFLICTING_PNEUMATIC_ASSIGNMENT",
  "MISSING_CONTROLLER_MAPPING",
  "INVALID_CONTROLLER_MAPPING",
  "CONTROLLER_CONTROL_CONFLICT",
] as const;

export type CodeConfigurationIssueCode =
  (typeof CODE_CONFIGURATION_ISSUE_CODES)[number];
export type ValidationSeverity = "error" | "warning";

export interface CodeConfigurationIssue {
  code: CodeConfigurationIssueCode;
  severity: ValidationSeverity;
  path: string;
  message: string;
  deviceIds?: readonly string[];
  port?: number | string;
}

export interface CodeConfigurationValidation {
  /** `valid` is retained as a concise alias for `isValid`. */
  valid: boolean;
  isValid: boolean;
  /** Warnings are intentionally non-blocking; only errors prevent generation. */
  canGenerateCode: boolean;
  errors: readonly CodeConfigurationIssue[];
  warnings: readonly CodeConfigurationIssue[];
  issues: readonly CodeConfigurationIssue[];
  portConflicts: readonly PortConflict[];
}

const CODE_LANGUAGE_SET = new Set<string>(SUPPORTED_CODE_LANGUAGES);
const DRIVETRAIN_TYPE_SET = new Set<string>(SUPPORTED_DRIVETRAIN_TYPES);
const SMART_SENSOR_TYPE_SET = new Set<string>(VEX_SMART_SENSOR_TYPES);
const THREE_WIRE_SENSOR_TYPE_SET = new Set<string>(VEX_THREE_WIRE_SENSOR_TYPES);
const CARTRIDGE_RPM_SET = new Set<number>(Object.values(VEX_V5_CARTRIDGE_RPM));
const PROGRAM_MODE_SET = new Set<string>([
  "autonomous",
  "driver-control",
  "competition",
]);

const COMMON_RESERVED_IDENTIFIERS = new Set<string>([
  "and",
  "as",
  "auto",
  "await",
  "break",
  "case",
  "class",
  "const",
  "continue",
  "def",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "except",
  "export",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "let",
  "namespace",
  "new",
  "none",
  "not",
  "null",
  "or",
  "pass",
  "private",
  "protected",
  "public",
  "return",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "undefined",
  "using",
  "while",
  "with",
  "yield",
]);

function assertPositiveFinite(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${fieldName} must be a finite number greater than zero.`);
  }
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${fieldName} must be a positive integer.`);
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDeviceType(value: string): string {
  return value.trim().toLowerCase().replace(/[ _]+/g, "-");
}

function normalizeAction(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function normalizePort(kind: PortKind, port: number | string): number | string | undefined {
  if (kind === "smart") {
    if (typeof port === "number" && Number.isInteger(port)) {
      return port;
    }

    const textPort = normalizeText(port);
    if (/^\d+$/.test(textPort)) {
      return Number(textPort);
    }

    return undefined;
  }

  const normalized = normalizeText(port).toUpperCase();
  return normalized.length === 1 ? normalized : undefined;
}

function isValidNormalizedPort(kind: PortKind, port: number | string): boolean {
  return kind === "smart"
    ? typeof port === "number" && isValidSmartPort(port)
    : typeof port === "string" && isValidThreeWirePort(port);
}

function isPortAssignmentValid(assignment: PortAssignment): boolean {
  const normalizedPort = normalizePort(assignment.kind, assignment.port);
  return normalizedPort !== undefined && isValidNormalizedPort(assignment.kind, normalizedPort);
}

function assignmentKey(assignment: PortAssignment): string | undefined {
  const normalizedPort = normalizePort(assignment.kind, assignment.port);
  if (normalizedPort === undefined) {
    return undefined;
  }

  return `${assignment.kind}:${normalizedPort}`;
}

function cloneAssignment(assignment: PortAssignment): PortAssignment {
  return {
    kind: assignment.kind,
    port: assignment.port,
    deviceName: assignment.deviceName,
    deviceType: assignment.deviceType,
    deviceId: assignment.deviceId,
  };
}

function createIssue(
  code: CodeConfigurationIssueCode,
  severity: ValidationSeverity,
  path: string,
  message: string,
  extras: Pick<CodeConfigurationIssue, "deviceIds" | "port"> = {},
): CodeConfigurationIssue {
  return {
    code,
    severity,
    path,
    message,
    ...extras,
  };
}

function deviceDisplayName(name: string, fallback: string): string {
  const normalizedName = normalizeText(name);
  return normalizedName || fallback;
}

function inferSensorPortKind(sensorType: string): PortKind {
  return THREE_WIRE_SENSOR_TYPE_SET.has(normalizeDeviceType(sensorType))
    ? "three-wire"
    : "smart";
}

function minimumDrivetrainMotorCount(type: string): number {
  switch (type) {
    case "x-drive":
    case "mecanum":
      return 4;
    case "tank":
    case "arcade":
    case "holonomic":
      return 2;
    default:
      return 0;
  }
}

function isValidIdentifier(identifier: string): boolean {
  return (
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier) &&
    !COMMON_RESERVED_IDENTIFIERS.has(identifier.toLocaleLowerCase())
  );
}

/** Returns whether a value is a physical V5 Smart Port number (1 through 21). */
export function isValidSmartPort(port: unknown): port is number {
  return (
    typeof port === "number" &&
    Number.isInteger(port) &&
    port >= VEX_SMART_PORT_MIN &&
    port <= VEX_SMART_PORT_MAX
  );
}

/** Normalizes A-H input from forms, returning undefined for invalid values. */
export function normalizeThreeWirePort(port: unknown): ThreeWirePort | undefined {
  const normalized = normalizeText(port).toUpperCase();
  return VEX_THREE_WIRE_PORTS.includes(normalized as ThreeWirePort)
    ? (normalized as ThreeWirePort)
    : undefined;
}

/** Returns whether a value is an uppercase V5 three-wire port label (A through H). */
export function isValidThreeWirePort(port: unknown): port is ThreeWirePort {
  return typeof port === "string" && VEX_THREE_WIRE_PORTS.includes(port as ThreeWirePort);
}

/** Returns whether the RPM matches a VEX V5 motor cartridge. */
export function isSupportedMotorCartridgeRpm(rpm: unknown): rpm is MotorCartridgeRpm {
  return typeof rpm === "number" && CARTRIDGE_RPM_SET.has(rpm);
}

/** Calculates one external gear, sprocket, or belt stage. */
export function calculateGearRatio(stage: GearStage): GearRatioResult {
  if (!stage || typeof stage !== "object") {
    throw new TypeError("A gear stage is required.");
  }

  assertPositiveInteger(stage.drivingTeeth, "drivingTeeth");
  assertPositiveInteger(stage.drivenTeeth, "drivenTeeth");

  const transmissionType = stage.transmissionType ?? "gear";
  if (
    transmissionType !== "gear" &&
    transmissionType !== "sprocket" &&
    transmissionType !== "belt"
  ) {
    throw new RangeError("transmissionType must be gear, sprocket, or belt.");
  }

  const speedMultiplier = stage.drivingTeeth / stage.drivenTeeth;
  const torqueMultiplier = stage.drivenTeeth / stage.drivingTeeth;

  return {
    drivingTeeth: stage.drivingTeeth,
    drivenTeeth: stage.drivenTeeth,
    transmissionType,
    ...(stage.label ? { label: stage.label } : {}),
    speedMultiplier,
    torqueMultiplier,
    reductionRatio: torqueMultiplier,
    direction: transmissionType === "gear" ? "reversed" : "same",
  };
}

/**
 * Calculates a multi-stage transmission. An empty stage list is an explicit
 * direct-drive 1:1 transmission.
 */
export function calculateCompoundRatio(
  stages: readonly GearStage[],
): CompoundGearRatioResult {
  if (!Array.isArray(stages)) {
    throw new TypeError("gear stages must be an array.");
  }

  const calculatedStages = stages.map(calculateGearRatio);
  const speedMultiplier = calculatedStages.reduce(
    (product, stage) => product * stage.speedMultiplier,
    1,
  );
  const torqueMultiplier = calculatedStages.reduce(
    (product, stage) => product * stage.torqueMultiplier,
    1,
  );
  const reversalCount = calculatedStages.filter(
    (stage) => stage.direction === "reversed",
  ).length;

  return {
    stages: calculatedStages,
    speedMultiplier,
    torqueMultiplier,
    reductionRatio: 1 / speedMultiplier,
    direction: reversalCount % 2 === 0 ? "same" : "reversed",
  };
}

/** Applies a transmission's speed multiplier to an input RPM. */
export function calculateOutputRpm(
  inputRpm: number,
  stages: readonly GearStage[] = [],
): number {
  assertPositiveFinite(inputRpm, "inputRpm");
  return inputRpm * calculateCompoundRatio(stages).speedMultiplier;
}

/** Calculates ideal and optionally efficiency-adjusted drivetrain speed. */
export function calculateDrivetrainSpeed(
  input: DrivetrainSpeedInput,
): DrivetrainSpeedResult {
  if (!input || typeof input !== "object") {
    throw new TypeError("Drivetrain speed input is required.");
  }

  assertPositiveFinite(input.motorRpm, "motorRpm");
  assertPositiveFinite(input.wheelDiameterInches, "wheelDiameterInches");

  const estimatedEfficiency = input.estimatedEfficiency ?? 1;
  if (
    !Number.isFinite(estimatedEfficiency) ||
    estimatedEfficiency <= 0 ||
    estimatedEfficiency > 1
  ) {
    throw new RangeError("estimatedEfficiency must be greater than zero and no more than one.");
  }

  const gearRatio = calculateCompoundRatio(input.gearStages ?? []);
  const wheelRpm = input.motorRpm * gearRatio.speedMultiplier;
  const wheelCircumferenceInches = Math.PI * input.wheelDiameterInches;
  const theoreticalSpeedInchesPerSecond = (wheelRpm * wheelCircumferenceInches) / 60;
  const estimatedSpeedInchesPerSecond =
    theoreticalSpeedInchesPerSecond * estimatedEfficiency;

  return {
    motorRpm: input.motorRpm,
    wheelRpm,
    wheelDiameterInches: input.wheelDiameterInches,
    wheelCircumferenceInches,
    gearRatio,
    theoreticalSpeedInchesPerSecond,
    theoreticalSpeedFeetPerSecond: theoreticalSpeedInchesPerSecond / 12,
    theoreticalSpeedMetersPerSecond: theoreticalSpeedInchesPerSecond * 0.0254,
    estimatedEfficiency,
    estimatedSpeedInchesPerSecond,
    estimatedSpeedFeetPerSecond: estimatedSpeedInchesPerSecond / 12,
    estimatedSpeedMetersPerSecond: estimatedSpeedInchesPerSecond * 0.0254,
  };
}

/**
 * Finds duplicate physical port assignments. Numeric strings and lower-case
 * three-wire labels are normalized, so "1" conflicts with 1 and "a" with A.
 */
export function detectPortConflicts(
  assignments: readonly PortAssignment[],
): readonly PortConflict[] {
  if (!Array.isArray(assignments)) {
    throw new TypeError("port assignments must be an array.");
  }

  const assignmentsByPort = new Map<string, PortAssignment[]>();
  for (const assignment of assignments) {
    if (!assignment || (assignment.kind !== "smart" && assignment.kind !== "three-wire")) {
      continue;
    }

    const key = assignmentKey(assignment);
    if (!key) {
      continue;
    }

    const groupedAssignments = assignmentsByPort.get(key) ?? [];
    groupedAssignments.push(cloneAssignment(assignment));
    assignmentsByPort.set(key, groupedAssignments);
  }

  const conflicts: PortConflict[] = [];
  for (const [key, groupedAssignments] of assignmentsByPort) {
    if (groupedAssignments.length < 2) {
      continue;
    }

    const [kind, rawPort] = key.split(":", 2) as [PortKind, string];
    conflicts.push({
      kind,
      port: kind === "smart" ? Number(rawPort) : rawPort,
      assignments: groupedAssignments,
    });
  }

  return conflicts;
}

/** Lists assignments whose selected port cannot exist on a V5 Brain. */
export function findInvalidPortAssignments(
  assignments: readonly PortAssignment[],
): readonly InvalidPortAssignment[] {
  if (!Array.isArray(assignments)) {
    throw new TypeError("port assignments must be an array.");
  }

  return assignments.flatMap((assignment) => {
    if (!assignment || (assignment.kind !== "smart" && assignment.kind !== "three-wire")) {
      return [];
    }

    if (isPortAssignmentValid(assignment)) {
      return [];
    }

    return [
      {
        assignment: cloneAssignment(assignment),
        reason:
          assignment.kind === "smart" ? "invalid-smart-port" : "invalid-three-wire-port",
      },
    ];
  });
}

/** Converts a code configuration into the unified assignments used by port checks. */
export function getCodePortAssignments(
  configuration: Pick<
    RobotCodeConfiguration,
    "motors" | "sensors" | "pneumatics"
  >,
): readonly PortAssignment[] {
  const assignments: PortAssignment[] = [];
  const motors = Array.isArray(configuration?.motors) ? configuration.motors : [];
  const sensors = Array.isArray(configuration?.sensors) ? configuration.sensors : [];
  const pneumatics = Array.isArray(configuration?.pneumatics)
    ? configuration.pneumatics
    : [];

  motors.forEach((motor, index) => {
    if (motor?.port === undefined || motor.port === null) {
      return;
    }

    assignments.push({
      kind: "smart",
      port: motor.port,
      deviceId: motor.id,
      deviceName: deviceDisplayName(motor.name, `Motor ${index + 1}`),
      deviceType: "motor",
    });
  });

  sensors.forEach((sensor, index) => {
    if (sensor?.port === undefined || sensor.port === null || sensor.port === "") {
      return;
    }

    assignments.push({
      kind: sensor.portKind ?? inferSensorPortKind(sensor.sensorType ?? ""),
      port: sensor.port,
      deviceId: sensor.id,
      deviceName: deviceDisplayName(sensor.name, `Sensor ${index + 1}`),
      deviceType: "sensor",
    });
  });

  pneumatics.forEach((pneumatic, index) => {
    if (pneumatic?.port === undefined || pneumatic.port === null || pneumatic.port === "") {
      return;
    }

    assignments.push({
      kind: "three-wire",
      port: pneumatic.port,
      deviceId: pneumatic.id,
      deviceName: deviceDisplayName(pneumatic.name, `Pneumatic ${index + 1}`),
      deviceType: "pneumatic",
    });
  });

  return assignments;
}

/**
 * Validates data required to emit VEXcode or PROS device definitions. It is
 * intentionally deterministic and returns all issues in one pass.
 */
export function validateCodeConfiguration(
  configuration: RobotCodeConfiguration | null | undefined,
): CodeConfigurationValidation {
  const errors: CodeConfigurationIssue[] = [];
  const warnings: CodeConfigurationIssue[] = [];

  if (!configuration || typeof configuration !== "object") {
    const issue = createIssue(
      "MISSING_CONFIGURATION",
      "error",
      "configuration",
      "A robot code configuration is required before code can be generated.",
    );
    return {
      valid: false,
      isValid: false,
      canGenerateCode: false,
      errors: [issue],
      warnings: [],
      issues: [issue],
      portConflicts: [],
    };
  }

  const motors = Array.isArray(configuration.motors) ? configuration.motors : [];
  const sensors = Array.isArray(configuration.sensors) ? configuration.sensors : [];
  const pneumatics = Array.isArray(configuration.pneumatics)
    ? configuration.pneumatics
    : [];
  const controllerMappings = Array.isArray(configuration.controllerMappings)
    ? configuration.controllerMappings
    : [];
  const requiredControllerActions = Array.isArray(configuration.requiredControllerActions)
    ? configuration.requiredControllerActions
    : [];

  if (!configuration.language) {
    errors.push(
      createIssue(
        "MISSING_CODE_LANGUAGE",
        "error",
        "language",
        "Choose VEXcode Python, VEXcode C++, or PROS C++ before generating code.",
      ),
    );
  } else if (!CODE_LANGUAGE_SET.has(configuration.language)) {
    errors.push(
      createIssue(
        "UNSUPPORTED_CODE_LANGUAGE",
        "error",
        "language",
        `\"${configuration.language}\" is not a supported code target.`,
      ),
    );
  }

  if (
    configuration.programMode !== undefined &&
    !PROGRAM_MODE_SET.has(configuration.programMode)
  ) {
    errors.push(
      createIssue(
        "INVALID_PROGRAM_MODE",
        "error",
        "programMode",
        "Program mode must be autonomous, driver-control, or competition.",
      ),
    );
  }

  if (motors.length === 0) {
    errors.push(
      createIssue(
        "MISSING_MOTORS",
        "error",
        "motors",
        "Add at least one motor before generating robot code.",
      ),
    );
  }

  const deviceIdPaths = new Map<string, string>();
  const variableNamePaths = new Map<string, string>();

  const checkDeviceIdentity = (
    id: string,
    variableName: string | undefined,
    path: string,
    deviceLabel: string,
  ): void => {
    const normalizedId = normalizeText(id);
    if (normalizedId) {
      const firstPath = deviceIdPaths.get(normalizedId);
      if (firstPath) {
        errors.push(
          createIssue(
            "DUPLICATE_DEVICE_ID",
            "error",
            path,
            `${deviceLabel} reuses the device id \"${normalizedId}\" from ${firstPath}.`,
          ),
        );
      } else {
        deviceIdPaths.set(normalizedId, path);
      }
    }

    const normalizedVariableName = normalizeText(variableName);
    if (!normalizedVariableName) {
      errors.push(
        createIssue(
          "MISSING_DEVICE_VARIABLE_NAME",
          "error",
          `${path}.variableName`,
          `${deviceLabel} needs a code variable name before generation.`,
        ),
      );
      return;
    }

    if (!isValidIdentifier(normalizedVariableName)) {
      errors.push(
        createIssue(
          "INVALID_DEVICE_VARIABLE_NAME",
          "error",
          `${path}.variableName`,
          `\"${normalizedVariableName}\" is not a safe code identifier.`,
        ),
      );
    }

    const firstVariablePath = variableNamePaths.get(normalizedVariableName);
    if (firstVariablePath) {
      errors.push(
        createIssue(
          "DUPLICATE_DEVICE_VARIABLE_NAME",
          "error",
          `${path}.variableName`,
          `\"${normalizedVariableName}\" is already used by ${firstVariablePath}.`,
        ),
      );
    } else {
      variableNamePaths.set(normalizedVariableName, path);
    }
  };

  motors.forEach((motor, index) => {
    const path = `motors[${index}]`;
    const label = deviceDisplayName(motor?.name, `Motor ${index + 1}`);
    checkDeviceIdentity(motor?.id ?? "", motor?.variableName, path, label);

    if (motor?.port === undefined || motor.port === null) {
      errors.push(
        createIssue(
          "MISSING_MOTOR_PORT",
          "error",
          `${path}.port`,
          `${label} needs a Smart Port assignment.`,
        ),
      );
    } else if (!isValidSmartPort(motor.port)) {
      errors.push(
        createIssue(
          "INVALID_SMART_PORT",
          "error",
          `${path}.port`,
          `${label} uses Smart Port ${String(motor.port)}, but V5 Smart Ports are 1-21.`,
          { deviceIds: motor.id ? [motor.id] : undefined, port: motor.port },
        ),
      );
    }

    if (motor?.cartridgeRpm === undefined || motor.cartridgeRpm === null) {
      errors.push(
        createIssue(
          "MISSING_MOTOR_CARTRIDGE",
          "error",
          `${path}.cartridgeRpm`,
          `${label} needs its 100, 200, or 600 RPM motor cartridge selected.`,
        ),
      );
    } else if (!isSupportedMotorCartridgeRpm(motor.cartridgeRpm)) {
      errors.push(
        createIssue(
          "UNSUPPORTED_MOTOR_CARTRIDGE",
          "error",
          `${path}.cartridgeRpm`,
          `${label} has an unsupported motor cartridge RPM.`,
          { deviceIds: motor.id ? [motor.id] : undefined },
        ),
      );
    }
  });

  sensors.forEach((sensor, index) => {
    const path = `sensors[${index}]`;
    const label = deviceDisplayName(sensor?.name, `Sensor ${index + 1}`);
    const sensorType = normalizeDeviceType(sensor?.sensorType ?? "");
    const portKind = sensor?.portKind ?? inferSensorPortKind(sensorType);
    checkDeviceIdentity(sensor?.id ?? "", sensor?.variableName, path, label);

    if (!SMART_SENSOR_TYPE_SET.has(sensorType) && !THREE_WIRE_SENSOR_TYPE_SET.has(sensorType)) {
      errors.push(
        createIssue(
          "UNSUPPORTED_SENSOR",
          "error",
          `${path}.sensorType`,
          `${label} has an unsupported sensor type${sensorType ? `: ${sensorType}` : ""}.`,
          { deviceIds: sensor?.id ? [sensor.id] : undefined },
        ),
      );
    } else if (
      (SMART_SENSOR_TYPE_SET.has(sensorType) && portKind !== "smart") ||
      (THREE_WIRE_SENSOR_TYPE_SET.has(sensorType) && portKind !== "three-wire")
    ) {
      errors.push(
        createIssue(
          "SENSOR_PORT_KIND_MISMATCH",
          "error",
          `${path}.portKind`,
          `${label} is a ${sensorType} sensor and must use a ${
            SMART_SENSOR_TYPE_SET.has(sensorType) ? "Smart" : "three-wire"
          } port.`,
          { deviceIds: sensor?.id ? [sensor.id] : undefined },
        ),
      );
    }

    if (sensor?.port === undefined || sensor.port === null || sensor.port === "") {
      errors.push(
        createIssue(
          "MISSING_SENSOR_PORT",
          "error",
          `${path}.port`,
          `${label} needs a ${portKind === "smart" ? "Smart" : "three-wire"} Port assignment.`,
        ),
      );
    } else if (
      (portKind === "smart" && !isValidSmartPort(normalizePort("smart", sensor.port))) ||
      (portKind === "three-wire" &&
        !isValidThreeWirePort(normalizePort("three-wire", sensor.port)))
    ) {
      errors.push(
        createIssue(
          portKind === "smart" ? "INVALID_SMART_PORT" : "INVALID_THREE_WIRE_PORT",
          "error",
          `${path}.port`,
          `${label} has an invalid ${portKind === "smart" ? "Smart" : "three-wire"} Port.`,
          { deviceIds: sensor?.id ? [sensor.id] : undefined, port: sensor.port },
        ),
      );
    }
  });

  pneumatics.forEach((pneumatic, index) => {
    const path = `pneumatics[${index}]`;
    const label = deviceDisplayName(pneumatic?.name, `Pneumatic ${index + 1}`);
    checkDeviceIdentity(pneumatic?.id ?? "", pneumatic?.variableName, path, label);

    if (pneumatic?.port === undefined || pneumatic.port === null || pneumatic.port === "") {
      errors.push(
        createIssue(
          "MISSING_PNEUMATIC_PORT",
          "error",
          `${path}.port`,
          `${label} needs a three-wire port assignment.`,
        ),
      );
    } else if (!isValidThreeWirePort(normalizePort("three-wire", pneumatic.port))) {
      errors.push(
        createIssue(
          "INVALID_THREE_WIRE_PORT",
          "error",
          `${path}.port`,
          `${label} has an invalid three-wire Port.`,
          { deviceIds: pneumatic?.id ? [pneumatic.id] : undefined, port: pneumatic.port },
        ),
      );
    }
  });

  const drivetrain = configuration.drivetrain;
  if (drivetrain) {
    const drivetrainType = drivetrain.type;
    if (!DRIVETRAIN_TYPE_SET.has(drivetrainType)) {
      errors.push(
        createIssue(
          "INVALID_DRIVETRAIN_TYPE",
          "error",
          "drivetrain.type",
          "Choose a supported drivetrain type.",
        ),
      );
    }

    const drivetrainMotorIds = Array.isArray(drivetrain.motorIds)
      ? drivetrain.motorIds
      : [];
    if (drivetrainMotorIds.length === 0) {
      errors.push(
        createIssue(
          "MISSING_DRIVETRAIN_MOTORS",
          "error",
          "drivetrain.motorIds",
          "Assign drivetrain motors before generating drivetrain code.",
        ),
      );
    }

    const configuredMotorIds = new Set(motors.map((motor) => normalizeText(motor?.id)));
    const drivetrainMotorIdSet = new Set<string>();
    drivetrainMotorIds.forEach((motorId, index) => {
      const normalizedMotorId = normalizeText(motorId);
      const path = `drivetrain.motorIds[${index}]`;
      if (!normalizedMotorId || !configuredMotorIds.has(normalizedMotorId)) {
        errors.push(
          createIssue(
            "UNKNOWN_DRIVETRAIN_MOTOR",
            "error",
            path,
            `Drivetrain motor \"${motorId}\" is not configured in motors.`,
            { deviceIds: normalizedMotorId ? [normalizedMotorId] : undefined },
          ),
        );
      }

      if (drivetrainMotorIdSet.has(normalizedMotorId)) {
        errors.push(
          createIssue(
            "DUPLICATE_DRIVETRAIN_MOTOR",
            "error",
            path,
            `Drivetrain motor \"${motorId}\" is assigned more than once.`,
            { deviceIds: normalizedMotorId ? [normalizedMotorId] : undefined },
          ),
        );
      }
      drivetrainMotorIdSet.add(normalizedMotorId);
    });

    const requiredMotorCount = minimumDrivetrainMotorCount(drivetrainType);
    if (requiredMotorCount > 0 && drivetrainMotorIds.length < requiredMotorCount) {
      errors.push(
        createIssue(
          "INVALID_DRIVETRAIN_MOTOR_COUNT",
          "error",
          "drivetrain.motorIds",
          `${drivetrainType} drive needs at least ${requiredMotorCount} assigned motor${
            requiredMotorCount === 1 ? "" : "s"
          }.`,
        ),
      );
    }

    if (drivetrain.wheelDiameterInches === undefined) {
      warnings.push(
        createIssue(
          "UNKNOWN_WHEEL_DIAMETER",
          "warning",
          "drivetrain.wheelDiameterInches",
          "Wheel diameter is unknown, so drivetrain speed cannot be calculated yet.",
        ),
      );
    } else if (
      !Number.isFinite(drivetrain.wheelDiameterInches) ||
      drivetrain.wheelDiameterInches <= 0
    ) {
      errors.push(
        createIssue(
          "INVALID_WHEEL_DIAMETER",
          "error",
          "drivetrain.wheelDiameterInches",
          "Wheel diameter must be a finite number greater than zero.",
        ),
      );
    }

    if (drivetrain.gearStages === undefined) {
      warnings.push(
        createIssue(
          "UNKNOWN_GEAR_RATIO",
          "warning",
          "drivetrain.gearStages",
          "External drivetrain gearing is unknown. Use [] to explicitly record direct-drive.",
        ),
      );
    } else if (!Array.isArray(drivetrain.gearStages)) {
      errors.push(
        createIssue(
          "INVALID_GEAR_RATIO",
          "error",
          "drivetrain.gearStages",
          "Drivetrain gear stages must be an array.",
        ),
      );
    } else {
      drivetrain.gearStages.forEach((stage, index) => {
        try {
          calculateGearRatio(stage);
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Invalid gear stage.";
          errors.push(
            createIssue(
              "INVALID_GEAR_RATIO",
              "error",
              `drivetrain.gearStages[${index}]`,
              reason,
            ),
          );
        }
      });
    }
  }

  const controllerControls = new Map<string, string>();
  controllerMappings.forEach((mapping, index) => {
    const path = `controllerMappings[${index}]`;
    const control = normalizeText(mapping?.control);
    const action = normalizeText(mapping?.action);
    if (!control || !action) {
      errors.push(
        createIssue(
          "INVALID_CONTROLLER_MAPPING",
          "error",
          path,
          "Each controller mapping needs both a controller input and an action.",
        ),
      );
      return;
    }

    const normalizedControl = control.toLocaleLowerCase();
    const priorPath = controllerControls.get(normalizedControl);
    if (priorPath) {
      errors.push(
        createIssue(
          "CONTROLLER_CONTROL_CONFLICT",
          "error",
          `${path}.control`,
          `${control} is already assigned by ${priorPath}.`,
        ),
      );
    } else {
      controllerControls.set(normalizedControl, path);
    }
  });

  const mappedActions = new Set(
    controllerMappings
      .map((mapping) => normalizeAction(mapping?.action ?? ""))
      .filter(Boolean),
  );
  const driverControlRequired =
    configuration.programMode === "driver-control" ||
    configuration.programMode === "competition" ||
    requiredControllerActions.length > 0;

  if (driverControlRequired && controllerMappings.length === 0) {
    errors.push(
      createIssue(
        "MISSING_CONTROLLER_MAPPING",
        "error",
        "controllerMappings",
        "Driver-control code requires at least one controller mapping.",
      ),
    );
  }

  requiredControllerActions.forEach((action, index) => {
    const normalizedAction = normalizeAction(action);
    if (!normalizedAction || !mappedActions.has(normalizedAction)) {
      errors.push(
        createIssue(
          "MISSING_CONTROLLER_MAPPING",
          "error",
          `requiredControllerActions[${index}]`,
          `No controller mapping was found for required action \"${action}\".`,
        ),
      );
    }
  });

  const allAssignments = getCodePortAssignments(configuration);
  const validAssignments = allAssignments.filter(isPortAssignmentValid);
  const portConflicts = detectPortConflicts(validAssignments);
  portConflicts.forEach((conflict) => {
    const pneumaticAssignments = conflict.assignments.filter(
      (assignment) => assignment.deviceType === "pneumatic",
    );
    const isPneumaticConflict = pneumaticAssignments.length > 1;
    const deviceNames = conflict.assignments.map((assignment) => assignment.deviceName);
    errors.push(
      createIssue(
        isPneumaticConflict
          ? "CONFLICTING_PNEUMATIC_ASSIGNMENT"
          : "DUPLICATE_PORT_ASSIGNMENT",
        "error",
        `${conflict.kind}Ports.${String(conflict.port)}`,
        `${conflict.kind === "smart" ? "Smart" : "Three-wire"} Port ${String(
          conflict.port,
        )} is assigned to ${deviceNames.join(", ")}.`,
        {
          deviceIds: conflict.assignments
            .map((assignment) => assignment.deviceId)
            .filter((id): id is string => Boolean(id)),
          port: conflict.port,
        },
      ),
    );
  });

  const issues = [...errors, ...warnings];
  const isValid = errors.length === 0;
  return {
    valid: isValid,
    isValid,
    canGenerateCode: isValid,
    errors,
    warnings,
    issues,
    portConflicts,
  };
}
