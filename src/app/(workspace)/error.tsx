"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="workspace-route-error" role="alert">
      <span className="workspace-route-error-icon" aria-hidden="true"><AlertTriangle /></span>
      <p className="page-kicker">Workspace interrupted</p>
      <h1>This section could not finish loading.</h1>
      <p>Your saved team data was not replaced. Retry this section without leaving the workspace.</p>
      <button className="button button-primary" type="button" onClick={reset}>
        <RotateCcw aria-hidden="true" size={15} /> Retry section
      </button>
    </section>
  );
}
