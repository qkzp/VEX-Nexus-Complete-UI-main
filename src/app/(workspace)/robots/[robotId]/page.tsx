import Link from "next/link";
import { AlertTriangle, ArrowLeft, Cpu, Gauge } from "lucide-react";
import { RobotConfigurationForm } from "@/components/app/workspace-forms";
import { setActiveRobotAction } from "@/lib/actions/workspace";
import { BrainPortConfigurator } from "@/components/app/brain-port-configurator";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { detectPortConflicts, type PortAssignment } from "@/lib/robot-engine";
import { getWorkspaceTeam, hasTeamPermission, requireRobotReadAccess } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type PageProps = { params: Promise<{ robotId: string }> };

export default async function RobotDetailPage({ params }: PageProps) {
  const { robotId } = await params;
  const user = await requireCompletedOnboarding(`/robots/${robotId}`);
  await requireRobotReadAccess(user.id, robotId);
  const robot = await prisma.robot.findUniqueOrThrow({
    where: { id: robotId },
    include: { team: { select: { id: true, name: true, teamNumber: true } }, configuration: { include: { motors: { orderBy: { port: "asc" } }, sensors: { orderBy: { label: "asc" } }, pneumatics: { orderBy: { label: "asc" } } } } },
  });
  const workspace = robot.teamId ? await getWorkspaceTeam(user.id, robot.teamId) : { team: null, teams: [] };
  const shared = robot.teamId ? await getTeamSharedState(robot.teamId) : { activeRobotId: null, selectedEventId: null, state: {}, updatedAt: null };
  const canEdit = robot.ownerId === user.id || Boolean(workspace.team && hasTeamPermission(workspace.team.permission, "TEAM_LEAD"));
  const config = robot.configuration;
  const portAssignments: PortAssignment[] = [];
  for (const motor of config?.motors ?? []) {
    portAssignments.push({ kind: "smart", port: motor.port, deviceName: motor.label });
  }
  for (const sensor of config?.sensors ?? []) {
    if (sensor.smartPort) {
      portAssignments.push({ kind: "smart", port: sensor.smartPort, deviceName: sensor.label });
    } else if (sensor.threeWirePort) {
      portAssignments.push({ kind: "three-wire", port: sensor.threeWirePort, deviceName: sensor.label });
    }
  }
  for (const pneumatic of config?.pneumatics ?? []) {
    portAssignments.push({ kind: "three-wire", port: pneumatic.threeWirePort, deviceName: pneumatic.label });
  }
  const conflicts = detectPortConflicts(portAssignments);
  const deviceCount = portAssignments.length;
  const smartAssignments: Record<string, { device: string; cartridge?: string; purpose?: string; reversed?: boolean; label?: string }> = {};
  const threeWireAssignments: Record<string, { device: string; label?: string }> = {};
  for (const motor of config?.motors ?? []) {
    const is55w = motor.cartridge === "CUSTOM" && motor.customRpm === 200;
    smartAssignments[String(motor.port)] = { device: is55w ? "motor_5_5w" : "motor_11w", cartridge: is55w ? undefined : motor.cartridge, purpose: motor.purpose, reversed: motor.reversed, label: motor.label };
  }
  const smartTypeFallback: Record<string, string> = { INERTIAL: "inertial", ROTATION: "rotation", OPTICAL: "optical", DISTANCE: "distance", GPS: "gps", VISION: "vision" };
  const threeWireTypeFallback: Record<string, string> = { BUMPER: "bumper", LIMIT_SWITCH: "limit", SONAR: "ultrasonic", ENCODER: "optical_encoder", ADI_ENCODER: "optical_encoder", DIGITAL_IN: "jumper", DIGITAL_OUT: "led_indicator", ANALOG_IN: "potentiometer" };
  for (const sensor of config?.sensors ?? []) {
    const metadata = sensor.configuration && typeof sensor.configuration === "object" && !Array.isArray(sensor.configuration) ? sensor.configuration as Record<string, unknown> : null;
    const officialKey = typeof metadata?.officialDeviceKey === "string" ? metadata.officialDeviceKey : null;
    if (sensor.smartPort) smartAssignments[String(sensor.smartPort)] = { device: officialKey || smartTypeFallback[sensor.type] || "", label: sensor.label };
    if (sensor.threeWirePort) threeWireAssignments[sensor.threeWirePort] = { device: officialKey || threeWireTypeFallback[sensor.type] || "", label: sensor.label };
  }
  for (const pneumatic of config?.pneumatics ?? []) threeWireAssignments[pneumatic.threeWirePort] = { device: "pneumatic_solenoid", label: pneumatic.label };

  const motorWatts = (config?.motors ?? []).reduce((sum, motor) => sum + (motor.cartridge === "CUSTOM" && motor.customRpm === 200 ? 5.5 : 11), 0);
  const driveWatts = (config?.motors ?? []).filter((motor) => motor.purpose === "DRIVE").reduce((sum, motor) => sum + (motor.cartridge === "CUSTOM" && motor.customRpm === 200 ? 5.5 : 11), 0);
  const revisions = config ? await prisma.auditLog.findMany({ where: { targetType: "RobotConfiguration", targetId: config.id, action: "robot.configuration.revision" }, orderBy: { createdAt: "desc" }, take: 8 }) : [];

  return <section className="workspace-page robot-detail-page">
    <Link href="/robots" className="back-link"><ArrowLeft size={15} /> All robots</Link>
    <header className="robot-detail-header"><div><span className="page-kicker">{robot.team?.teamNumber ? `${robot.team.teamNumber} · ` : ""}Robot profile</span><h1>{robot.name}</h1><p>{robot.description || "No working description saved yet."}</p></div><div className="robot-detail-status"><span>{shared.activeRobotId === robot.id ? "Active competition robot" : robot.status.toLowerCase()}</span><strong>{deviceCount} saved hardware item{deviceCount === 1 ? "" : "s"}</strong>{robot.teamId && canEdit && shared.activeRobotId !== robot.id ? <form action={setActiveRobotAction}><input type="hidden" name="teamId" value={robot.teamId} /><input type="hidden" name="robotId" value={robot.id} /><input type="hidden" name="returnTo" value={`/robots/${robot.id}`} /><PendingSubmitButton className="button button-quiet" pendingLabel="Setting active...">Set active robot</PendingSubmitButton></form> : null}</div></header>


    {canEdit ? <section className="brain-config-panel"><div className="section-line"><div><span className="section-overline">V5 Robot Brain</span><h2>Configure every Brain port</h2></div><span className={conflicts.length ? "signal danger" : "signal neutral"}>{conflicts.length ? "Resolve conflicts" : "21 Smart · 8 3-Wire"}</span></div><p className="brain-config-intro">Select the device physically connected to each port. 11W motor ports require the actual cartridge and purpose; 5.5W motors are recorded as fixed-speed. Nothing is prefilled.</p><BrainPortConfigurator robotId={robot.id} smartAssignments={smartAssignments} threeWireAssignments={threeWireAssignments} /></section> : null}

    <div className="robot-detail-grid">
      <section className="robot-canvas-panel"><div className="section-line"><div><span className="section-overline">Configuration map</span><h2>Saved hardware</h2></div><span className={conflicts.length ? "signal danger" : "signal neutral"}>{conflicts.length ? `${conflicts.length} port conflict${conflicts.length === 1 ? "" : "s"}` : "No duplicate ports found"}</span></div>
        {deviceCount ? <div className="hardware-ledger"><div className="hardware-ledger-header"><span>Port</span><span>Device</span><span>Type</span><span>Detail</span></div>
          {config?.motors.map((motor) => { const is55w = motor.cartridge === "CUSTOM" && motor.customRpm === 200; const motorSpec = is55w ? "5.5W · fixed 200 RPM" : `11W · ${motor.cartridge.replace("RPM_", "")} RPM`; return <div key={motor.id} className="hardware-ledger-row"><span>P{motor.port}</span><span>{motor.label}</span><span>Motor</span><span>{motorSpec} · {motor.purpose.toLowerCase()}{motor.reversed ? " · reversed" : ""}</span></div>; })}
          {config?.sensors.map((sensor) => <div key={sensor.id} className="hardware-ledger-row"><span>{sensor.smartPort ? `P${sensor.smartPort}` : sensor.threeWirePort || "—"}</span><span>{sensor.label}</span><span>Sensor</span><span>{sensor.type.replaceAll("_", " ").toLowerCase()}</span></div>)}
          {config?.pneumatics.map((pneumatic) => <div key={pneumatic.id} className="hardware-ledger-row"><span>{pneumatic.threeWirePort}</span><span>{pneumatic.label}</span><span>Pneumatic</span><span>{pneumatic.controlType.replaceAll("_", " ").toLowerCase()}</span></div>)}
        </div> : <div className="compact-empty"><Cpu size={20} /><p>No motors, sensors, or pneumatics have been saved to this robot profile.</p></div>}
        {conflicts.length ? <div className="configuration-warning"><AlertTriangle size={17} /><div><strong>Resolve port conflicts before generating code.</strong>{conflicts.map((conflict) => <p key={`${conflict.kind}-${conflict.port}`}>{String(conflict.port)} is assigned to {conflict.assignments.map((assignment) => assignment.deviceName).join(", ")}.</p>)}</div></div> : null}
      </section>

      <aside className="robot-inspector"><div className="section-line"><div><span className="section-overline">Engineering inspector</span><h2>Drivetrain & evidence</h2></div><Gauge size={18} /></div>
        <dl className="facts-list"><div><dt>Drivetrain</dt><dd>{config?.drivetrainType?.replaceAll("_", " ") || "Not recorded"}</dd></div><div><dt>Drive motors</dt><dd>{config?.motors.filter((motor) => motor.purpose === "DRIVE").length || "Not recorded"}</dd></div><div><dt>Wheel diameter</dt><dd>{config?.wheelDiameterIn ? `${config.wheelDiameterIn} in` : "Not recorded"}</dd></div><div><dt>External reduction</dt><dd>{config?.externalGearRatio ? `${config.externalGearRatio.toFixed(3)}:1` : "Not recorded"}</dd></div><div><dt>Calculated speed</dt><dd>{config?.theoreticalSpeedFtPerSec ? `${config.theoreticalSpeedFtPerSec.toFixed(2)} ft/s ideal` : "Not calculated"}</dd></div><div><dt>Configuration revision</dt><dd>{config ? `v${config.configurationVersion}` : "Not configured"}</dd></div></dl>
        <div className="motor-legality"><div><span>Total motor power</span><strong>{motorWatts.toFixed(1)}W / 88W</strong><progress max={88} value={Math.min(88, motorWatts)} /></div><div><span>Drive-purpose motor power</span><strong>{driveWatts.toFixed(1)}W / 55W</strong><progress max={55} value={Math.min(55, driveWatts)} /></div><p>The 88W total limit is a direct Override rule. The 55W display uses motors marked <b>Drive</b> as a practical pre-inspection check; actual Subsystem 2 interpretation is controlled by the current Game Manual and inspection.</p></div>
        {canEdit ? <RobotConfigurationForm robotId={robot.id} config={config} /> : <p className="read-only-note">You can view this robot, but only a team lead, administrator, or owner can change its configuration.</p>}
        <div className="telemetry-ready"><span className="section-overline">Future live telemetry</span><p>V5 Smart Motors can report temperature, current, power, torque, efficiency, position, and velocity. PitRelay does not invent these readings; they remain unavailable until a real hardware connection is added.</p></div>
        <div className="revision-list"><span className="section-overline">Recent configuration revisions</span>{revisions.length ? revisions.map((revision) => <div key={revision.id}><strong>{revision.createdAt.toLocaleString()}</strong><small>Saved configuration change</small></div>) : <p>No revisions recorded yet.</p>}</div>
      </aside>
    </div>

  </section>;
}
