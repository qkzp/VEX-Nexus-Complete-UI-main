import assert from "node:assert/strict";
import test from "node:test";
import { filterTaskQueue, type QueueTask } from "../src/lib/workspace/task-queue.ts";

function task(id: string, overrides: Partial<QueueTask> = {}): QueueTask {
  return { id, title: id, description: null, status: "BUILDING", priority: "MEDIUM", robotName: null, dueAt: null, assignees: [], ...overrides };
}

test("urgent and unassigned views exclude completed work and all views exclude cancelled work", () => {
  const tasks = [task("urgent", { priority: "CRITICAL" }), task("done", { status: "COMPLETE", priority: "HIGH" }), task("cancelled", { status: "CANCELLED" }), task("assigned", { assignees: [{ id: "u1", name: "Alex" }] })];
  assert.deepEqual(filterTaskQueue(tasks, "", "urgent").map((row) => row.id), ["urgent"]);
  assert.deepEqual(filterTaskQueue(tasks, "", "unassigned").map((row) => row.id), ["urgent"]);
  assert.deepEqual(filterTaskQueue(tasks, "", "complete").map((row) => row.id), ["done"]);
  assert.equal(filterTaskQueue(tasks, "", "all").length, 3);
});

test("search matches robot, teammate and description and combines with the assignee filter", () => {
  const tasks = [task("drive", { description: "Tune the PID", robotName: "Atlas", assignees: [{ id: "u1", name: "Alex" }] }), task("arm", { robotName: "Atlas", assignees: [{ id: "u2", name: "Sam" }] })];
  for (const query of ["  ATLAS  ", "alex", "pid"]) assert.deepEqual(filterTaskQueue(tasks, query, "open", "u1").map((row) => row.id), ["drive"]);
  assert.equal(filterTaskQueue(tasks, "alex", "open", "u2").length, 0);
});

test("sorts active work by priority and due date with completed work last without mutating input", () => {
  const tasks = [task("low", { priority: "LOW" }), task("no-date", { priority: "HIGH" }), task("later", { priority: "HIGH", dueAt: "2026-10-10T00:00:00Z" }), task("earlier", { priority: "HIGH", dueAt: "2026-10-08T00:00:00Z" }), task("done", { priority: "CRITICAL", status: "COMPLETE" })];
  assert.deepEqual(filterTaskQueue(tasks, "", "all").map((row) => row.id), ["earlier", "later", "no-date", "low", "done"]);
  assert.equal(tasks[0].id, "low");
});
