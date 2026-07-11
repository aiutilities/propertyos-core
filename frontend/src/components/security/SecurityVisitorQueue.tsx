"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useVisitors } from "@/hooks/useVisitors";
import type { Visit } from "@/types/visitor";
import VisitorStatusBadge from "@/components/visitor/VisitorStatusBadge";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function SecurityVisitorQueue() {
  const { items, loading, error, refresh } = useVisitors();
  const [busyVisitId, setBusyVisitId] = useState("");
  const [actionError, setActionError] = useState("");

  const todayVisitors = useMemo(
    () =>
      items.filter(
        (visit) =>
          isToday(visit.visitDate) &&
          !["rejected", "cancelled", "expired"].includes(visit.status),
      ),
    [items],
  );

  const waitingVisitors = useMemo(
    () =>
      todayVisitors.filter((visit) =>
        ["approved", "arrived"].includes(visit.status),
      ),
    [todayVisitors],
  );

  const checkedInVisitors = useMemo(
    () =>
      items.filter((visit) => visit.status === "checked_in"),
    [items],
  );

  async function action(
    visit: Visit,
    operation: "arrive" | "check-in" | "check-out",
  ) {
    setBusyVisitId(visit.id);
    setActionError("");

    try {
      const body =
        operation === "check-in" || operation === "check-out"
          ? {
              gate: "Main Gate",
            }
          : undefined;

      await apiRequest(
        `/plugins/visitor/${visit.id}/${operation}`,
        {
          method: "POST",
          body: JSON.stringify(body ?? {}),
        },
      );

      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Unable to ${operation.replace("-", " ")} visitor.`,
      );
    } finally {
      setBusyVisitId("");
    }
  }

  function renderVisitor(
    visit: Visit,
    operation?: "arrive" | "check-in" | "check-out",
    actionLabel?: string,
  ) {
    return (
      <article className="security-visitor-card" key={visit.id}>
        <div>
          <div className="security-visitor-heading">
            <h3>{visit.visitor?.fullName ?? "Visitor"}</h3>
            <VisitorStatusBadge status={visit.status} />
          </div>

          <p>{visit.visitor?.mobile ?? "Mobile unavailable"}</p>
          <p>{visit.visitPurpose ?? "Purpose not provided"}</p>
          <p>
            Expected: <strong>{formatTime(visit.visitDate)}</strong>
          </p>
        </div>

        <div className="security-card-actions">
          <Link
            className="button-link secondary"
            href={`/visitors/${visit.id}`}
          >
            Details
          </Link>

          {operation && actionLabel && (
            <button
              disabled={Boolean(busyVisitId)}
              onClick={() => void action(visit, operation)}
              type="button"
            >
              {busyVisitId === visit.id
                ? "Processing..."
                : actionLabel}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      <section className="security-summary-grid">
        <div className="card">
          <h3>Today’s Visitors</h3>
          <strong>{todayVisitors.length}</strong>
        </div>

        <div className="card">
          <h3>Waiting at Gate</h3>
          <strong>{waitingVisitors.length}</strong>
        </div>

        <div className="card">
          <h3>Currently Inside</h3>
          <strong>{checkedInVisitors.length}</strong>
        </div>
      </section>

      <div className="security-refresh">
        <button onClick={() => void refresh()} type="button">
          Refresh Queue
        </button>
      </div>

      {loading && <p>Loading security queue...</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      {!loading && !error && (
        <>
          <section className="security-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Gate Queue</p>
                <h2>Waiting visitors</h2>
              </div>
            </div>

            {waitingVisitors.length === 0 ? (
              <p>No visitors are currently waiting at the gate.</p>
            ) : (
              <div className="security-card-grid">
                {waitingVisitors.map((visit) =>
                  visit.status === "approved"
                    ? renderVisitor(
                        visit,
                        "arrive",
                        "Mark Arrived",
                      )
                    : renderVisitor(
                        visit,
                        "check-in",
                        "Check In",
                      ),
                )}
              </div>
            )}
          </section>

          <section className="security-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">On Premises</p>
                <h2>Checked-in visitors</h2>
              </div>
            </div>

            {checkedInVisitors.length === 0 ? (
              <p>No visitors are currently checked in.</p>
            ) : (
              <div className="security-card-grid">
                {checkedInVisitors.map((visit) =>
                  renderVisitor(
                    visit,
                    "check-out",
                    "Check Out",
                  ),
                )}
              </div>
            )}
          </section>

          <section className="security-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Daily Schedule</p>
                <h2>All visitors today</h2>
              </div>
            </div>

            {todayVisitors.length === 0 ? (
              <p>No visitor appointments are scheduled for today.</p>
            ) : (
              <div className="security-card-grid">
                {todayVisitors.map((visit) =>
                  renderVisitor(visit),
                )}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
