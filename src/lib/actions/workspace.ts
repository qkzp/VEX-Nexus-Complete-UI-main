"use server";

import { updateTeamSharedState } from "@/lib/workspace/state";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/authz";
import { databaseErrorMessage, prisma } from "@/lib/db";
import { VEX_V5_SMART_DEVICE_OPTIONS, VEX_V5_THREE_WIRE_DEVICE_OPTIONS, VEX_V5_WHEEL_DIAMETERS, VEX_V5_TRANSMISSION_OPTIONS } from "@/lib/vex-hardware";
import {
  requireRobotWriteAccess,
  requireWorkspaceTeam,
} from "@/lib/workspace/data";

export type WorkspaceActionState = {
  error?: string;
  success?: string;
  entityId?: string;
  notebookDraftId?: string;
};

const teamIdSchema = z.string().trim().min(1).max(64);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);

function revalidateWorkspace(teamId?: string | null) {
  revalidatePath("/app/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/robots");
  revalidatePath("/team/tasks");
  revalidatePath("/notebook");
  revalidatePath("/build-log");
  revalidatePath("/testing");
  revalidatePath("/field-lab");
  revalidatePath("/events");
  if (teamId) revalidatePath("/team?team=" + encodeURIComponent(teamId));
}

function messageForError(error: unknown, fallback: string) {
  const databaseMessage = databaseErrorMessage(error);
  if (databaseMessage) return databaseMessage;
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return "That port or record is already in use. Check the existing configuration and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const createRobotSchema = z.object({
  teamId: teamIdSchema,
  name: z.string().trim().min(2, "Give the robot a name.").max(100),
  description: optionalText(2_000),
  seasonLabel: optionalText(80),
});

export async function createRobotAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createRobotSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    description: formData.get("description"),
    seasonLabel: formData.get("seasonLabel"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the robot details." };

  try {
    const user = await requireCurrentUser("/robots");
    const { team } = await requireWorkspaceTeam(user.id, parsed.data.teamId, "TEAM_LEAD");
    const robot = await prisma.robot.create({
      data: {
        ownerId: user.id,
        teamId: team.id,
        name: parsed.data.name,
        description: parsed.data.description,
        teamNumber: team.teamNumber,
        configuration: { create: { customProperties: parsed.data.seasonLabel ? { seasonLabel: parsed.data.seasonLabel } : undefined } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "robot.create",
        targetType: "Robot",
        targetId: robot.id,
        metadata: { teamId: team.id },
      },
    });
    revalidateWorkspace(team.id);
    return { success: "Robot created. Configure its hardware next.", entityId: robot.id };
  } catch (error) {
    return { error: messageForError(error, "We could not create that robot.") };
  }
}

const transmissionValues = ["DIRECT", "SPUR", "CHAIN_3P", "CHAIN_6P", "CHAIN_9P"] as const;
const robotConfigurationSchema = z.object({
  robotId: z.string().trim().min(1).max(64),
  drivetrainType: z.enum(["TANK", "ARCADE", "HOLONOMIC", "X_DRIVE", "MECANUM", "CUSTOM"]).optional(),
  wheelDiameterIn: z.coerce.number().positive().nullable().refine((value) => value === null || (VEX_V5_WHEEL_DIAMETERS as readonly number[]).includes(value), "Choose a wheel diameter currently listed for VEX V5: 2, 2.75, 3.25, or 4 inches."),
  trackWidthIn: z.coerce.number().positive().max(72).nullable(),
  transmissionType: z.enum(transmissionValues).default("DIRECT"),
  stage1Driving: z.coerce.number().int().positive().nullable(),
  stage1Driven: z.coerce.number().int().positive().nullable(),
  stage2Driving: z.coerce.number().int().positive().nullable(),
  stage2Driven: z.coerce.number().int().positive().nullable(),
});

function nullableNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value;
}

function allowedTeeth(type: typeof transmissionValues[number]) {
  return VEX_V5_TRANSMISSION_OPTIONS.find((option) => option.value === type)?.teeth ?? [];
}

