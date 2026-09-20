import { InlineSpinner } from "@/components/ui/loading-states";

export default function Loading() {
  return (
    <main className="ui-state-page" aria-busy="true" aria-live="polite">
      <section className="ui-state-card">
        <InlineSpinner className="ui-state-spinner" />
        <h1>Loading BoltCanvas</h1>
        <p>Opening the current workspace and its saved team data.</p>
      </section>
    </main>
  );
}
