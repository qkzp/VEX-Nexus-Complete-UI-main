import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Box,
  Braces,
  ExternalLink,
  Flag,
  Gamepad2,
  Layers3,
  Map,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { VEX_OVERRIDE } from "@/lib/vex-official";

const fieldInventory = [
  { value: "56", label: "Cups", icon: Box },
  { value: "63", label: "Pins", icon: Target },
  { value: "9", label: "Goals", icon: Layers3 },
  { value: "4", label: "Toggles", icon: Flag },
  { value: "4", label: "Loaders", icon: Map },
];

const scoreCards = [
  {
    value: "12",
    label: "Autonomous Bonus",
    detail: "12 points to the Autonomous winner. If Autonomous is tied, each alliance receives 6 points.",
  },
  { value: "5", label: "Alliance-color Pin", detail: "Each scored pin matching the alliance color." },
  { value: "10", label: "Scored Yellow Pin", detail: "Each yellow pin that satisfies the current scoring requirements." },
  { value: "8", label: "Robot in Midfield", detail: "Each robot at least partially within Midfield at the end of the match." },
];

const prepLanes = [
  {
    title: "Driver control prep",
    detail: "Review loader access, cycle spacing, midfield exits, and protected traffic lines before you arrive at the event.",
  },
  {
    title: "Autonomous coding prep",
    detail: "Validate start heading, first movement, point turn assumptions, and route legality before generating code.",
  },
  {
    title: "Inspection prep",
    detail: "Cross-check the saved robot profile against the real machine so wiring, ports, and configured devices still match.",
  },
];

const resourceLinks = [
  { href: VEX_OVERRIDE.sources.manualPage, label: "Game manual", detail: "Binding field, scoring, and match rules." },
  { href: VEX_OVERRIDE.sources.qa, label: "Official Q and A", detail: "Use this when a rule needs the current official interpretation." },
  { href: VEX_OVERRIDE.sources.pythonApi, label: "VEX Python API", detail: "Official reference for generated Python routines." },
  { href: VEX_OVERRIDE.sources.cppApi, label: "VEX C++ API", detail: "Official reference for generated C++ routines." },
];

