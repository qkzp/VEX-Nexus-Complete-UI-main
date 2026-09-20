"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ui-state-page">
      <section className="ui-state-card">
        <div className="team-form-feedback is-error" role="alert">The workspace could not finish loading.</div>
        <h1>Something interrupted this page.</h1>
        <p>Your saved team data has not been replaced. Try the page again; if the problem continues, check the terminal running the local server.</p>
        <button className="button button-primary" type="button" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
