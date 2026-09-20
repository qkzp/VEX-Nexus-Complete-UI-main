"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { configureBrainPortAction, type WorkspaceActionState } from "@/lib/actions/workspace";
import {
  VEX_V5_MOTOR_CARTRIDGES,
  VEX_V5_SMART_DEVICE_OPTIONS,
  VEX_V5_SMART_PORTS,
  VEX_V5_THREE_WIRE_DEVICE_OPTIONS,
  VEX_V5_THREE_WIRE_PORTS,
} from "@/lib/vex-hardware";

type SmartAssignment = {
  device: string;
  label?: string;
  cartridge?: string;
  purpose?: string;
  reversed?: boolean;
};

type Props = {
  robotId: string;
  smartAssignments: Record<string, SmartAssignment>;
  threeWireAssignments: Record<string, { device: string; label?: string }>;
};

const initialState: WorkspaceActionState = {};
const motorPurposes = ["DRIVE", "INTAKE", "LIFT", "ARM", "FLYWHEEL", "CONVEYOR", "CLIMBER", "ROLLER", "INDEXER", "CUSTOM"] as const;

function usePortAutosave(pending: boolean) {
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pendingRef = useRef(pending);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => () => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
  }, []);

  function submitWhenReady() {
    saveTimerRef.current = null;
    const form = formRef.current;
    if (!form?.checkValidity()) return;

    if (pendingRef.current) {
      saveTimerRef.current = window.setTimeout(submitWhenReady, 180);
      return;
    }

    setDirty(false);
    form.requestSubmit();
  }

  function scheduleAutosave() {
    setDirty(true);
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(submitWhenReady, 420);
  }

  function flushAutosave() {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    submitWhenReady();
  }

  return { dirty, flushAutosave, formRef, scheduleAutosave };
}

function PortAutosaveStatus({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  const label = pending ? "Saving port assignment" : dirty ? "Port changes waiting to save" : "Port assignment saved";

  return (
    <span className="v5-port-autosave" title={label} role="status">
      {pending ? <LoaderCircle aria-hidden="true" size={12} className="spin" /> : <Check aria-hidden="true" size={12} />}
      {pending || dirty ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

function SmartPortEditor({ robotId, port, initial, action, pending }: { robotId: string; port: number; initial?: SmartAssignment; action: (payload: FormData) => void; pending: boolean }) {
  const [device, setDevice] = useState(initial?.device ?? "");
  const { dirty, flushAutosave, formRef, scheduleAutosave } = usePortAutosave(pending);

  return <form ref={formRef} action={action} onChange={scheduleAutosave} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) flushAutosave(); }} className={`v5-port-editor ${device ? "is-assigned" : ""}`}>
    <input type="hidden" name="robotId" value={robotId} />
    <input type="hidden" name="portKind" value="smart" />
    <input type="hidden" name="port" value={port} />
    <span className="v5-port-number">{port}</span>
    <select name="device" value={device} onChange={(event) => setDevice(event.target.value)} aria-label={`Smart Port ${port} device`}>
      {VEX_V5_SMART_DEVICE_OPTIONS.map((option) => <option key={option.value || "unused"} value={option.value}>{option.label}</option>)}
    </select>
    {device ? <input className="v5-port-label" name="label" defaultValue={initial?.label ?? ""} aria-label={`Smart Port ${port} custom device name`} placeholder="Name this device" /> : null}
    {device === "motor_11w" || device === "motor_5_5w" ? <div className="v5-port-details">
      {device === "motor_11w" ? <select name="cartridge" defaultValue={initial?.cartridge ?? ""} required aria-label={`Smart Port ${port} 11W motor cartridge`}>
        <option value="" disabled>Cartridge</option>
        {VEX_V5_MOTOR_CARTRIDGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select> : <span className="v5-fixed-motor-speed" aria-label={`Smart Port ${port} fixed motor speed`}>Fixed 200 RPM</span>}
      <select name="purpose" defaultValue={initial?.purpose ?? ""} required aria-label={`Smart Port ${port} motor purpose`}>
        <option value="" disabled>Purpose</option>
        {motorPurposes.map((purpose) => <option key={purpose} value={purpose}>{purpose.charAt(0) + purpose.slice(1).toLowerCase()}</option>)}
      </select>
      <label className="v5-port-reversed"><input type="checkbox" name="reversed" defaultChecked={initial?.reversed ?? false} /> Reversed</label>
    </div> : null}
    <button type="submit" className="sr-only" tabIndex={-1}>Save</button>
    <PortAutosaveStatus dirty={dirty} />
  </form>;
}

function ThreeWirePortEditor({ robotId, port, initial, action, pending }: { robotId: string; port: string; initial?: { device: string; label?: string }; action: (payload: FormData) => void; pending: boolean }) {
  const [device, setDevice] = useState(initial?.device ?? "");
  const { dirty, flushAutosave, formRef, scheduleAutosave } = usePortAutosave(pending);

  return <form ref={formRef} action={action} onChange={scheduleAutosave} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) flushAutosave(); }} className={`v5-port-editor three-wire ${device ? "is-assigned" : ""}`}>
    <input type="hidden" name="robotId" value={robotId} />
    <input type="hidden" name="portKind" value="threeWire" />
    <input type="hidden" name="port" value={port} />
    <span className="v5-port-number">{port}</span>
    <select name="device" value={device} onChange={(event) => setDevice(event.target.value)} aria-label={`3-Wire Port ${port} device`}>
      {VEX_V5_THREE_WIRE_DEVICE_OPTIONS.map((option) => <option key={option.value || "unused"} value={option.value}>{option.label}</option>)}
    </select>
    {device ? <input className="v5-port-label" name="label" defaultValue={initial?.label ?? ""} aria-label={`3-Wire Port ${port} custom device name`} placeholder="Name this device" /> : null}
    <button type="submit" className="sr-only" tabIndex={-1}>Save</button>
    <PortAutosaveStatus dirty={dirty} />
  </form>;
}