export function CompetitionCenter() {
  return (
    <section className="workspace-page competition-page">
      <header className="competition-hero">
        <div className="competition-hero-copy">
          <div className="competition-season-row">
            <span className="season-chip">
              <Sparkles size={13} /> {VEX_OVERRIDE.season} - {VEX_OVERRIDE.game}
            </span>
            <span className="live-source-chip">
              <i /> Active manual v{VEX_OVERRIDE.manualVersion}
            </span>
          </div>
          <p className="page-kicker">VEX V5 Robotics Competition</p>
          <h1>Override field center.</h1>
          <p>
            Study the real field, keep the current scoring model close, and move directly from match strategy into
            autonomous planning, robot review, or official world standings.
          </p>
          <div className="competition-hero-actions">
            <a className="button button-primary button-large" href={VEX_OVERRIDE.sources.manualPage} target="_blank" rel="noreferrer">
              Official game manual <ExternalLink size={15} />
            </a>
            <Link className="button button-quiet button-large" href="/rankings">
              World Skills <Trophy size={15} />
            </Link>
          </div>
          <div className="competition-trust-line">
            <ShieldCheck size={15} /> Active rules status: Override v{VEX_OVERRIDE.manualVersion}, effective August 13,
            2026. Use the official Game Manual and V5RC Q and A for binding interpretations.
          </div>
        </div>

        <div className="competition-field-hero" aria-label="Official VEX Override competition field">
          <div className="field-visual-toolbar">
            <span>
              <i /> OVERRIDE // FIELD
            </span>
            <span>{VEX_OVERRIDE.fieldSize.toUpperCase()}</span>
          </div>
          <Image src={VEX_OVERRIDE.images.iso} alt="Official VEX V5 Robotics Competition Override field" width={1100} height={760} priority />
          <div className="field-hero-caption">
            <span>Official field reference</span>
            <a href={VEX_OVERRIDE.sources.manualPage} target="_blank" rel="noreferrer">
              Open source <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      <div className="manual-status-strip">
        <div>
          <span>ACTIVE MANUAL</span>
          <strong>Override v{VEX_OVERRIDE.manualVersion}</strong>
          <small>Effective August 13, 2026</small>
        </div>
        <div>
          <span>NEXT SCHEDULED</span>
          <strong>v{VEX_OVERRIDE.nextVersion}</strong>
          <small>Release September 3, 2026 - effective September 10, 2026</small>
        </div>
        <a href={VEX_OVERRIDE.sources.qa} target="_blank" rel="noreferrer">
          Official V5RC Q and A <ExternalLink size={13} />
        </a>
      </div>

      <div className="competition-metric-strip" aria-label="Override field inventory">
        {fieldInventory.map(({ value, label, icon: Icon }) => (
          <div className="competition-metric" key={label}>
            <Icon size={18} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <section className="competition-prep-panel">
        <div className="section-line">
          <div>
            <span className="section-overline">Competition workflow</span>
            <h2>What strong V5RC teams review before they queue.</h2>
          </div>
          <span className="source-pill">
            <i /> Team-facing checklist
          </span>
        </div>
        <div className="competition-prep-grid">
          {prepLanes.map((lane) => (
            <article className="competition-prep-card" key={lane.title}>
              <strong>{lane.title}</strong>
              <p>{lane.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="competition-layout">
        <section className="field-map-panel">
          <div className="section-line">
            <div>
              <span className="section-overline">Field intelligence</span>
              <h2>Top-down field map</h2>
            </div>
            <span className="source-pill">
              <i /> VEX manual
            </span>
          </div>
          <div className="field-map-frame">
            <Image src={VEX_OVERRIDE.images.top} alt="Top-down official Override field layout" width={1200} height={1200} />
          </div>
          <div className="field-map-footer">
            <p>Use the full-field reference when planning autonomous routes, loader approach angles, goal access, and endgame positioning.</p>
            <a href={VEX_OVERRIDE.sources.manualPage} target="_blank" rel="noreferrer">
              Current manual <ArrowRight size={13} />
            </a>
          </div>
        </section>

        <aside className="score-panel">
          <div className="section-line">
            <div>
              <span className="section-overline">Match model</span>
              <h2>Scoring quick reference</h2>
            </div>
          </div>
          <div className="score-card-grid">
            {scoreCards.map((card) => (
              <article className="score-card" key={card.label}>
                <strong>{card.value}</strong>
                <div>
                  <h3>{card.label}</h3>
                  <p>{card.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="score-panel-note">Treat this as a quick workspace reference. The official manual and Q and A control whenever a rule or scoring interpretation changes.</p>
        </aside>
      </div>

      <div className="competition-resource-grid">
        <section className="competition-update-panel">
          <div className="section-line">
            <div>
              <span className="section-overline">Manual changes</span>
              <h2>Recent Override update notes</h2>
            </div>
            <BookOpenText size={18} />
          </div>
          <div className="competition-update-list">
            {VEX_OVERRIDE.changelog.map((entry) => (
              <div key={entry}>
                <span />
                <p>{entry}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="competition-update-panel">
          <div className="section-line">
            <div>
              <span className="section-overline">Reference links</span>
              <h2>Keep official sources close</h2>
            </div>
            <ScanSearch size={18} />
          </div>
          <div className="competition-resource-list">
            {resourceLinks.map((resource) => (
              <a href={resource.href} target="_blank" rel="noreferrer" key={resource.label}>
                <strong>{resource.label}</strong>
                <span>{resource.detail}</span>
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </section>
      </div>

      <section className="competition-action-grid" aria-label="Competition tools">
        <Link href="/field-lab" className="competition-action-card">
          <span className="action-icon">
            <Braces size={21} />
          </span>
          <div>
            <span className="section-overline">Autonomous</span>
            <h2>Plan on the field</h2>
            <p>Move from the official Override map into your autonomous workspace.</p>
          </div>
          <ArrowRight size={18} />
        </Link>
        <Link href="/robots" className="competition-action-card">
          <span className="action-icon">
            <Gamepad2 size={21} />
          </span>
          <div>
            <span className="section-overline">Robot</span>
            <h2>Check the hardware</h2>
            <p>Review saved drivetrain, motors, sensors, and configuration evidence.</p>
          </div>
          <ArrowRight size={18} />
        </Link>
        <a href={VEX_OVERRIDE.sources.worldSkills} target="_blank" rel="noreferrer" className="competition-action-card competition-action-card-accent">
          <span className="action-icon">
            <Trophy size={21} />
          </span>
          <div>
            <span className="section-overline">Live official data</span>
            <h2>Open World Skills</h2>
            <p>See the current global table directly from VEX Events.</p>
          </div>
          <ExternalLink size={18} />
        </a>
      </section>
    </section>
  );
}