export async function updateRobotConfigurationAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = robotConfigurationSchema.safeParse({
    robotId: formData.get("robotId"),
    drivetrainType: formData.get("drivetrainType") || undefined,
    wheelDiameterIn: nullableNumber(formData.get("wheelDiameterIn")),
    trackWidthIn: nullableNumber(formData.get("trackWidthIn")),
    transmissionType: formData.get("transmissionType") || "DIRECT",
    stage1Driving: nullableNumber(formData.get("stage1Driving")),
    stage1Driven: nullableNumber(formData.get("stage1Driven")),
    stage2Driving: nullableNumber(formData.get("stage2Driving")),
    stage2Driven: nullableNumber(formData.get("stage2Driven")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the drivetrain values." };

  const { transmissionType } = parsed.data;
  const teeth = allowedTeeth(transmissionType);
  const stages: { driving: number; driven: number }[] = [];
  if (transmissionType !== "DIRECT") {
    const pairs = [
      [parsed.data.stage1Driving, parsed.data.stage1Driven],
      [parsed.data.stage2Driving, parsed.data.stage2Driven],
    ] as const;
    for (const [driving, driven] of pairs) {
      if (driving === null && driven === null) continue;
      if (driving === null || driven === null) return { error: "Complete both tooth counts for each transmission stage." };
      if (!teeth.includes(driving) || !teeth.includes(driven)) return { error: "Choose tooth counts that exist in the selected VEX transmission family." };
      stages.push({ driving, driven });
    }
    if (!stages.length) return { error: "Add at least one transmission stage, or choose Direct drive." };
  }

  const speedMultiplier = stages.reduce((value, stage) => value * (stage.driving / stage.driven), 1);
  const externalGearRatio = speedMultiplier > 0 ? 1 / speedMultiplier : null;

  try {
    const user = await requireCurrentUser("/robots");
    const robot = await requireRobotWriteAccess(user.id, parsed.data.robotId);
    const existing = await prisma.robotConfiguration.findUnique({ where: { robotId: robot.id }, select: { customProperties: true, configurationVersion: true } });
    const customProperties = existing?.customProperties && typeof existing.customProperties === "object" && !Array.isArray(existing.customProperties)
      ? existing.customProperties as Record<string, unknown>
      : {};
    const driveMotorCount = await prisma.motor.count({ where: { configuration: { robotId: robot.id }, purpose: "DRIVE" } });
    const firstDriveMotor = await prisma.motor.findFirst({ where: { configuration: { robotId: robot.id }, purpose: "DRIVE" }, select: { cartridge: true, customRpm: true } });
    const motorRpm = firstDriveMotor ? (firstDriveMotor.cartridge === "RPM_100" ? 100 : firstDriveMotor.cartridge === "RPM_200" ? 200 : firstDriveMotor.cartridge === "RPM_600" ? 600 : firstDriveMotor.customRpm ?? null) : null;
    const wheelRpm = motorRpm ? motorRpm * speedMultiplier : null;
    const theoreticalSpeedFtPerSec = wheelRpm && parsed.data.wheelDiameterIn ? wheelRpm * Math.PI * parsed.data.wheelDiameterIn / 60 / 12 : null;
    const nextCustom = { ...customProperties, transmission: { type: transmissionType, stages, speedMultiplier } };

    const before = existing ? { ...customProperties, configurationVersion: existing.configurationVersion } : null;
    const config = await prisma.robotConfiguration.upsert({
      where: { robotId: robot.id },
      create: {
        robotId: robot.id,
        drivetrainType: parsed.data.drivetrainType,
        driveMotorCount,
        wheelDiameterIn: parsed.data.wheelDiameterIn,
        trackWidthIn: parsed.data.trackWidthIn,
        externalGearRatio,
        theoreticalSpeedFtPerSec,
        customProperties: nextCustom,
      },
      update: {
        drivetrainType: parsed.data.drivetrainType,
        driveMotorCount,
        wheelDiameterIn: parsed.data.wheelDiameterIn,
        trackWidthIn: parsed.data.trackWidthIn,
        externalGearRatio,
        theoreticalSpeedFtPerSec,
        customProperties: nextCustom,
        configurationVersion: { increment: 1 },
      },
    });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "robot.configuration.revision", targetType: "RobotConfiguration", targetId: config.id, metadata: { robotId: robot.id, before, after: { drivetrainType: parsed.data.drivetrainType, wheelDiameterIn: parsed.data.wheelDiameterIn, trackWidthIn: parsed.data.trackWidthIn, transmission: nextCustom.transmission, configurationVersion: config.configurationVersion } } } });
    revalidateWorkspace(robot.teamId);
    revalidatePath("/robots/" + robot.id);
    return { success: `Drivetrain saved as configuration revision ${config.configurationVersion}.` };
  } catch (error) {
    return { error: messageForError(error, "We could not save that drivetrain configuration.") };
  }
}


