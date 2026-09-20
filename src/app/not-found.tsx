import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ui-state-page">
      <section className="ui-state-card">
        <p className="page-kicker">404 · BoltCanvas</p>
        <h1>That workspace page does not exist.</h1>
        <p>Use the command center to return to a valid tool or team workspace.</p>
        <Link className="button button-primary" href="/app/dashboard">Open command center</Link>
      </section>
    </main>
  );
}
