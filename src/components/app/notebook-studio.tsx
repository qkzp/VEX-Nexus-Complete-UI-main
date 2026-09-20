"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenText, CheckCircle2, ExternalLink, Save, ShieldCheck, Trash2 } from "lucide-react";
import { flushPendingTeamSection, saveTeamSection, type SyncStatus } from "@/lib/client/team-sync";

const OFFICIAL_MANUAL = "https://www.vexrobotics.com/override-manual";
const MANUAL_VERSIONS = "https://www.vexrobotics.com/26-27-manuals";
const OFFICIAL_QA = "https://events.vex.com/V5RC/2026-2027/QA";
const REQUIREMENTS = [
  ["Student-created documentation", "Record work created and maintained by student team members."],
  ["Student-centered engineering", "Adults may teach concepts, but students perform and document the engineering work."],
  ["No AI-created notebook content", "Do not use an LLM or similar AI to create or improve competition notebook content."],
  ["Evidence reflects real work", "Measurements, tests, decisions, and results should match what the team actually did."],
  ["Current manual checked", "Confirm requirements against the current Override Game Manual and official Q&A."],
] as const;

type Evidence = { id: string; date: string; objective: string; change: string; why: string; tests: string; result: string; problems: string; next: string; robotRevision: string };
type NotebookState = { url: string; checks: boolean[]; evidence: Evidence[] };