const configureBrainPortSchema = z.object({
  robotId: z.string().trim().min(1).max(64),
  portKind: z.enum(["smart", "threeWire"]),
  port: z.string().trim().min(1).max(2),
  device: z.string().trim().max(64),
  label: z.string().trim().max(80).optional(),
  cartridge: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  reversed: z.boolean(),
});

const smartSensorTypeByDevice = {
  ai_vision: "VISION", inertial: "INERTIAL", rotation: "ROTATION", optical: "OPTICAL", distance: "DISTANCE", gps: "GPS", vision: "VISION", three_wire_expander: "CUSTOM", radio: "CUSTOM",
} as const;
const threeWireSensorTypeByDevice = {
  bumper: "BUMPER", limit: "LIMIT_SWITCH", potentiometer: "ANALOG_IN", optical_encoder: "ADI_ENCODER", ultrasonic: "SONAR", line_tracker: "ANALOG_IN", light_sensor: "ANALOG_IN", led_indicator: "DIGITAL_OUT", yaw_gyro: "ANALOG_IN", analog_accelerometer: "ANALOG_IN", jumper: "DIGITAL_IN",
} as const;
const motorPurposes = ["DRIVE", "INTAKE", "LIFT", "ARM", "FLYWHEEL", "CONVEYOR", "CLIMBER", "ROLLER", "INDEXER", "CUSTOM"] as const;
const motorCartridges = ["RPM_100", "RPM_200", "RPM_600"] as const;

