"use client";

import Link from "next/link";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ui-state-page">
      <section className="ui-state-card" role="alert">
        <p className="form-message is-error">BoltCanvas account access was interrupted.</p>
        <h1>The account page could not load.</h1>
        <p>Retry the page, or return to sign in without changing any saved account data.</p>
        <div className="ui-state-actions">
          <button className="button button-primary" type="button" onClick={reset}>Try again</button>
          <Link className="button button-secondary" href="/login">Return to sign in</Link>
        </div>
      </section>
    </main>
  );
}
