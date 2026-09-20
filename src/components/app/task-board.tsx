"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updateTaskStatusAction, type WorkspaceActionState } from "@/lib/actions/workspace";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

const initialState: WorkspaceActionState = {};
const statuses = ["BACKLOG", "DESIGNING", "BUILDING", "TESTING", "READY", "COMPLETE"] as const;

export function TaskStatusForm({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateTaskStatusAction, initialState);
  const formRef = useFormErrorFocus(state.error);
  useEffect(() => { if (state.success) router.refresh(); }, [router, state.success]);
  return <form ref={formRef} action={action} className="task-status-form" aria-busy={pending}>
    <input type="hidden" name="taskId" value={taskId} />
    <select name="status" defaultValue={status} aria-label="Task status">
      {statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ").toLowerCase()}</option>)}
    </select>
    <button className="button button-quiet" type="submit" disabled={pending}>{pending ? <InlineSpinner /> : <CheckCircle2 size={14} />}{pending ? "Saving…" : "Update"}</button>
    {state.error ? <small className="form-message is-error" role="alert">{state.error}</small> : null}
  </form>;
}
