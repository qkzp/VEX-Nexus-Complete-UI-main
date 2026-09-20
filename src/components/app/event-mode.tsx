"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { VEX_OVERRIDE } from "@/lib/vex-official";
import { flushPendingTeamSection, saveTeamSection, type SyncStatus } from "@/lib/client/team-sync";
import { InlineSpinner, LoadingSkeleton } from "@/components/ui/loading-states";

type Division = { id: number; name?: string | null; code?: string | null };
type OfficialEvent = { id: number; sku?: string | null; name?: string | null; start?: string | null; end?: string | null; event_region?: string | null; location?: { venue?: string | null; city?: string | null; region?: string | null; country?: string | null } | null; divisions?: Division[] | null };
type OfficialTeam = { number?: string | null; team_name?: string | null };
type OfficialMatch = { id: number; round?: number | null; instance?: number | null; matchnum?: number | null; scheduled?: string | null; started?: string | null; scored?: string | null; division?: Division | null; alliances?: { color?: string | null; score?: number | null; teams?: { team?: OfficialTeam | null; sitting?: boolean | null }[] | null }[] | null };
type OfficialRanking = { rank?: number | null; team?: OfficialTeam | null; wins?: number | null; losses?: number | null; ties?: number | null };
type ApiSuccess<T> = { status: "ok"; data: T; source?: { fetchedAt?: string; cache?: string } };
type ApiFailure = { status?: string; message?: string; code?: string };
type EventState = { selectedEvent?: OfficialEvent | null; divisionId?: number | null; queueNote?: string; strategyNote?: string; cachedMatches?: OfficialMatch[]; cachedRankings?: OfficialRanking[]; officialFetchedAt?: string | null };

const PUBLIC_EVENTS_URL = "https://events.vex.com/robot-competitions/vex-robotics-competition";

function safeOfficialMessage(message: string) {
  return message.includes("VEX_EVENTS_")
    ? "Official VEX Events data is unavailable on this deployment right now."
    : message;
}

function matchLabel(match: OfficialMatch) {
  const round = Number(match.round);
  const prefix = round === 2 ? "Q" : round === 3 ? "R16" : round === 4 ? "QF" : round === 5 ? "SF" : round === 6 ? "F" : round ? `R${round}` : "M";
  return `${prefix}${match.matchnum ?? "?"}`;
}

