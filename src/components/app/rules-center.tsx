"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, BookOpenText, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { RULE_TOPICS, VEX_OVERRIDE } from "@/lib/vex-official";

export function RulesCenter() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalized) return RULE_TOPICS;
    return RULE_TOPICS.filter((topic) =>
      [topic.title, topic.summary, ...topic.tags].join(" ").toLowerCase().includes(normalized),
    );
  }, [normalized]);

  return (
    <section className="workspace-page suite-page">
      <header className="suite-hero compact">
        <div>
          <div className="suite-badges">
            <span className="official-badge"><ShieldCheck size={13} /> VERIFIED SOURCES</span>
            <span className="season-chip">Override v{VEX_OVERRIDE.manualVersion}</span>
          </div>
          <p className="page-kicker">Rules Center</p>
          <h1>Official rules first.</h1>
          <p>Search concise summaries, then jump directly to the controlling VEX source. BoltCanvas explanations are always labeled as summaries.</p>
        </div>
        <div className="rules-status-card">
          <span>ACTIVE MANUAL</span>
          <strong>Version {VEX_OVERRIDE.manualVersion}</strong>
          <small>Effective {VEX_OVERRIDE.effective}</small>
          <a href={VEX_OVERRIDE.sources.manualVersions} target="_blank" rel="noreferrer">Version schedule <ArrowUpRight size={13} /></a>
        </div>
      </header>

      <div className="rules-alert">
        <AlertTriangle size={17} />
        <div><strong>Next scheduled release: v{VEX_OVERRIDE.nextVersion}</strong><span>Release {VEX_OVERRIDE.nextRelease} - effective {VEX_OVERRIDE.nextEffective}. Re-check rules after each manual update.</span></div>
      </div>

      <section className="suite-panel">
        <div className="suite-panel-heading">
          <div><span className="section-overline">Source-aware search</span><h2>Find a rule topic</h2></div>
          <a href={VEX_OVERRIDE.sources.qa} target="_blank" rel="noreferrer">Official Q&amp;A <ArrowUpRight size={13} /></a>
        </div>
        <label className="suite-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: autonomous bonus, manual version, World Skills..." /></label>
        <div className="rule-results">
          {matches.map((topic) => (
            <article className="rule-result" key={topic.id}>
              <div className="rule-result-icon"><BookOpenText size={18} /></div>
              <div>
                <div className="rule-result-title"><h3>{topic.title}</h3><span>BOLTCANVAS SUMMARY</span></div>
                <p>{topic.summary}</p>
                <a href={topic.source} target="_blank" rel="noreferrer"><CheckCircle2 size={13} /> {topic.sourceLabel} <ArrowUpRight size={12} /></a>
              </div>
            </article>
          ))}
          {!matches.length && <div className="suite-empty">No local summary matches that search. Use the official Q&amp;A for a binding interpretation.</div>}
        </div>
      </section>

      <section className="suite-panel">
        <div className="suite-panel-heading"><div><span className="section-overline">Version {VEX_OVERRIDE.manualVersion}</span><h2>Published changes</h2></div><span className="source-pill"><i /> VEX published</span></div>
        <div className="change-grid">
          {VEX_OVERRIDE.changelog.map((item) => <div className="change-item" key={item}><span>CHANGED</span><p>{item}</p></div>)}
        </div>
      </section>
    </section>
  );
}
