"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import {
  VEX_V5_MOTOR_CARTRIDGES,
  VEX_V5_SMART_PORTS,
  VEX_V5_WHEEL_OPTIONS,
  VEX_V5_TRANSMISSION_OPTIONS,
} from "@/lib/vex-hardware";
import {
  addMotorAction,
  createBuildLogAction,
  createNotebookEntryAction,
  createRobotAction,
  createTaskAction,
  updateRobotConfigurationAction,
  type WorkspaceActionState,
} from "@/lib/actions/workspace";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

const initialState: WorkspaceActionState = {};

function FormMessage({ state }: { state: WorkspaceActionState }) {
  if (state.error) return <p className="form-message is-error" role="alert">{state.error}</p>;
  if (state.success) return <p className="form-message is-success" role="status">{state.success}</p>;
  return null;
}

export function CreateRobotForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createRobotAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  useEffect(() => {
    if (state.entityId) router.push(`/robots/${state.entityId}`);
  }, [router, state.entityId]);

  return <form ref={formRef} action={formAction} className="create-robot-form structured-form" aria-busy={pending}>
    <input type="hidden" name="teamId" value={teamId} />
    <label>Robot name<input name="name" required minLength={2} maxLength={100} placeholder="" autoComplete="off" /></label>
    <label>Season or game <input name="seasonLabel" maxLength={80} autoComplete="off" /></label>
    <label className="field-wide">Working description<textarea name="description" maxLength={2000} rows={3} placeholder="" /></label>
    <FormMessage state={state} />
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <Plus size={16} />}{pending ? "Creating…" : "Create robot"}</button>
  </form>;
}