export function BrainPortConfigurator({ robotId, smartAssignments, threeWireAssignments }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(configureBrainPortAction, initialState);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return <section className="v5-brain-workspace" aria-label="V5 Robot Brain port configuration">
    <div className="v5-brain-face">
      <div className="v5-brain-photo-panel">
        <div className="v5-brain-photo-frame">
          <Image src="/v5-brain-photo.jpg" alt="VEX V5 Robot Brain" width={1024} height={819} priority={false} />
        </div>
        <div className="v5-brain-photo-copy">
          <span>Official V5 Brain reference</span>
          <strong>Use the real port layout as you assign devices.</strong>
          <small>Smart ports 1-21 plus built-in 3-wire ports A-H.</small>
        </div>
      </div>
      <div className="v5-brain-section">
        <header><strong>Smart Ports</strong><span>1-21</span></header>
        <div className="v5-smart-port-grid">
          {VEX_V5_SMART_PORTS.map((port) => <SmartPortEditor key={port} robotId={robotId} port={port} initial={smartAssignments[String(port)]} action={action} pending={pending} />)}
        </div>
      </div>
      <div className="v5-brain-section three-wire-section">
        <header><strong>3-Wire Ports</strong><span>A-H</span></header>
        <div className="v5-three-wire-grid">
          {VEX_V5_THREE_WIRE_PORTS.map((port) => <ThreeWirePortEditor key={port} robotId={robotId} port={port} initial={threeWireAssignments[port]} action={action} pending={pending} />)}
        </div>
      </div>
    </div>
    {state.error ? <p className="form-message is-error" role="alert">{state.error}</p> : null}
    {state.success ? <p className="form-message is-success" role="status">{state.success}</p> : null}
    <p className="v5-hardware-source-note">Hardware choices are constrained to official VEX listings. <a href="https://www.vexrobotics.com/276-4810.html" target="_blank" rel="noreferrer">V5 Brain</a> | <a href="https://www.vexrobotics.com/gears.html" target="_blank" rel="noreferrer">Gears</a> | <a href="https://www.vexrobotics.com/wheels.html" target="_blank" rel="noreferrer">Wheels</a> | <a href="https://www.vexrobotics.com/276-4840.html" target="_blank" rel="noreferrer">11W motor</a> | <a href="https://www.vexrobotics.com/276-4842.html" target="_blank" rel="noreferrer">5.5W motor</a>. The 5.5W motor is fixed-speed and does not use 11W gear cartridges. No connection state is inferred from software.</p>
  </section>;
}
