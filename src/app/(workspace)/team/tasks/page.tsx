import { ClipboardCheck, Plus } from "lucide-react";
import { CreateTaskForm } from "@/components/app/workspace-forms";
import { TaskStatusForm } from "@/components/app/task-board";
import { NeedsTeam, TeamScope } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function TeamTasksPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/team/tasks");
  const { team, teams } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Create or join a team first" body="Tasks belong to a shared team workspace." />;

  const [tasks, members, robots] = await withDatabaseFallback(
    () =>
      Promise.all([
        prisma.task.findMany({
          where: { teamId: team.id, status: { not: "CANCELLED" } },
          orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }, { updatedAt: "desc" }],
          include: {
            robot: { select: { id: true, name: true } },
            assignees: { include: { user: { select: { id: true, displayName: true, name: true, username: true } } } },
          },
        }),
        prisma.teamMember.findMany({
          where: { teamId: team.id, status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, displayName: true, name: true, username: true, email: true } } },
        }),
        prisma.robot.findMany({ where: { teamId: team.id, status: { notIn: ["ARCHIVED", "RETIRED"] } }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } }),
      ]),
    [[], [], []],
  );

  const memberOptions = members.map((member) => ({
    id: member.user.id,
    label: member.user.displayName || member.user.name || member.user.username || member.user.email || "Team member",
  }));

  return <section className="workspace-page suite-page">
    <header className="suite-hero compact"><div><div className="suite-badges"><span className="analysis-badge">SHARED TEAM WORK</span></div><p className="page-kicker">Team Tasks</p><h1>Turn practice plans into assigned work.</h1><p>Tasks are stored in the team database, can be linked to a robot, assigned to a member, and moved through the engineering workflow.</p></div><ClipboardCheck size={28}/></header>
    <TeamScope teams={teams} selectedId={team.id} path="/team/tasks" />
    <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">New task</span><h2>Plan real work</h2></div><Plus size={18}/></div><CreateTaskForm teamId={team.id} members={memberOptions} robots={robots}/></section>
    <section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">Work queue</span><h2>{tasks.length} current task{tasks.length === 1 ? "" : "s"}</h2></div></div>
      <div className="task-board-list">{tasks.map((task) => <article className="task-board-card" key={task.id}>
        <div className="task-board-main"><div className="task-card-meta"><span>{task.priority.toLowerCase()}</span><span>{task.robot?.name || "No robot"}</span>{task.dueAt ? <span>Due {task.dueAt.toLocaleDateString()}</span> : null}</div><h3>{task.title}</h3>{task.description ? <p>{task.description}</p> : null}<small>{task.assignees.length ? `Assigned: ${task.assignees.map((row) => row.user.displayName || row.user.name || row.user.username || "Member").join(", ")}` : "Unassigned"}</small></div>
        <TaskStatusForm taskId={task.id} status={task.status}/>
      </article>)}{!tasks.length ? <div className="suite-empty">No tasks yet. Add one above when the team has real work to coordinate.</div> : null}</div>
    </section>
  </section>;
}