export function RobotConfigurationForm({ robotId, config }: { robotId: string; config: { drivetrainType: string | null; wheelDiameterIn: number | null; trackWidthIn: number | null; customProperties?: unknown } | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateRobotConfigurationAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  const custom = config?.customProperties && typeof config.customProperties === "object" && !Array.isArray(config.customProperties) ? config.customProperties as Record<string, unknown> : {};
  const transmission = custom.transmission && typeof custom.transmission === "object" && !Array.isArray(custom.transmission) ? custom.transmission as { type?: string; stages?: { driving?: number; driven?: number }[] } : {};
  const initialType = transmission.type || "DIRECT";
  const [type, setType] = useState(initialType);
  const family = VEX_V5_TRANSMISSION_OPTIONS.find((option) => option.value === type) ?? VEX_V5_TRANSMISSION_OPTIONS[0];
  const stages = transmission.stages ?? [];
  useEffect(() => { if (state.success) router.refresh(); }, [router, state.success]);
  return <form ref={formRef} action={formAction} className="structured-form compact-form drivetrain-config-form" aria-busy={pending}>
    <input type="hidden" name="robotId" value={robotId} />
    <label>Drivetrain
      <select name="drivetrainType" defaultValue={config?.drivetrainType || ""}>
        <option value="">Not recorded</option><option value="TANK">Tank</option><option value="ARCADE">Arcade / differential</option><option value="HOLONOMIC">Holonomic</option><option value="X_DRIVE">X-drive</option><option value="MECANUM">Mecanum</option><option value="CUSTOM">Custom</option>
      </select>
    </label>
    <label>Wheel diameter (in)<select name="wheelDiameterIn" defaultValue={config?.wheelDiameterIn ?? ""}><option value="">Not recorded</option>{VEX_V5_WHEEL_OPTIONS.map((wheel) => <option key={wheel.diameter} value={wheel.diameter}>{wheel.label}</option>)}</select></label>
    <label>Track width (in)<input name="trackWidthIn" type="number" min="0.01" max="72" step="0.01" defaultValue={config?.trackWidthIn ?? ""} placeholder="Measure your robot" /></label>
    <label>Transmission<select name="transmissionType" value={type} onChange={(event) => setType(event.target.value)}>{VEX_V5_TRANSMISSION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {type !== "DIRECT" ? <>
      <label>Stage 1 driving<select name="stage1Driving" defaultValue={stages[0]?.driving ?? ""}><option value="">Select</option>{family.teeth.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label>
      <label>Stage 1 driven<select name="stage1Driven" defaultValue={stages[0]?.driven ?? ""}><option value="">Select</option>{family.teeth.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label>
      <label>Stage 2 driving (optional)<select name="stage2Driving" defaultValue={stages[1]?.driving ?? ""}><option value="">None</option>{family.teeth.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label>
      <label>Stage 2 driven (optional)<select name="stage2Driven" defaultValue={stages[1]?.driven ?? ""}><option value="">None</option>{family.teeth.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label>
    </> : null}
    <p className="form-helper field-wide">Drive motor count and theoretical speed are derived from the motors saved on the V5 Brain. Tooth-count choices are limited to the selected VEX gear or chain family.</p>
    <FormMessage state={state} />
    <button className="button button-quiet" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <Save size={15} />}{pending ? "Saving…" : "Save configuration revision"}</button>
  </form>;
}

export function AddMotorForm({ robotId }: { robotId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addMotorAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [formRef, router, state.success]);
  return <form ref={formRef} action={formAction} className="hardware-add-form structured-form compact-form" aria-busy={pending}>
    <input type="hidden" name="robotId" value={robotId} />
    <label>Motor label<input name="label" required maxLength={80} placeholder="" /></label>
    <label>Smart port<select name="port" defaultValue="" required><option value="" disabled>Select port</option>{VEX_V5_SMART_PORTS.map((port) => <option key={port} value={port}>{port}</option>)}</select></label>
    <label>Cartridge<select name="cartridge" defaultValue="" required><option value="" disabled>Select cartridge</option>{VEX_V5_MOTOR_CARTRIDGES.map((cartridge) => <option key={cartridge.value} value={cartridge.value}>{cartridge.label}</option>)}</select></label>
    <label>Purpose<select name="purpose" defaultValue="" required><option value="" disabled>Select purpose</option><option value="DRIVE">Drive</option><option value="INTAKE">Intake</option><option value="LIFT">Lift</option><option value="ARM">Arm</option><option value="FLYWHEEL">Flywheel</option><option value="CONVEYOR">Conveyor</option><option value="CLIMBER">Climber</option><option value="ROLLER">Roller</option><option value="INDEXER">Indexer</option><option value="CUSTOM">Custom</option></select></label>
    <label className="checkbox-field"><input name="reversed" type="checkbox" /> Reversed</label>
    <FormMessage state={state} />
    <button className="button button-quiet" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <Plus size={15} />}{pending ? "Adding…" : "Add motor"}</button>
  </form>;
}

export function CreateTaskForm({ teamId, members, robots }: { teamId: string; members: { id: string; label: string }[]; robots: { id: string; name: string }[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [formRef, router, state.success]);
  return <form ref={formRef} action={formAction} className="task-create-form structured-form" aria-busy={pending}>
    <input type="hidden" name="teamId" value={teamId} />
    <label className="field-wide">Task title<input name="title" required maxLength={160} placeholder="What needs to happen?" /></label>
    <label>Description<textarea name="description" rows={2} maxLength={4000} placeholder="Context, acceptance criteria, or constraints." /></label>
    <label>Priority<select name="priority" defaultValue="MEDIUM"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></label>
    <label>Status<select name="status" defaultValue="BACKLOG"><option value="BACKLOG">Backlog</option><option value="DESIGNING">Designing</option><option value="BUILDING">Building</option><option value="TESTING">Testing</option><option value="READY">Ready</option><option value="COMPLETE">Complete</option></select></label>
    <label>Assignee<select name="assigneeId" defaultValue=""><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></label>
    <label>Robot<select name="robotId" defaultValue=""><option value="">No robot</option>{robots.map((robot) => <option key={robot.id} value={robot.id}>{robot.name}</option>)}</select></label>
    <label>Due date<input name="dueAt" type="date" /></label>
    <FormMessage state={state} />
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <Plus size={16} />}{pending ? "Creating…" : "Create task"}</button>
  </form>;
}

const today = () => new Date().toISOString().slice(0, 10);

export function NotebookEntryForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createNotebookEntryAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [formRef, router, state.success]);
  return <form ref={formRef} action={formAction} className="structured-form document-form" aria-busy={pending}>
    <input type="hidden" name="teamId" value={teamId} />
    <label>Entry title<input name="title" required maxLength={180} placeholder="What did the team work on?" /></label>
    <label>Date<input name="occurredOn" type="date" required defaultValue={today()} /></label>
    <label className="field-wide">Objective<textarea name="objective" rows={2} maxLength={4000} placeholder="State the intended outcome using team-provided facts." /></label>
    <label>Problem or constraint<textarea name="problem" rows={3} maxLength={4000} /></label>
    <label>Research<textarea name="research" rows={3} maxLength={8000} /></label>
    <label>Decision<textarea name="decision" rows={3} maxLength={4000} /></label>
    <label>Testing performed<textarea name="testing" rows={3} maxLength={4000} /></label>
    <label>Results<textarea name="results" rows={3} maxLength={4000} /></label>
    <label>Next steps<textarea name="nextSteps" rows={3} maxLength={4000} /></label>
    <FormMessage state={state} />
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <Save size={16} />}{pending ? "Saving…" : "Save notebook entry"}</button>
  </form>;
}

export function BuildLogEntryForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createBuildLogAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [formRef, router, state.success]);
  return <form ref={formRef} action={formAction} className="structured-form document-form" aria-busy={pending}>
    <input type="hidden" name="teamId" value={teamId} />
    <label>Entry title<input name="title" required maxLength={180} placeholder="What changed?" /></label>
    <label>Date<input name="occurredOn" type="date" required defaultValue={today()} /></label>
    <label className="field-wide">Summary<textarea name="summary" rows={3} maxLength={8000} placeholder="Describe the work without claiming measurements or tests that did not occur." /></label>
    <label>Reason for change<textarea name="reason" rows={3} maxLength={4000} /></label>
    <label>Testing performed<textarea name="testing" rows={3} maxLength={4000} /></label>
    <label>Results<textarea name="results" rows={3} maxLength={4000} /></label>
    <label>Next steps<textarea name="nextSteps" rows={3} maxLength={4000} /></label>
    <FormMessage state={state} />
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <Save size={16} />}{pending ? "Saving…" : "Save build log"}</button>
  </form>;
}
