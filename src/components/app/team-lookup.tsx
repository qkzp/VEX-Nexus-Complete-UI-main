"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { InlineSpinner, LoadingSkeleton } from "@/components/ui/loading-states";

type Team = {
  id: number;
  number: string;
  team_name?: string | null;
  robot_name?: string | null;
  organization?: string | null;
  grade?: string | null;
  location?: { city?: string | null; region?: string | null; country?: string | null } | null;
};

export function TeamLookup() {
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Search by exact team number. Results come from VEX Events when the server integration is configured.",
  );
  const requestRef = useRef<AbortController>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = query.trim().toUpperCase();
    if (!number) {
      setMessage("Enter an exact team number to search.");
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setTeams([]);
    setMessage("Loading official team record...");

    try {
      const response = await fetch(`/api/vex-events/teams?number=${encodeURIComponent(number)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== "ok") {
        setTeams([]);
        setMessage(payload.message || "Official team data is unavailable.");
        return;
      }

      const list = payload.data?.teams || [];
      setTeams(list);
      setMessage(
        list.length
          ? `Official record loaded from ${payload.source?.provider || "VEX Events"}.`
          : "No exact official team match returned.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setTeams([]);
      setMessage("Official team lookup is unavailable on this deployment.");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <section className="suite-panel team-lookup-panel" aria-busy={loading}>
      <div className="suite-panel-heading">
        <div>
          <span className="section-overline">Official team lookup</span>
          <h2>Team profile search</h2>
        </div>
        <ShieldCheck aria-hidden="true" size={18} />
      </div>
      <form className="event-search-row" onSubmit={lookup}>
        <label>
          <Search aria-hidden="true" size={15} />
          <span className="sr-only">Exact team number</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Team number"
            autoComplete="off"
          />
        </label>
        <button className="button button-primary" type="submit" disabled={loading || !query.trim()}>
          {loading ? <InlineSpinner /> : <Search aria-hidden="true" size={14} />}
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      <p className="source-status" role="status" aria-live="polite">{message}</p>
      <div className="team-result-grid">
        {loading
          ? Array.from({ length: 3 }, (_, index) => <LoadingSkeleton className="is-event-result" key={index} />)
          : null}
        {!loading
          ? teams.map((team) => (
              <article className="team-result-card" key={team.id}>
                <span>VEX EVENTS TEAM</span>
                <h3>{team.number}</h3>
                <strong>{team.team_name || "Team name unavailable"}</strong>
                <p>{team.robot_name ? `Robot: ${team.robot_name}` : "Robot name unavailable"}</p>
                <small>
                  {[team.organization, team.grade, team.location?.city, team.location?.region].filter(Boolean).join(" / ") ||
                    "Additional details unavailable"}
                </small>
              </article>
            ))
          : null}
        {!loading && !teams.length ? <div className="suite-empty">No team record loaded.</div> : null}
      </div>
    </section>
  );
}
