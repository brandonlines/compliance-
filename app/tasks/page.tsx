"use client";

import { FormEvent } from "react";

import { AccessNote } from "@/components/access-note";
import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { TaskStatus } from "@/lib/types";

const taskStatusOrder: Record<TaskStatus, number> = {
  open: 0,
  in_progress: 1,
  done: 2
};

export default function TasksPage() {
  const { currentUser, store, createTask, updateTaskStatus } = useAppStore();
  const canManage = currentUser.role === "admin";
  const tasks = [...store.tasks].sort((left, right) => {
    const statusDelta = taskStatusOrder[left.status] - taskStatusOrder[right.status];

    if (statusDelta !== 0) {
      return statusDelta;
    }

    return left.dueDate.localeCompare(right.dueDate);
  });

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await createTask({
      title: String(data.get("title") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      owner: String(data.get("owner") ?? "").trim(),
      dueDate: String(data.get("dueDate") ?? "").trim(),
      priority: (String(data.get("priority") ?? "medium") as "high" | "medium" | "low")
    });
    form.reset();
  }

  async function handleUpdateTask(taskId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await updateTaskStatus(taskId, String(data.get("status") ?? "open") as TaskStatus);
  }

  return (
    <section className="stack">
      {!canManage ? <AccessNote /> : null}

      <header>
        <p className="eyebrow">Tasks</p>
        <h2 className="page-title">Remediation queue</h2>
        <p className="muted">Track compliance work pulled from failing checks and manual audit prep.</p>
      </header>

      {canManage ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Add task</p>
              <h3>Create a manual follow-up</h3>
            </div>
          </div>
          <form onSubmit={handleCreateTask} className="form-grid">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" placeholder="Collect latest penetration test letter" required />
            </div>
            <div className="field">
              <label htmlFor="owner">Owner</label>
              <input id="owner" name="owner" placeholder="Security" required />
            </div>
            <div className="field field-full">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" placeholder="Context for whoever is picking this up." />
            </div>
            <div className="field">
              <label htmlFor="dueDate">Due date</label>
              <input id="dueDate" name="dueDate" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" defaultValue="medium">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="inline-actions field-full">
              <button type="submit" className="button">
                Create task
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Owner</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Status</th>
              <th>Source</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <strong>{task.title}</strong>
                  <p className="caption">{task.description}</p>
                </td>
                <td>{task.owner}</td>
                <td>
                  <StatusBadge tone={task.priority} />
                </td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <StatusBadge tone={task.status} />
                </td>
                <td>{task.sourceType}</td>
                <td>
                  {canManage ? (
                    <form onSubmit={(event) => handleUpdateTask(task.id, event)} className="inline-actions">
                      <select name="status" defaultValue={task.status}>
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button type="submit" className="button-ghost">
                        Save
                      </button>
                    </form>
                  ) : (
                    <span className="caption">Admins can update task state</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
