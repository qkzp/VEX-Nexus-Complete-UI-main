"use client";

import { useState } from "react";
import { ClipboardCheck, Search, SlidersHorizontal } from "lucide-react";
import { filterTaskQueue, type QueueFilter, type QueueTask } from "@/lib/workspace/task-queue";
import { TaskStatusForm } from "./task-board";

const filters: { value: QueueFilter; label: string }[] = [
  { value: "open", label: "Open" }, { value: "urgent", label: "High priority" },
  { value: "unassigned", label: "Unassigned" }, { value: "complete", label: "Completed" }, { value: "all", label: "All tasks" },
];

export function TaskQueue({ tasks, members }: { tasks: QueueTask[]; members: { id: string; label: string }[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("open");
  const [memberId, setMemberId] = useState("");
  const visibleTasks = filterTaskQueue(tasks, query, filter, memberId);

  return <section className="suite-panel task-queue-panel" aria-labelledby="task-queue-title">
    <div className="suite-panel-heading"><div><span className="section-overline">Team work</span><h2 id="task-queue-title">Work queue <span className="queue-total">{tasks.filter((task) => task.status !== "COMPLETE").length} open</span></h2></div><SlidersHorizontal size={18} aria-hidden="true" /></div>
    <div className="queue-toolbar">
      <label className="queue-search"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a task, robot or teammate…" aria-label="Search tasks" /></label>
      <select value={memberId} onChange={(event) => setMemberId(event.target.value)} aria-label="Filter by assignee"><option value="">All teammates</option>{members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select>
    </div>
    <div className="queue-filters" role="group" aria-label="Filter tasks">{filters.map((item) => <button type="button" key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{filterTaskQueue(tasks, "", item.value).length}</span></button>)}</div>
    <p className="queue-result-count" role="status">Showing {visibleTasks.length} of {tasks.length} tasks · Priority, then due date</p>
    <div className="task-board-list">{visibleTasks.map((task) => <article className={`task-board-card queue-card ${task.status === "COMPLETE" ? "is-complete" : ""}`} key={task.id}>
      <div className="task-board-main"><div className="task-card-meta"><span className={`queue-priority priority-${task.priority.toLowerCase()}`}>{task.priority.toLowerCase()}</span><span>{task.status.toLowerCase().replaceAll("_", " ")}</span>{task.robotName ? <span>{task.robotName}</span> : null}{task.dueAt ? <span>Due {new Date(task.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span> : null}</div><h3>{task.title}</h3>{task.description ? <p>{task.description}</p> : null}<small>{task.assignees.length ? task.assignees.map((assignee) => assignee.name).join(", ") : "Unassigned"}</small></div>
      <TaskStatusForm taskId={task.id} status={task.status} />
    </article>)}</div>
    {!visibleTasks.length ? <div className="queue-empty"><ClipboardCheck size={26} aria-hidden="true" /><strong>{tasks.length ? "No tasks match this view" : "Start with one clear task"}</strong><p>{tasks.length ? "Try another filter or clear your search to see more work." : "Open New task above to give your next piece of work an owner."}</p>{tasks.length ? <button type="button" className="button button-secondary" onClick={() => { setQuery(""); setFilter("all"); setMemberId(""); }}>Clear filters</button> : null}</div> : null}
  </section>;
}
