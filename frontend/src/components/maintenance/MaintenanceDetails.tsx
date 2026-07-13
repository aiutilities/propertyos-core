"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  assignMaintenanceTicket,
  getMaintenanceTicket,
  transitionMaintenanceTicket,
} from "@/hooks/useMaintenance";
import {
  MaintenanceStatus,
  MaintenanceTicket,
} from "@/types/maintenance";

const transitions: Partial<
  Record<MaintenanceStatus, MaintenanceStatus[]>
> = {
  OPEN: ["CANCELLED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
};

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MaintenanceDetails({
  ticketId,
}: {
  ticketId: string;
}) {
  const [ticket, setTicket] =
    useState<MaintenanceTicket | null>(null);
  const [assigneePersonId, setAssigneePersonId] = useState("");
  const [actorPersonId, setActorPersonId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setTicket(await getMaintenanceTicket(ticketId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load maintenance ticket.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [ticketId]);

  async function assign() {
    if (!assigneePersonId || !actorPersonId) {
      setError("Assignee and acting person are required.");
      return;
    }

    setBusy("assign");
    setError("");

    try {
      await assignMaintenanceTicket(ticketId, {
        assigneePersonId,
        changedByPersonId: actorPersonId,
        remarks,
      });
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Assignment failed.",
      );
    } finally {
      setBusy("");
    }
  }

  async function transition(status: MaintenanceStatus) {
    if (!actorPersonId) {
      setError("Acting person is required.");
      return;
    }

    setBusy(status);
    setError("");

    try {
      await transitionMaintenanceTicket(ticketId, {
        status,
        changedByPersonId: actorPersonId,
        remarks,
      });
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Transition failed.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="loading-state">Loading ticket…</div>;
  }

  if (error && !ticket) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={load}>Retry</button>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Maintenance Operations</p>
          <h1>{ticket.ticketNumber}</h1>
          <p>{ticket.title}</p>
        </div>
        <Link className="secondary-button" href="/maintenance">
          Back to Maintenance
        </Link>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Ticket Details</h2>
          <dl className="details-list">
            <div><dt>Status</dt><dd>{ticket.status}</dd></div>
            <div><dt>Priority</dt><dd>{ticket.priority}</dd></div>
            <div><dt>Category</dt><dd>{ticket.category?.name ?? ticket.categoryId}</dd></div>
            <div><dt>Property</dt><dd>{ticket.propertyId}</dd></div>
            <div><dt>Space</dt><dd>{ticket.spaceId ?? "—"}</dd></div>
            <div><dt>Reporter</dt><dd>{ticket.reporterPersonId}</dd></div>
            <div><dt>Assignee</dt><dd>{ticket.assigneePersonId ?? "Unassigned"}</dd></div>
            <div><dt>SLA Due</dt><dd>{formatDate(ticket.slaDueAt)}</dd></div>
          </dl>
          <p>{ticket.description}</p>
        </section>

        <section className="panel">
          <h2>Actions</h2>

          {ticket.status === "OPEN" ? (
            <div className="stack">
              <input
                placeholder="Assignee person ID"
                value={assigneePersonId}
                onChange={(event) =>
                  setAssigneePersonId(event.target.value)
                }
              />
              <button
                disabled={busy === "assign"}
                onClick={assign}
              >
                {busy === "assign" ? "Assigning…" : "Assign"}
              </button>
            </div>
          ) : null}

          <div className="stack">
            <input
              placeholder="Acting person ID"
              value={actorPersonId}
              onChange={(event) =>
                setActorPersonId(event.target.value)
              }
            />
            <textarea
              placeholder="Remarks"
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </div>

          <div className="button-row">
            {(transitions[ticket.status] ?? []).map((status) => (
              <button
                disabled={busy === status}
                key={status}
                onClick={() => transition(status)}
              >
                {status.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          {error ? <p className="text-danger">{error}</p> : null}
        </section>
      </div>

      <section className="panel">
        <h2>Status History</h2>
        {ticket.history?.length ? (
          <div className="timeline">
            {ticket.history.map((entry) => (
              <article key={entry.id} className="timeline-item">
                <strong>{entry.toStatus.replaceAll("_", " ")}</strong>
                <span>{formatDate(entry.createdAt)}</span>
                <p>{entry.remarks ?? "No remarks"}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>No history available.</p>
        )}
      </section>
    </div>
  );
}
