import { ExternalLink, Search, ShieldCheck, Trophy } from "lucide-react";
import { VEX_EVENTS_PUBLIC_STANDINGS_URL, type VexEventsSkillsRecord, type VexEventsTeam } from "@/lib/services/vex-events";

type Props = { teamNumber: string; team: VexEventsTeam | null; skills: VexEventsSkillsRecord[]; sourceFetchedAt: string; message: string };

function safeOfficialMessage(message: string) {
  return message.includes("VEX_EVENTS_")
    ? "Official VEX Events data is unavailable on this deployment right now."
    : message;
}

export function SkillsStandings({ teamNumber, team, skills, sourceFetchedAt, message }: Props) {
  const byType = new Map<string, number>();
  for (const row of skills) {
    const type = (row.type || "Unlabeled skills").trim();
    if (typeof row.score !== "number") continue;
    byType.set(type, Math.max(byType.get(type) ?? Number.NEGATIVE_INFINITY, row.score));
  }
  const best = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const visibleMessage = safeOfficialMessage(message);

  return (
    <section className="workspace-page rankings-page">
      <header className="rankings-header">
        <div>
          <div className="rankings-status-row">
            <span className="live-source-chip">
              <i /> OFFICIAL VEX SOURCE
            </span>
            <span className="season-chip">2026-27 · Override</span>
          </div>
          <p className="page-kicker">VEX Events · World Skills</p>
          <h1>Use official records without inventing a rank.</h1>
          <p>World Skills ordering stays on VEX Events. PitRelay shows official team metadata and raw skills records only when the VEX Events API returns them.</p>
        </div>
        <a href={VEX_EVENTS_PUBLIC_STANDINGS_URL} target="_blank" rel="noreferrer" className="button button-primary button-large">
          Open official leaderboard <ExternalLink size={15} />
        </a>
      </header>

      <div className="rankings-summary-grid">
        <article>
          <Trophy size={18} />
          <div>
            <span>World ranking source</span>
            <strong>VEX Events</strong>
            <small>No locally reconstructed global rank</small>
          </div>
        </article>
        <article>
          <ShieldCheck size={18} />
          <div>
            <span>My team</span>
            <strong>{teamNumber || "No team number saved"}</strong>
            <small>{sourceFetchedAt ? `API fetched ${new Date(sourceFetchedAt).toLocaleString()}` : "Official API when configured"}</small>
          </div>
        </article>
        <article>
          <ShieldCheck size={18} />
          <div>
            <span>Integrity</span>
            <strong>Unknown stays unknown</strong>
            <small>No guessed tie-breaks, region rank, or world position</small>
          </div>
        </article>
      </div>

      <section className="suite-panel">
        <div className="suite-panel-heading">
          <div>
            <span className="section-overline">My team · official API</span>
            <h2>{team ? `${team.number}${team.team_name ? ` · ${team.team_name}` : ""}` : teamNumber ? "Official record unavailable" : "Save a VEX team number in Team Settings"}</h2>
          </div>
        </div>
        {visibleMessage ? <p className="form-message is-error">{visibleMessage}</p> : null}
        {team ? (
          <div className="official-team-profile">
            <div>
              <span>Robot</span>
              <strong>{team.robot_name || "Not returned"}</strong>
            </div>
            <div>
              <span>Organization</span>
              <strong>{team.organization || "Not returned"}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{[team.location?.city, team.location?.region, team.location?.country].filter(Boolean).join(", ") || "Not returned"}</strong>
            </div>
            <div>
              <span>Official team ID</span>
              <strong>{team.id}</strong>
            </div>
          </div>
        ) : null}
        <div className="skills-record-grid">
          {best.map(([type, score]) => (
            <article key={type}>
              <span>{type}</span>
              <strong>{score}</strong>
              <small>Highest score among returned official records</small>
            </article>
          ))}
          {team && !best.length ? <div className="suite-empty">No current-season skills records were returned for this team. PitRelay does not substitute a score.</div> : null}
        </div>
      </section>

      <section className="suite-panel official-skills-explainer">
        <div className="suite-panel-heading">
          <div>
            <span className="section-overline">World standings</span>
            <h2>Keep the official table authoritative.</h2>
          </div>
          <Search size={18} />
        </div>
        <div className="official-standings-cta">
          <div>
            <ShieldCheck size={20} />
            <span>
              <strong>No blocked iframe, no stale snapshot, no guessed global ordering.</strong>
              <small>Current world position, filters, tie-breaks, and official ordering stay on VEX Events.</small>
            </span>
          </div>
          <a href={VEX_EVENTS_PUBLIC_STANDINGS_URL} target="_blank" rel="noreferrer" className="button button-primary">
            View current World Skills <ExternalLink size={14} />
          </a>
        </div>
      </section>

      <div className="rankings-integrity-note">
        <ShieldCheck size={17} />
        <p><strong>Data boundary:</strong> competition data is labeled official only when it comes from a VEX-owned source. Team-entered scouting and analysis are kept separate.</p>
      </div>
    </section>
  );
}