function normalizeUrl(value: string) {
  const raw = value.trim(); if (!raw) return null;
  try {
    const url = new URL(raw); if (!/^https?:$/.test(url.protocol)) return null;
    let embed = url.toString();
    if (url.hostname.includes("docs.google.com") && /\/document\/d\//.test(url.pathname)) embed = url.toString().replace(/\/edit(?:\?.*)?$/, "/preview");
    else if (url.hostname.includes("docs.google.com") && /\/presentation\/d\//.test(url.pathname)) embed = url.toString().replace(/\/edit(?:\?.*)?$/, "/preview");
    else if (url.hostname.includes("drive.google.com") && url.pathname.includes("/file/d/")) embed = url.toString().replace(/\/view(?:\?.*)?$/, "/preview");
    return { original: url.toString(), embed };
  } catch { return null; }
}

export function NotebookStudio({ teamId, initialState }: { teamId: string; initialState: Record<string, unknown> }) {
  const initial: NotebookState = {
    url: typeof initialState.url === "string" ? initialState.url : "",
    checks: Array.isArray(initialState.checks) ? (initialState.checks as boolean[]).slice(0, REQUIREMENTS.length) : REQUIREMENTS.map(()=>false),
    evidence: Array.isArray(initialState.evidence) ? initialState.evidence as Evidence[] : [],
  };
  while (initial.checks.length < REQUIREMENTS.length) initial.checks.push(false);
  const [state, setState] = useState(initial); const [urlDraft,setUrlDraft]=useState(initial.url); const [sync,setSync]=useState<SyncStatus>("saved"); const [message,setMessage]=useState("");
  const [form,setForm]=useState({objective:"",change:"",why:"",tests:"",result:"",problems:"",next:"",robotRevision:""});
  useEffect(()=>{ void flushPendingTeamSection(teamId,"notebook").then((s)=>s&&setSync(s)); },[teamId]);
  function persist(next:NotebookState){ setState(next); setSync("saving"); void saveTeamSection(teamId,"notebook",next).then(setSync); }
  const normalized=useMemo(()=>normalizeUrl(state.url),[state.url]);
  function saveUrl(){ const parsed=normalizeUrl(urlDraft); if(!parsed){setMessage("Enter a valid http or https notebook link.");return;} persist({...state,url:parsed.original});setMessage("Notebook link saved to the team workspace."); }
  function clearUrl(){setUrlDraft("");persist({...state,url:""});setMessage("Notebook link removed.");}
  function toggle(index:number){const checks=state.checks.map((v,i)=>i===index?!v:v);persist({...state,checks});}
  function addEvidence(){if(!Object.values(form).some((v)=>v.trim()))return; const entry:Evidence={id:crypto.randomUUID(),date:new Date().toISOString(),...form};persist({...state,evidence:[entry,...state.evidence]});setForm({objective:"",change:"",why:"",tests:"",result:"",problems:"",next:"",robotRevision:""});}

  return <section className="workspace-page suite-page"><header className="suite-hero compact"><div><div className="suite-badges"><span className="official-badge"><ShieldCheck size={13}/> VEX-ONLY SOURCES</span><span className={`status-chip ${sync==="saved"?"good":"neutral"}`}>{sync==="saved"?"Shared with team":sync==="saving"?"Saving…":"Offline cache"}</span></div><p className="page-kicker">Engineering Notebook</p><h1>Your real notebook stays the center of the page.</h1><p>Save one team notebook link, view it beside VEX requirements, and keep raw evidence organized. PitRelay does not rewrite competition notebook content.</p></div></header>
    <section className="suite-panel notebook-link-panel"><div className="suite-panel-heading"><div><span className="section-overline">Team notebook link</span><h2>Connect your notebook</h2></div><BookOpenText size={18}/></div><div className="notebook-link-row"><input value={urlDraft} onChange={(e)=>setUrlDraft(e.target.value)} aria-label="Notebook URL" placeholder="Paste your notebook link"/><button className="button button-primary" type="button" onClick={saveUrl}><Save size={14}/> Save & view</button>{state.url?<button className="button button-quiet" type="button" onClick={clearUrl}><Trash2 size={14}/> Remove</button>:null}</div>{message?<p className="form-message" role="status">{message}</p>:null}<p className="form-helper">The link must be accessible to the people who need to view it. Saving it here does not submit anything to VEX Events.</p></section>
    <div className="notebook-viewer-grid"><section className="suite-panel notebook-document-panel"><div className="suite-panel-heading"><div><span className="section-overline">Notebook viewer</span><h2>{state.url?"Team engineering notebook":"No notebook connected"}</h2></div>{state.url?<a className="button button-quiet" href={state.url} target="_blank" rel="noreferrer">Open notebook <ExternalLink size={13}/></a>:null}</div>{normalized?<div className="notebook-embed-shell"><iframe key={normalized.embed} src={normalized.embed} title="Team engineering notebook preview" loading="lazy" referrerPolicy="no-referrer"/><p>If the provider blocks embedding, use <strong>Open notebook</strong>.</p></div>:<div className="notebook-connect-empty"><BookOpenText size={32}/><strong>Paste your notebook link above.</strong></div>}</section>
      <aside className="suite-panel notebook-rubric-panel"><div className="suite-panel-heading"><div><span className="section-overline">Official VEX source</span><h2>Notebook requirements check</h2></div><ShieldCheck size={18}/></div><p className="rubric-source-note">This is a compliance checklist, not an invented scoring rubric. The current Game Manual and official VEX Q&A control.</p><div className="rubric-checklist">{REQUIREMENTS.map(([title,detail],i)=><button key={title} type="button" className={state.checks[i]?"is-checked":""} onClick={()=>toggle(i)}><span className="rubric-check-icon">{state.checks[i]?<CheckCircle2 size={16}/>:<span>{i+1}</span>}</span><span><strong>{title}</strong><small>{detail}</small></span></button>)}</div><div className="rubric-actions"><a className="button button-primary" href={OFFICIAL_MANUAL} target="_blank" rel="noreferrer">Official VEX manual <ExternalLink size={13}/></a><a className="button button-quiet" href={MANUAL_VERSIONS} target="_blank" rel="noreferrer">Manual versions</a><a className="button button-quiet" href={OFFICIAL_QA} target="_blank" rel="noreferrer">Official VEX Q&A</a></div></aside></div>
    <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">Team-entered evidence</span><h2>Raw build/test notes</h2></div></div><div className="form-grid two-col"><label>Robot / revision<input value={form.robotRevision} onChange={(e)=>setForm({...form,robotRevision:e.target.value})}/></label><label>Objective<textarea value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/></label><label>What changed<textarea value={form.change} onChange={(e)=>setForm({...form,change:e.target.value})}/></label><label>Why<textarea value={form.why} onChange={(e)=>setForm({...form,why:e.target.value})}/></label><label>Tests<textarea value={form.tests} onChange={(e)=>setForm({...form,tests:e.target.value})}/></label><label>Measured results<textarea value={form.result} onChange={(e)=>setForm({...form,result:e.target.value})}/></label><label>Problems<textarea value={form.problems} onChange={(e)=>setForm({...form,problems:e.target.value})}/></label><label>Next steps<textarea value={form.next} onChange={(e)=>setForm({...form,next:e.target.value})}/></label></div><button className="button button-primary" type="button" onClick={addEvidence}><Save size={14}/> Save raw evidence</button><div className="notebook-history">{state.evidence.slice(0,10).map((e)=><article key={e.id}><span>{new Date(e.date).toLocaleString()} · {e.robotRevision||"No revision label"}</span><strong>{e.objective||e.change||"Build session"}</strong><p>{[e.change,e.why,e.tests,e.result,e.problems,e.next].filter(Boolean).join(" · ")}</p></article>)}{!state.evidence.length?<div className="suite-empty">No raw evidence records yet.</div>:null}</div></section>
  </section>;
}
