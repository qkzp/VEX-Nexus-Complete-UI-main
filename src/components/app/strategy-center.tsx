"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardCheck, Save, Target, UsersRound } from "lucide-react";
import { flushPendingTeamSection, saveTeamSection, type SyncStatus } from "@/lib/client/team-sync";

type MetricKey = "auto" | "driver" | "reliability" | "midfield" | "defense";
type ScoutRecord = {
  id: string;
  kind: "pit" | "match";
  team: string;
  event: string;
  match: string;
  metrics: Partial<Record<MetricKey, number>>;
  cycle: number | null;
  notes: string;
  createdAt: string;
};
type ScoutingState = { records: ScoutRecord[] };

type ScoutForm = { kind: "pit" | "match"; team: string; event: string; match: string; auto: string; driver: string; reliability: string; midfield: string; defense: string; cycle: string; notes: string };
const blank = (): ScoutForm => ({ kind: "match", team: "", event: "", match: "", auto: "", driver: "", reliability: "", midfield: "", defense: "", cycle: "", notes: "" });
const weights: Record<MetricKey, number> = { auto: .23, driver: .27, reliability: .25, midfield: .12, defense: .08 };

function aggregate(records: ScoutRecord[], team: string) {
  const rows = records.filter((r) => r.team === team);
  if (!rows.length) return null;
  const avg = (key: MetricKey) => {
    const values = rows.map((r) => r.metrics[key]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const cycleValues = rows.map((r) => r.cycle).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const metrics = Object.fromEntries((Object.keys(weights) as MetricKey[]).map((key) => [key, avg(key)])) as Record<MetricKey, number | null>;
  let numerator = 0, denominator = 0;
  for (const key of Object.keys(weights) as MetricKey[]) if (metrics[key] !== null) { numerator += metrics[key]! * weights[key]; denominator += weights[key]; }
  const knownIndex = denominator ? numerator / denominator : null;
  return { team, rows: rows.length, metrics, cycle: cycleValues.length ? cycleValues.reduce((a, b) => a + b, 0) / cycleValues.length : null, knownIndex };
}

export function StrategyCenter({ teamId, initialState }: { teamId: string; initialState: Record<string, unknown> }) {
  const initial = initialState && Array.isArray((initialState as { records?: unknown }).records) ? initialState as unknown as ScoutingState : { records: [] };
  const [state, setState] = useState<ScoutingState>(initial);
  const [form, setForm] = useState(blank());
  const [sync, setSync] = useState<SyncStatus>("saved");
  const [redA, setRedA] = useState(""); const [redB, setRedB] = useState(""); const [blueA, setBlueA] = useState(""); const [blueB, setBlueB] = useState("");
  useEffect(() => { void flushPendingTeamSection(teamId, "scouting").then((s) => s && setSync(s)); }, [teamId]);
  function persist(next: ScoutingState) { setState(next); setSync("saving"); void saveTeamSection(teamId, "scouting", next).then(setSync); }
  function parseMetric(value: string) { const n = Number(value); return value.trim() && Number.isFinite(n) && n >= 1 && n <= 5 ? n : undefined; }
  function save() {
    const team = form.team.trim().toUpperCase(); if (!team) return;
    const record: ScoutRecord = { id: crypto.randomUUID(), kind: form.kind, team, event: form.event.trim(), match: form.match.trim(), metrics: { auto: parseMetric(form.auto), driver: parseMetric(form.driver), reliability: parseMetric(form.reliability), midfield: parseMetric(form.midfield), defense: parseMetric(form.defense) }, cycle: form.cycle.trim() && Number(form.cycle) > 0 ? Number(form.cycle) : null, notes: form.notes.trim(), createdAt: new Date().toISOString() };
    persist({ records: [record, ...state.records] }); setForm(blank());
  }
  const teams = useMemo(() => [...new Set(state.records.map((r) => r.team))], [state.records]);
  const aggregates = useMemo(() => teams.map((team) => aggregate(state.records, team)).filter(Boolean) as NonNullable<ReturnType<typeof aggregate>>[], [state.records, teams]);
  const sorted = [...aggregates].filter((a) => a.knownIndex !== null).sort((a, b) => (b.knownIndex ?? 0) - (a.knownIndex ?? 0));
  const get = (team: string) => aggregates.find((a) => a.team === team.trim().toUpperCase()) ?? null;
  const alliance = (a: string, b: string) => { const x = get(a), y = get(b); return x?.knownIndex !== null && x?.knownIndex !== undefined && y?.knownIndex !== null && y?.knownIndex !== undefined ? x.knownIndex + y.knownIndex : null; };
  const redScore = alliance(redA, redB), blueScore = alliance(blueA, blueB);
  const strategy = (() => {
    const our = [get(redA), get(redB)].filter(Boolean) as NonNullable<ReturnType<typeof get>>[];
    const opp = [get(blueA), get(blueB)].filter(Boolean) as NonNullable<ReturnType<typeof get>>[];
    if (our.length < 2 || opp.length < 2) return null;
    const autoKnown = our.filter((x) => x.metrics.auto !== null).sort((a,b)=>(b.metrics.auto ?? 0)-(a.metrics.auto ?? 0));
    const threat = opp.filter((x) => x.knownIndex !== null).sort((a,b)=>(b.knownIndex ?? 0)-(a.knownIndex ?? 0))[0];
    return {
      autonomous: autoKnown.length ? `${autoKnown[0].team} has the strongest observed autonomous rating in your records. Validate non-overlapping routes together on the real field.` : "No autonomous observations are recorded for both alliance teams.",
      driver: threat ? `Your records show ${threat.team} as the strongest observed opponent. Plan roles around repeatable scoring rather than an invented win prediction.` : "Opponent observations are incomplete.",
      endgame: "Reserve enough time for legal Midfield positioning, but verify the current Override manual before treating any strategy note as a rule interpretation.",
    };
  })();

  return <section className="workspace-page suite-page"><header className="suite-hero compact"><div><div className="suite-badges"><span className="analysis-badge">TEAM OBSERVATIONS</span><span className={`status-chip ${sync === "saved" ? "good" : "neutral"}`}>{sync === "saved" ? "Shared with team" : sync === "saving" ? "Saving…" : "Offline cache"}</span></div><p className="page-kicker">Strategy & Scouting</p><h1>Unknown stays unknown.</h1><p>Pit and match scouting are stored in the selected team workspace. Blank fields are never converted into average ratings or fake predictions.</p></div></header>
    <div className="strategy-grid"><section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">Scouting record</span><h2>Record only what was observed</h2></div><ClipboardCheck size={18}/></div><div className="form-grid two-col"><label>Record type<select value={form.kind} onChange={(e)=>setForm({...form,kind:e.target.value as "pit"|"match"})}><option value="match">Match scouting</option><option value="pit">Pit scouting</option></select></label><label>Team number<input value={form.team} onChange={(e)=>setForm({...form,team:e.target.value.toUpperCase()})}/></label><label>Event (optional)<input value={form.event} onChange={(e)=>setForm({...form,event:e.target.value})}/></label><label>Match (optional)<input value={form.match} onChange={(e)=>setForm({...form,match:e.target.value})}/></label>{(["auto","driver","reliability","midfield","defense"] as const).map((key)=><label key={key}>{key[0].toUpperCase()+key.slice(1)} / 5 <small>optional</small><input type="number" min="1" max="5" value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Observed cycle time (s) <small>optional</small><input type="number" min="0.01" step="0.01" value={form.cycle} onChange={(e)=>setForm({...form,cycle:e.target.value})}/></label><label className="span-2">Notes<textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></label></div><button className="button button-primary" type="button" onClick={save}><Save size={14}/> Save observation</button></section>
      <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">Alliance shortlist</span><h2>Observed complements</h2></div><UsersRound size={18}/></div><div className="candidate-list">{sorted.slice(0,8).map((a,i)=><div className="candidate" key={a.team}><span>#{i+1}</span><strong>{a.team}</strong><b>{a.knownIndex?.toFixed(2)} / 5 known-data index</b><small>{a.rows} scouting record{a.rows===1?"":"s"}</small></div>)}{!sorted.length?<div className="suite-empty">No team has enough recorded metrics to calculate an observation index yet.</div>:null}</div></section></div>
    <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">Four-team planning</span><h2>Match strategy</h2></div><Target size={18}/></div><div className="matchup-inputs"><div className="alliance-box red"><strong>RED</strong><input value={redA} onChange={(e)=>setRedA(e.target.value.toUpperCase())}/><input value={redB} onChange={(e)=>setRedB(e.target.value.toUpperCase())}/><span>{redScore===null?"Insufficient scouting data":`Observed index ${redScore.toFixed(2)}`}</span></div><div className="versus">VS</div><div className="alliance-box blue"><strong>BLUE</strong><input value={blueA} onChange={(e)=>setBlueA(e.target.value.toUpperCase())}/><input value={blueB} onChange={(e)=>setBlueB(e.target.value.toUpperCase())}/><span>{blueScore===null?"Insufficient scouting data":`Observed index ${blueScore.toFixed(2)}`}</span></div></div>{strategy?<div className="strategy-output"><div><span>AUTONOMOUS</span><p>{strategy.autonomous}</p></div><div><span>DRIVER</span><p>{strategy.driver}</p></div><div><span>ENDGAME</span><p>{strategy.endgame}</p></div></div>:<div className="suite-empty">Enter four teams with scouting records to generate a transparent strategy summary.</div>}<div className="analysis-disclaimer"><BarChart3 size={15}/> This is team-entered analysis, never an official VEX ranking or outcome prediction.</div></section>
  </section>;
}
