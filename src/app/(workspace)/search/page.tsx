import Link from "next/link";
import { BookOpenText, ClipboardCheck, FileText, Search, Wrench } from "lucide-react";
import { NeedsTeam, TeamScope } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = { searchParams: Promise<{ q?: string; team?: string }> };

type SearchSection = {
  id: string;
  label: string;
  count: number;
  empty: string;
  items: { href: string; title: string; detail: string }[];
};

function withTeam(path: string, teamId: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("team", teamId);
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}`;
}

export default async function WorkspaceSearchPage({ searchParams }: PageProps) {
  const { q = "", team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/search");
  const { team, teams } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Create or join a team first" body="Workspace search is scoped to a team." />;

  const query = q.trim();
  const [robots, tasks, buildLogs, notebookEntries] = query
    ? await withDatabaseFallback(
        () =>
          Promise.all([
            prisma.robot.findMany({
              where: {
                teamId: team.id,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
              take: 20,
              orderBy: { updatedAt: "desc" },
            }),
            prisma.task.findMany({
              where: {
                teamId: team.id,
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
              take: 20,
              orderBy: { updatedAt: "desc" },
            }),
            prisma.buildLog.findMany({
              where: {
                teamId: team.id,
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { summary: { contains: query, mode: "insensitive" } },
                  { results: { contains: query, mode: "insensitive" } },
                ],
              },
              take: 20,
              orderBy: { occurredOn: "desc" },
            }),
            prisma.notebookEntry.findMany({
              where: {
                teamId: team.id,
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { objective: { contains: query, mode: "insensitive" } },
                  { decision: { contains: query, mode: "insensitive" } },
                  { results: { contains: query, mode: "insensitive" } },
                ],
              },
              take: 20,
              orderBy: { occurredOn: "desc" },
            }),
          ]),
        [[], [], [], []],
      )
    : [[], [], [], []];

  const sections: SearchSection[] = [
    {
      id: "robots",
      label: "Robots",
      count: robots.length,
      empty: "No robot matches.",
      items: robots.map((robot) => ({
        href: withTeam(`/robots/${robot.id}`, team.id),
        title: robot.name,
        detail: robot.description || "No description",
      })),
    },
    {
      id: "tasks",
      label: "Tasks",
      count: tasks.length,
      empty: "No task matches.",
      items: tasks.map((task) => ({
        href: withTeam("/team/tasks", team.id),
        title: task.title,
        detail: `${task.status.toLowerCase().replaceAll("_", " ")} | ${task.priority.toLowerCase()} priority`,
      })),
    },
    {
      id: "build-logs",
      label: "Build logs",
      count: buildLogs.length,
      empty: "No build-log matches.",
      items: buildLogs.map((entry) => ({
        href: withTeam("/build-log", team.id),
        title: entry.title,
        detail: entry.occurredOn.toLocaleDateString(),
      })),
    },
    {
      id: "notebook",
      label: "Notebook",
      count: notebookEntries.length,
      empty: "No notebook matches.",
      items: notebookEntries.map((entry) => ({
        href: withTeam("/notebook", team.id),
        title: entry.title,
        detail: entry.objective || entry.decision || entry.results || entry.occurredOn.toLocaleDateString(),
      })),
    },
  ];

  const totalCount = sections.reduce((sum, section) => sum + section.count, 0);
  const scopePath = query ? `/search?q=${encodeURIComponent(query)}` : "/search";

  return (
    <section className="workspace-page suite-page">
      <header className="suite-hero compact">
        <div>
          <p className="page-kicker">Workspace Search</p>
          <h1>Find your team&apos;s engineering records.</h1>
          <p>Search stays limited to the selected team workspace and now covers robots, tasks, build logs, and notebook entries.</p>
        </div>
        <Search size={28} />
      </header>

      <TeamScope teams={teams} selectedId={team.id} path={scopePath} />

      <section className="suite-panel">
        <form className="workspace-search-page-form" action="/search">
          <input type="hidden" name="team" value={team.id} />
          <label>
            <Search size={16} />
            <input
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="Search robots, tasks, build logs, and notebook notes"
            />
          </label>
          <button className="button button-primary" type="submit">Search</button>
        </form>

        {query ? (
          <>
            <p className="source-status">
              {totalCount} result{totalCount === 1 ? "" : "s"} for &quot;{query}&quot;.
            </p>
            <div className="search-result-summary" aria-label="Search result summary">
              <div className="search-result-chip"><Wrench size={14} /><span>{robots.length} robot{robots.length === 1 ? "" : "s"}</span></div>
              <div className="search-result-chip"><ClipboardCheck size={14} /><span>{tasks.length} task{tasks.length === 1 ? "" : "s"}</span></div>
              <div className="search-result-chip"><FileText size={14} /><span>{buildLogs.length} build log{buildLogs.length === 1 ? "" : "s"}</span></div>
              <div className="search-result-chip"><BookOpenText size={14} /><span>{notebookEntries.length} notebook entr{notebookEntries.length === 1 ? "y" : "ies"}</span></div>
            </div>
          </>
        ) : (
          <p className="source-status">Enter a term to search this team.</p>
        )}
      </section>

      {query ? (
        <div className="search-results-grid search-results-grid-wide">
          {sections.map((section) => (
            <section className="suite-panel" key={section.id}>
              <div className="search-section-heading">
                <span className="section-overline">{section.label}</span>
                <strong>{section.count}</strong>
              </div>
              {section.items.map((item) => (
                <Link className="search-result-row" href={item.href} key={`${section.id}-${item.title}-${item.detail}`}>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </Link>
              ))}
              {!section.items.length ? <div className="suite-empty">{section.empty}</div> : null}
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