function dateTime(value?: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function eventPlace(event: OfficialEvent) {
  return [event.location?.venue, event.location?.city, event.location?.region].filter(Boolean).join(" · ") || "Location unavailable";
}

function teamNumbers(match: OfficialMatch, color: string) {
  return match.alliances?.find((alliance) => alliance.color?.toLowerCase() === color)?.teams?.map((row) => row.team?.number).filter((value): value is string => Boolean(value)) ?? [];
}

type EventModeProps = {
  teamId: string;
  teamNumber: string;
  initialState: Record<string, unknown>;
  selectedEventId: number | null;
  officialConfigured: boolean;
  officialMessage: string;
};

export function EventMode({
  teamId,
  teamNumber,
  initialState,
  selectedEventId,
  officialConfigured,
  officialMessage,
}: EventModeProps) {
  const parsed = initialState as EventState;
  const [state, setState] = useState<EventState>({
    selectedEvent: parsed.selectedEvent ?? null,
    divisionId: parsed.divisionId ?? null,
    queueNote: parsed.queueNote ?? "",
    strategyNote: parsed.strategyNote ?? "",
    cachedMatches: Array.isArray(parsed.cachedMatches) ? parsed.cachedMatches : [],
    cachedRankings: Array.isArray(parsed.cachedRankings) ? parsed.cachedRankings : [],
    officialFetchedAt: parsed.officialFetchedAt ?? null,
  });
  const [sync, setSync] = useState<SyncStatus>("saved");
  const [region, setRegion] = useState("");
  const [events, setEvents] = useState<OfficialEvent[]>([]);
  const [matches, setMatches] = useState<OfficialMatch[]>(Array.isArray(parsed.cachedMatches) ? parsed.cachedMatches : []);
  const [rankings, setRankings] = useState<OfficialRanking[]>(Array.isArray(parsed.cachedRankings) ? parsed.cachedRankings : []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selected = state.selectedEvent && (!selectedEventId || state.selectedEvent.id === selectedEventId) ? state.selectedEvent : null;
  const unavailableMessage = safeOfficialMessage(officialMessage);

  useEffect(() => {
    void flushPendingTeamSection(teamId, "eventMode").then((result) => result && setSync(result));
  }, [teamId]);

  async function persist(next: EventState, eventId?: number | null) {
    setState(next);
    setSync("saving");
    const save = saveTeamSection(teamId, "eventMode", next).then(setSync);
    if (eventId !== undefined) {
      await fetch("/api/team-workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, selectedEventId: eventId }),
      }).catch(() => undefined);
    }
    await save;
  }

  async function searchEvents() {
    if (!officialConfigured) {
      setEvents([]);
      setMessage(unavailableMessage);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const query = new URLSearchParams({ seasonId: String(VEX_OVERRIDE.seasonId), perPage: "100" });
      if (region.trim()) query.set("region", region.trim());
      const response = await fetch(`/api/vex-events/events?${query.toString()}`, { cache: "no-store" });
      const body = await response.json() as ApiSuccess<{ events: OfficialEvent[] }> | ApiFailure;
      if (!response.ok || body.status !== "ok") throw new Error((body as ApiFailure).message || "Official VEX Events data is unavailable.");
      const success = body as ApiSuccess<{ events: OfficialEvent[] }>;
      setEvents(success.data.events ?? []);
      if (!(success.data.events ?? []).length) setMessage("No official Override events matched that region filter.");
    } catch (error) {
      setMessage(error instanceof Error ? safeOfficialMessage(error.message) : "Official VEX Events data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function selectEvent(event: OfficialEvent) {
    const divisionId = event.divisions?.[0]?.id ?? null;
    setMatches([]);
    setRankings([]);
    setMessage("");
    await persist({ ...state, selectedEvent: event, divisionId }, event.id);
    if (divisionId && officialConfigured) await loadOfficialData(event, divisionId);
  }

  async function loadOfficialData(event: OfficialEvent, divisionId: number | null | undefined) {
    if (!officialConfigured) {
      setMessage(unavailableMessage);
      return;
    }
    if (!divisionId) {
      setMessage("VEX Events has not returned a division for this event yet.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const [matchResponse, rankingResponse] = await Promise.all([
        fetch(`/api/vex-events/matches?eventId=${event.id}&divisionId=${divisionId}`, { cache: "no-store" }),
        fetch(`/api/vex-events/rankings?scope=event&eventId=${event.id}&divisionId=${divisionId}`, { cache: "no-store" }),
      ]);
      const matchBody = await matchResponse.json() as ApiSuccess<{ matches: OfficialMatch[] }> | ApiFailure;
      const rankingBody = await rankingResponse.json() as ApiSuccess<{ rankings: OfficialRanking[] }> | ApiFailure;
      const nextMatches = matchResponse.ok && matchBody.status === "ok" ? ((matchBody as ApiSuccess<{ matches: OfficialMatch[] }>).data.matches ?? []) : matches;
      const nextRankings = rankingResponse.ok && rankingBody.status === "ok" ? ((rankingBody as ApiSuccess<{ rankings: OfficialRanking[] }>).data.rankings ?? []) : rankings;
      if (matchResponse.ok && matchBody.status === "ok") setMatches(nextMatches);
      else setMessage(safeOfficialMessage((matchBody as ApiFailure).message || "Match schedule is unavailable; showing the last cached schedule if available."));
      if (rankingResponse.ok && rankingBody.status === "ok") setRankings(nextRankings);
      if ((matchResponse.ok && matchBody.status === "ok") || (rankingResponse.ok && rankingBody.status === "ok")) {
        const officialFetchedAt = new Date().toISOString();
        await persist({ ...state, selectedEvent: event, divisionId, cachedMatches: nextMatches, cachedRankings: nextRankings, officialFetchedAt });
      }
    } catch {
      setMessage("Official event data could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  }

  const teamMatches = useMemo(() => {
    if (!teamNumber.trim()) return [];
    const needle = teamNumber.trim().toUpperCase();
    return matches
      .filter((match) => [...teamNumbers(match, "red"), ...teamNumbers(match, "blue")].some((number) => number.toUpperCase() === needle))
      .sort((left, right) => new Date(left.scheduled || 0).getTime() - new Date(right.scheduled || 0).getTime());
  }, [matches, teamNumber]);
  const nextMatch = teamMatches.find((match) => !match.started) ?? teamMatches[0] ?? null;
  const myRanking = rankings.find((row) => row.team?.number?.toUpperCase() === teamNumber.trim().toUpperCase()) ?? null;

  return (
    <section className="workspace-page suite-page" aria-busy={loading}>
      <header className="suite-hero compact">
        <div>
          <div className="suite-badges">
            <span className={officialConfigured ? "official-badge" : "status-chip warn"}>
              <ShieldCheck size={13} /> {officialConfigured ? "OFFICIAL VEX EVENTS DATA" : "OFFICIAL DATA UNAVAILABLE"}
            </span>
            <span className={`status-chip ${sync === "saved" ? "good" : "neutral"}`}>
              {sync === "saved" ? "Team notes shared" : sync === "saving" ? "Saving..." : "Offline cache"}
            </span>
          </div>
          <p className="page-kicker">Event Mode</p>
          <h1>Select the real event once. Stop retyping the schedule.</h1>
          <p>Schedules, alliances, rankings, and scores come from VEX Events when the server API is configured. Only your queue and strategy notes are team-entered.</p>
        </div>
        <a className="button button-quiet" href={PUBLIC_EVENTS_URL} target="_blank" rel="noreferrer">
          Open VEX Events <ExternalLink size={14} />
        </a>
      </header>

      {!officialConfigured ? (
        <section className="suite-panel official-status-panel">
          <div>
            <span className="section-overline">Official event feed</span>
            <h2>Live VEX event search is unavailable on this deployment.</h2>
            <p>{unavailableMessage}</p>
          </div>
          <a className="button button-quiet" href={PUBLIC_EVENTS_URL} target="_blank" rel="noreferrer">
            Use the public VEX Events site <ExternalLink size={14} />
          </a>
        </section>
      ) : null}

      {!selected ? (
        <section className="suite-panel">
          <div className="suite-panel-heading">
            <div>
              <span className="section-overline">Official event search</span>
              <h2>Choose your competition</h2>
            </div>
            <Search size={18} />
          </div>
          <div className="event-search-row">
            <label>
              Event region
              <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Search an official event region" />
            </label>
            <button className="button button-primary" type="button" onClick={searchEvents} disabled={loading || !officialConfigured}>
              {loading ? <InlineSpinner /> : null}{!officialConfigured ? "Official data unavailable" : loading ? "Loading official events..." : "Search Override events"}
            </button>
          </div>
          {message ? <p className="form-message is-error" role="alert">{message}</p> : null}
          {officialConfigured ? (
            loading && !events.length ? (
              <div className="official-event-list event-result-skeletons" aria-hidden="true">
                {[0, 1, 2].map((item) => <LoadingSkeleton className="is-event-result" key={item} />)}
              </div>
            ) : (
              <div className="official-event-list">
                {events.map((event) => (
                  <button type="button" className="official-event-card" key={event.id} onClick={() => void selectEvent(event)}>
                    <span>{event.sku || "VEX event"}</span>
                    <strong>{event.name || "Unnamed event"}</strong>
                    <small>{dateTime(event.start)} · {eventPlace(event)}</small>
                    <b>{event.divisions?.length ? `${event.divisions.length} division${event.divisions.length === 1 ? "" : "s"}` : "Divisions not published"}</b>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="suite-empty">Use the public VEX Events site while live event search is unavailable here. Team notes and cached context still remain local to your workspace.</div>
          )}
        </section>
      ) : (
        <>
          <section className="suite-panel selected-event-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">Selected official event</span>
                <h2>{selected.name || selected.sku || `Event ${selected.id}`}</h2>
                <p>{dateTime(selected.start)} · {eventPlace(selected)}</p>
              </div>
              <button className="button button-quiet" type="button" onClick={() => void persist({ queueNote: state.queueNote, strategyNote: state.strategyNote, selectedEvent: null, divisionId: null, cachedMatches: [], cachedRankings: [], officialFetchedAt: null }, null)}>
                Change event
              </button>
            </div>
            <div className="event-controls">
              <label>
                Division
                <select value={state.divisionId ?? ""} onChange={(event) => { const divisionId = Number(event.target.value) || null; void persist({ ...state, divisionId }); if (divisionId && officialConfigured) void loadOfficialData(selected, divisionId); }}>
                  <option value="">Select division</option>
                  {selected.divisions?.map((division) => (
                    <option key={division.id} value={division.id}>{division.name || division.code || `Division ${division.id}`}</option>
                  ))}
                </select>
              </label>
              <button className="button button-quiet" type="button" disabled={loading || !state.divisionId || !officialConfigured} onClick={() => void loadOfficialData(selected, state.divisionId)}>
                {loading ? <InlineSpinner /> : <RefreshCw size={14} />} {loading ? "Refreshing..." : "Refresh official data"}
              </button>
            </div>
            {state.officialFetchedAt ? <p className="source-status">Last official refresh: {new Date(state.officialFetchedAt).toLocaleString()}. Cached schedule and rankings remain available if the venue connection drops.</p> : null}
            {message ? <p className="form-message is-error">{message}</p> : null}
          </section>

          <div className="event-live-grid">
            <section className="suite-panel">
              <div className="suite-panel-heading">
                <div>
                  <span className="section-overline">Next scheduled match</span>
                  <h2>{nextMatch ? matchLabel(nextMatch) : "No team match returned"}</h2>
                </div>
                <CalendarDays size={18} />
              </div>
              {nextMatch ? (
                <div className="next-match-card">
                  <strong>{dateTime(nextMatch.scheduled)}</strong>
                  <div className="match-alliance-row red"><span>RED</span>{teamNumbers(nextMatch, "red").map((number) => <b key={number}>{number}</b>)}</div>
                  <div className="match-alliance-row blue"><span>BLUE</span>{teamNumbers(nextMatch, "blue").map((number) => <b key={number}>{number}</b>)}</div>
                </div>
              ) : (
                <div className="suite-empty">{teamNumber ? "No official match containing this team number was returned for the selected division." : "Add the team number in Team Settings to filter the official schedule to your matches."}</div>
              )}
            </section>
            <section className="suite-panel">
              <div className="suite-panel-heading">
                <div>
                  <span className="section-overline">Official event ranking</span>
                  <h2>{myRanking?.rank ? `Rank ${myRanking.rank}` : "Not available"}</h2>
                </div>
                <ShieldCheck size={18} />
              </div>
              {myRanking ? (
                <div className="ranking-summary">
                  <strong>{myRanking.team?.number}</strong>
                  <span>{myRanking.team?.team_name || ""}</span>
                  <b>{myRanking.wins ?? "-"}-{myRanking.losses ?? "-"}-{myRanking.ties ?? "-"}</b>
                </div>
              ) : (
                <p>VEX Events has not returned a ranking row for {teamNumber || "this team"}. No rank is inferred locally.</p>
              )}
            </section>
          </div>

          <section className="suite-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">Team-only event notes</span>
                <h2>Queue and strategy board</h2>
              </div>
            </div>
            <div className="form-grid two-col">
              <label>
                Queue / pit note
                <textarea value={state.queueNote ?? ""} onChange={(event) => setState({ ...state, queueNote: event.target.value })} onBlur={() => void persist(state)} />
              </label>
              <label>
                Strategy note
                <textarea value={state.strategyNote ?? ""} onChange={(event) => setState({ ...state, strategyNote: event.target.value })} onBlur={() => void persist(state)} />
              </label>
            </div>
            <small>These notes belong to your team. They are never presented as an official schedule, rule, score, or ranking.</small>
          </section>

          <section className="suite-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">My official schedule</span>
                <h2>{teamMatches.length} returned match{teamMatches.length === 1 ? "" : "es"}</h2>
              </div>
            </div>
            <div className="event-match-list">
              {teamMatches.map((match) => (
                <article key={match.id}>
                  <span>{matchLabel(match)}</span>
                  <strong>{dateTime(match.scheduled)}</strong>
                  <p><b>Red:</b> {teamNumbers(match, "red").join(" + ") || "-"} <b>Blue:</b> {teamNumbers(match, "blue").join(" + ") || "-"}</p>
                </article>
              ))}
              {!teamMatches.length ? <div className="suite-empty">No official team matches loaded.</div> : null}
            </div>
          </section>
        </>
      )}

      <div className="official-standings-cta">
        <div>
          <ShieldCheck size={20} />
          <span>
            <strong>Source boundary</strong>
            <small>Official event facts come from VEX Events. Team notes and scouting remain clearly labeled local analysis.</small>
          </span>
        </div>
      </div>
    </section>
  );
}