export async function configureBrainPortAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = configureBrainPortSchema.safeParse({
    robotId: formData.get("robotId"),
    portKind: formData.get("portKind"),
    port: formData.get("port"),
    device: formData.get("device") ?? "",
    label: formData.get("label") || undefined,
    cartridge: formData.get("cartridge") || undefined,
    purpose: formData.get("purpose") || undefined,
    reversed: formData.get("reversed") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the Brain port assignment." };

  const allowedDevices = parsed.data.portKind === "smart" ? VEX_V5_SMART_DEVICE_OPTIONS : VEX_V5_THREE_WIRE_DEVICE_OPTIONS;
  if (!allowedDevices.some((option) => option.value === parsed.data.device)) return { error: "Choose a supported VEX device from the port list." };
  const smartPort = parsed.data.portKind === "smart" ? Number(parsed.data.port) : null;
  const threeWirePort = parsed.data.portKind === "threeWire" ? parsed.data.port.toUpperCase() : null;
  if (smartPort !== null && (!Number.isInteger(smartPort) || smartPort < 1 || smartPort > 21)) return { error: "Smart ports run from 1 to 21." };
  if (threeWirePort !== null && !/^[A-H]$/.test(threeWirePort)) return { error: "3-Wire ports run from A to H." };
  const is11wMotor = parsed.data.device === "motor_11w";
  const is55wMotor = parsed.data.device === "motor_5_5w";
  if ((is11wMotor || is55wMotor) && !motorPurposes.includes(parsed.data.purpose as typeof motorPurposes[number])) {
    return { error: "Choose the motor purpose before saving that port." };
  }
  if (is11wMotor && !motorCartridges.includes(parsed.data.cartridge as typeof motorCartridges[number])) {
    return { error: "Choose the actual 11W Smart Motor cartridge before saving that port." };
  }

  try {
    const user = await requireCurrentUser("/robots");
    const robot = await requireRobotWriteAccess(user.id, parsed.data.robotId);
    const configuration = await prisma.robotConfiguration.upsert({ where: { robotId: robot.id }, create: { robotId: robot.id }, update: {}, select: { id: true } });
    await prisma.$transaction(async (tx) => {
      if (smartPort !== null) {
        await tx.motor.deleteMany({ where: { robotConfigurationId: configuration.id, port: smartPort } });
        await tx.sensor.deleteMany({ where: { robotConfigurationId: configuration.id, smartPort } });
        if (!parsed.data.device) return;
        const defaultLabel = VEX_V5_SMART_DEVICE_OPTIONS.find((option) => option.value === parsed.data.device)?.label ?? "VEX Smart Device";
        const label = parsed.data.label?.trim() || defaultLabel;
        if (is11wMotor) {
          await tx.motor.create({ data: { robotConfigurationId: configuration.id, port: smartPort, label, cartridge: parsed.data.cartridge as typeof motorCartridges[number], customRpm: null, purpose: parsed.data.purpose as typeof motorPurposes[number], reversed: parsed.data.reversed } });
        } else if (is55wMotor) {
          await tx.motor.create({ data: { robotConfigurationId: configuration.id, port: smartPort, label, cartridge: "CUSTOM", customRpm: 200, purpose: parsed.data.purpose as typeof motorPurposes[number], reversed: parsed.data.reversed } });
        } else {
          const sensorType = smartSensorTypeByDevice[parsed.data.device as keyof typeof smartSensorTypeByDevice];
          if (!sensorType) throw new Error("That Smart Port device is not supported by the saved robot profile.");
          await tx.sensor.create({ data: { robotConfigurationId: configuration.id, smartPort, label, type: sensorType, configuration: { officialDeviceKey: parsed.data.device, officialDeviceLabel: label } } });
        }
      } else if (threeWirePort !== null) {
        await tx.sensor.deleteMany({ where: { robotConfigurationId: configuration.id, threeWirePort } });
        await tx.pneumatic.deleteMany({ where: { robotConfigurationId: configuration.id, threeWirePort } });
        if (!parsed.data.device) return;
        const defaultLabel = VEX_V5_THREE_WIRE_DEVICE_OPTIONS.find((option) => option.value === parsed.data.device)?.label ?? "VEX 3-Wire Device";
        const label = parsed.data.label?.trim() || defaultLabel;
        if (parsed.data.device === "pneumatic_solenoid") {
          await tx.pneumatic.create({ data: { robotConfigurationId: configuration.id, threeWirePort, label, controlType: "DIGITAL_OUT" } });
        } else {
          const sensorType = threeWireSensorTypeByDevice[parsed.data.device as keyof typeof threeWireSensorTypeByDevice];
          if (!sensorType) throw new Error("That 3-Wire device is not supported by the saved robot profile.");
          await tx.sensor.create({ data: { robotConfigurationId: configuration.id, threeWirePort, label, type: sensorType, configuration: { officialDeviceKey: parsed.data.device, officialDeviceLabel: label } } });
        }
      }
    });
    revalidateWorkspace(robot.teamId);
    revalidatePath("/robots/" + robot.id);
    return { success: `${parsed.data.portKind === "smart" ? `Smart Port ${smartPort}` : `3-Wire Port ${threeWirePort}`} saved.` };
  } catch (error) {
    return { error: messageForError(error, "We could not save that Brain port assignment.") };
  }
}

const addMotorSchema = z.object({
  robotId: z.string().trim().min(1).max(64),
  label: z.string().trim().min(2, "Add a motor label.").max(80),
  port: z.coerce.number().int().min(1, "Smart ports run from 1 to 21.").max(21, "Smart ports run from 1 to 21."),
  cartridge: z.enum(["RPM_100", "RPM_200", "RPM_600"]),
  purpose: z.enum(["DRIVE", "INTAKE", "LIFT", "ARM", "FLYWHEEL", "CONVEYOR", "CLIMBER", "ROLLER", "INDEXER", "CUSTOM"]),
  reversed: z.boolean(),
});

export async function addMotorAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = addMotorSchema.safeParse({
    robotId: formData.get("robotId"),
    label: formData.get("label"),
    port: formData.get("port"),
    cartridge: formData.get("cartridge"),
    purpose: formData.get("purpose"),
    reversed: formData.get("reversed") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the motor details." };

  try {
    const user = await requireCurrentUser("/robots");
    const robot = await requireRobotWriteAccess(user.id, parsed.data.robotId);
    const configuration = await prisma.robotConfiguration.upsert({
      where: { robotId: robot.id },
      create: { robotId: robot.id },
      update: {},
      select: { id: true },
    });
    await prisma.motor.create({
      data: {
        robotConfigurationId: configuration.id,
        label: parsed.data.label,
        port: parsed.data.port,
        cartridge: parsed.data.cartridge,
        purpose: parsed.data.purpose,
        reversed: parsed.data.reversed,
      },
    });
    revalidateWorkspace(robot.teamId);
    revalidatePath("/robots/" + robot.id);
    return { success: "Motor added to the robot profile." };
  } catch (error) {
    return { error: messageForError(error, "We could not add that motor.") };
  }
}

const addSensorSchema = z.object({
  robotId: z.string().trim().min(1).max(64),
  label: z.string().trim().min(2, "Add a sensor label.").max(80),
  type: z.enum([
    "INERTIAL", "ROTATION", "OPTICAL", "DISTANCE", "GPS", "VISION", "SONAR", "ENCODER", "LIMIT_SWITCH", "BUMPER", "DIGITAL_IN", "DIGITAL_OUT", "ANALOG_IN", "ADI_ENCODER", "CUSTOM",
  ]),
  portKind: z.enum(["smart", "threeWire"]),
  port: z.string().trim().min(1, "Choose a port."),
});

export async function addSensorAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = addSensorSchema.safeParse({
    robotId: formData.get("robotId"),
    label: formData.get("label"),
    type: formData.get("type"),
    portKind: formData.get("portKind"),
    port: formData.get("port"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the sensor details." };

  const smartPort = parsed.data.portKind === "smart" ? Number(parsed.data.port) : null;
  const threeWirePort = parsed.data.portKind === "threeWire" ? parsed.data.port.toUpperCase() : null;
  if (smartPort !== null && (!Number.isInteger(smartPort) || smartPort < 1 || smartPort > 21)) {
    return { error: "Smart ports run from 1 to 21." };
  }
  if (threeWirePort !== null && !/^[A-H]$/.test(threeWirePort)) {
    return { error: "Three-wire ports run from A to H." };
  }

  try {
    const user = await requireCurrentUser("/robots");
    const robot = await requireRobotWriteAccess(user.id, parsed.data.robotId);
    const configuration = await prisma.robotConfiguration.upsert({
      where: { robotId: robot.id },
      create: { robotId: robot.id },
      update: {},
      select: { id: true },
    });
    await prisma.sensor.create({
      data: {
        robotConfigurationId: configuration.id,
        label: parsed.data.label,
        type: parsed.data.type,
        smartPort,
        threeWirePort,
      },
    });
    revalidateWorkspace(robot.teamId);
    revalidatePath("/robots/" + robot.id);
    return { success: "Sensor added to the robot profile." };
  } catch (error) {
    return { error: messageForError(error, "We could not add that sensor.") };
  }
}

const createTaskSchema = z.object({
  teamId: teamIdSchema,
  title: z.string().trim().min(2, "Add a task title.").max(160),
  description: optionalText(4_000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["BACKLOG", "DESIGNING", "BUILDING", "TESTING", "READY", "COMPLETE"]).default("BACKLOG"),
  dueAt: z.string().trim().optional(),
  assigneeId: z.string().trim().optional(),
  robotId: z.string().trim().optional(),
});

export async function createTaskAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createTaskSchema.safeParse({
    teamId: formData.get("teamId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || undefined,
    status: formData.get("status") || undefined,
    dueAt: formData.get("dueAt") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    robotId: formData.get("robotId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the task details." };

  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { error: "Choose a valid due date." };

  try {
    const user = await requireCurrentUser("/team/tasks");
    await requireWorkspaceTeam(user.id, parsed.data.teamId, "MEMBER");
    if (parsed.data.assigneeId) {
      const assignee = await prisma.teamMember.findFirst({
        where: { teamId: parsed.data.teamId, userId: parsed.data.assigneeId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!assignee) return { error: "Choose a current member of this team." };
    }
    if (parsed.data.robotId) {
      const robot = await prisma.robot.findFirst({
        where: { id: parsed.data.robotId, teamId: parsed.data.teamId },
        select: { id: true },
      });
      if (!robot) return { error: "Choose a robot that belongs to this team." };
    }
    const lastTask = await prisma.task.findFirst({
      where: { teamId: parsed.data.teamId, status: parsed.data.status },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const task = await prisma.task.create({
      data: {
        teamId: parsed.data.teamId,
        createdById: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: parsed.data.status,
        dueAt,
        robotId: parsed.data.robotId || null,
        position: (lastTask?.position ?? -1) + 1,
        ...(parsed.data.assigneeId
          ? { assignees: { create: { userId: parsed.data.assigneeId } } }
          : {}),
      },
    });
    revalidateWorkspace(parsed.data.teamId);
    return { success: "Task created.", entityId: task.id };
  } catch (error) {
    return { error: messageForError(error, "We could not create that task.") };
  }
}

const updateTaskStatusSchema = z.object({
  taskId: z.string().trim().min(1).max(64),
  status: z.enum(["BACKLOG", "DESIGNING", "BUILDING", "TESTING", "READY", "COMPLETE", "CANCELLED"]),
});

export async function updateTaskStatusAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = updateTaskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Choose a valid task status." };

  try {
    const user = await requireCurrentUser("/team/tasks");
    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      select: { id: true, teamId: true, createdById: true },
    });
    if (!task) return { error: "That task no longer exists." };
    await requireWorkspaceTeam(user.id, task.teamId, "MEMBER");
    await prisma.task.update({ where: { id: task.id }, data: { status: parsed.data.status } });
    revalidateWorkspace(task.teamId);
    return { success: "Task status updated." };
  } catch (error) {
    return { error: messageForError(error, "We could not update that task.") };
  }
}

const testRunTypes = ["DRIVETRAIN", "AUTONOMOUS", "MECHANISM", "OTHER"] as const;
const createTestRunSchema = z.object({
  teamId: teamIdSchema,
  robotId: z.string().trim().min(1).max(64),
  taskId: optionalText(64),
  configurationVersion: z.coerce.number().int().min(0).max(10_000),
  type: z.enum(testRunTypes),
  name: z.string().trim().min(2, "Name the test or route.").max(180),
  durationSeconds: z.coerce.number().positive().max(86_400).nullable(),
  score: z.coerce.number().finite().min(-1_000_000).max(1_000_000).nullable(),
  passed: z.enum(["pass", "fail"]).transform((value) => value === "pass"),
  notes: optionalText(4_000),
  createEvidence: z.boolean(),
  completeTask: z.boolean(),
});

function nullableDecimal(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value;
}

function testRunDescription(data: z.infer<typeof createTestRunSchema>) {
  const kind = data.type.toLowerCase().replaceAll("_", " ");
  const facts = [
    `Test type: ${kind}.`,
    `Recorded result: ${data.passed ? "passed" : "failed"}.`,
    data.durationSeconds === null ? null : `Recorded duration: ${data.durationSeconds} seconds.`,
    data.score === null ? null : `Recorded score: ${data.score}.`,
    data.notes ? `Observation: ${data.notes}` : null,
  ].filter((value): value is string => Boolean(value));
  return facts.join(" ");
}

export async function createTestRunAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createTestRunSchema.safeParse({
    teamId: formData.get("teamId"),
    robotId: formData.get("robotId"),
    taskId: formData.get("taskId"),
    configurationVersion: formData.get("configurationVersion"),
    type: formData.get("type"),
    name: formData.get("name"),
    durationSeconds: nullableDecimal(formData.get("durationSeconds")),
    score: nullableDecimal(formData.get("score")),
    passed: formData.get("passed"),
    notes: formData.get("notes"),
    createEvidence: formData.get("createEvidence") === "on",
    completeTask: formData.get("completeTask") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the test details." };
  if (parsed.data.completeTask && !parsed.data.taskId) return { error: "Choose a task before marking it complete." };

  try {
    const user = await requireCurrentUser("/testing");
    await requireWorkspaceTeam(user.id, parsed.data.teamId, "MEMBER");
    const robot = await prisma.robot.findFirst({
      where: { id: parsed.data.robotId, teamId: parsed.data.teamId },
      select: { id: true, name: true, configuration: { select: { configurationVersion: true } } },
    });
    if (!robot) return { error: "Choose a robot that belongs to this team." };
    const currentConfigurationVersion = robot.configuration?.configurationVersion ?? 0;
    if (parsed.data.configurationVersion !== currentConfigurationVersion) {
      return { error: "This robot configuration changed. Refresh the testing page before recording this result." };
    }

    if (parsed.data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: parsed.data.taskId, teamId: parsed.data.teamId },
        select: { id: true, robotId: true },
      });
      if (!task) return { error: "Choose a current task from this team." };
      if (task.robotId && task.robotId !== robot.id) return { error: "Choose a task for this robot or a team-wide task." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const testRun = await tx.testRun.create({
        data: {
          teamId: parsed.data.teamId,
          robotId: robot.id,
          taskId: parsed.data.taskId,
          createdById: user.id,
          configurationVersion: currentConfigurationVersion,
          type: parsed.data.type,
          name: parsed.data.name,
          durationSeconds: parsed.data.durationSeconds,
          score: parsed.data.score,
          passed: parsed.data.passed,
          notes: parsed.data.notes,
        },
      });

      if (parsed.data.createEvidence) {
        const buildLog = await tx.buildLog.create({
          data: {
            teamId: parsed.data.teamId,
            robotId: robot.id,
            authorId: user.id,
            occurredOn: testRun.createdAt,
            title: `${robot.name}: ${parsed.data.name}`,
            summary: "Test evidence recorded from the testing workspace.",
            testing: testRunDescription(parsed.data),
            results: `Recorded result: ${parsed.data.passed ? "passed" : "failed"}.`,
            nextSteps: parsed.data.passed ? null : "Review the failed result before repeating the test.",
          },
        });
        await tx.testRun.update({ where: { id: testRun.id }, data: { buildLogId: buildLog.id } });
      }

      if (parsed.data.completeTask && parsed.data.taskId) {
        await tx.task.update({ where: { id: parsed.data.taskId }, data: { status: "COMPLETE" } });
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "robot.test.record",
          targetType: "TestRun",
          targetId: testRun.id,
          metadata: {
            teamId: parsed.data.teamId,
            robotId: robot.id,
            taskId: parsed.data.taskId,
            type: parsed.data.type,
            passed: parsed.data.passed,
            evidenceCreated: parsed.data.createEvidence,
            taskCompleted: parsed.data.completeTask,
          },
        },
      });
      return testRun;
    });

    revalidateWorkspace(parsed.data.teamId);
    return {
      success: `${parsed.data.name} saved${parsed.data.createEvidence ? " with a linked build-log record" : ""}${parsed.data.completeTask ? " and the selected task marked complete" : ""}.`,
      entityId: result.id,
      notebookDraftId: result.id,
    };
  } catch (error) {
    return { error: messageForError(error, "We could not save that test run.") };
  }
}

const createNotebookSchema = z.object({
  teamId: teamIdSchema,
  robotId: optionalText(64),
  testRunId: optionalText(64),
  title: z.string().trim().min(2, "Add an entry title.").max(180),
  occurredOn: z.string().trim().min(1),
  objective: optionalText(4_000),
  problem: optionalText(4_000),
  research: optionalText(8_000),
  decision: optionalText(4_000),
  testing: optionalText(4_000),
  results: optionalText(4_000),
  nextSteps: optionalText(4_000),
});

export async function createNotebookEntryAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createNotebookSchema.safeParse({
    teamId: formData.get("teamId"),
    robotId: formData.get("robotId"),
    testRunId: formData.get("testRunId"),
    title: formData.get("title"),
    occurredOn: formData.get("occurredOn"),
    objective: formData.get("objective"),
    problem: formData.get("problem"),
    research: formData.get("research"),
    decision: formData.get("decision"),
    testing: formData.get("testing"),
    results: formData.get("results"),
    nextSteps: formData.get("nextSteps"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check this notebook entry." };
  const occurredOn = new Date(parsed.data.occurredOn);
  if (Number.isNaN(occurredOn.getTime())) return { error: "Choose a valid entry date." };

  try {
    const user = await requireCurrentUser("/notebook");
    await requireWorkspaceTeam(user.id, parsed.data.teamId, "MEMBER");
    if (parsed.data.robotId) {
      const robot = await prisma.robot.findFirst({ where: { id: parsed.data.robotId, teamId: parsed.data.teamId }, select: { id: true } });
      if (!robot) return { error: "Choose a robot from this team." };
    }
    const linkedTest = parsed.data.testRunId
      ? await prisma.testRun.findFirst({ where: { id: parsed.data.testRunId, teamId: parsed.data.teamId }, select: { id: true, robotId: true, notebookEntryId: true } })
      : null;
    if (parsed.data.testRunId && !linkedTest) return { error: "That test record is no longer available to this team." };
    if (linkedTest && parsed.data.robotId && linkedTest.robotId !== parsed.data.robotId) return { error: "The notebook robot must match the linked test." };
    if (linkedTest?.notebookEntryId) return { error: "This test already has a linked notebook entry." };

    const { robotId, testRunId, ...entryData } = parsed.data;
    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.notebookEntry.create({
        data: { ...entryData, robotId: robotId || linkedTest?.robotId || null, occurredOn, authorId: user.id },
      });
      if (testRunId) await tx.testRun.update({ where: { id: testRunId }, data: { notebookEntryId: created.id } });
      return created;
    });
    revalidateWorkspace(parsed.data.teamId);
    return { success: "Notebook entry saved.", entityId: entry.id };
  } catch (error) {
    return { error: messageForError(error, "We could not save this notebook entry.") };
  }
}

const createBuildLogSchema = z.object({
  teamId: teamIdSchema,
  robotId: optionalText(64),
  title: z.string().trim().min(2, "Add a build-log title.").max(180),
  occurredOn: z.string().trim().min(1),
  summary: optionalText(8_000),
  reason: optionalText(4_000),
  testing: optionalText(4_000),
  results: optionalText(4_000),
  nextSteps: optionalText(4_000),
});

export async function createBuildLogAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createBuildLogSchema.safeParse({
    teamId: formData.get("teamId"),
    robotId: formData.get("robotId"),
    title: formData.get("title"),
    occurredOn: formData.get("occurredOn"),
    summary: formData.get("summary"),
    reason: formData.get("reason"),
    testing: formData.get("testing"),
    results: formData.get("results"),
    nextSteps: formData.get("nextSteps"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check this build-log entry." };
  const occurredOn = new Date(parsed.data.occurredOn);
  if (Number.isNaN(occurredOn.getTime())) return { error: "Choose a valid build-log date." };

  try {
    const user = await requireCurrentUser("/build-log");
    await requireWorkspaceTeam(user.id, parsed.data.teamId, "MEMBER");
    if (parsed.data.robotId) {
      const robot = await prisma.robot.findFirst({ where: { id: parsed.data.robotId, teamId: parsed.data.teamId }, select: { id: true } });
      if (!robot) return { error: "Choose a robot from this team." };
    }
    const entry = await prisma.buildLog.create({
      data: { ...parsed.data, occurredOn, authorId: user.id },
    });
    revalidateWorkspace(parsed.data.teamId);
    return { success: "Build-log entry saved.", entityId: entry.id };
  } catch (error) {
    return { error: messageForError(error, "We could not save this build log.") };
  }
}

export async function setActiveTeamAction(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/app/dashboard");
  const user = await requireCurrentUser(returnTo);
  await requireWorkspaceTeam(user.id, teamId, "VIEWER");
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, defaultTeamId: teamId },
    update: { defaultTeamId: teamId },
  });
  revalidatePath("/", "layout");
  redirect(returnTo.startsWith("/") ? returnTo : "/app/dashboard");
}

export async function setActiveRobotAction(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const robotId = String(formData.get("robotId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/robots");
  const user = await requireCurrentUser(returnTo);
  await requireWorkspaceTeam(user.id, teamId, "MEMBER");
  const robot = await prisma.robot.findFirst({ where: { id: robotId, teamId }, select: { id: true } });
  if (!robot) throw new Error("That robot does not belong to this team.");
  await updateTeamSharedState(teamId, { activeRobotId: robotId }, user.id);
  revalidatePath("/", "layout");
  redirect(returnTo.startsWith("/") ? returnTo : "/robots");
}
