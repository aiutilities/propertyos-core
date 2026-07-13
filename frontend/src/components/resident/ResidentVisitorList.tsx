"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { useVisitors } from "@/hooks/useVisitors";
import VisitorStatusBadge from "@/components/visitor/VisitorStatusBadge";
import type { Visit } from "@/types/visitor";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ResidentVisitorList() {
  const user = getSessionUser();
  const [search, setSearch] = useState("");
  const [busyVisitId, setBusyVisitId] = useState("");
  const [actionError, setActionError] = useState("");

  const { items, loading, error, refresh } = useVisitors({
    hostPersonId: user?.id,
  });

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((visit) =>
      [
        visit.visitor?.fullName,
        visit.visitor?.mobile,
        visit.visitor?.email,
        visit.visitPurpose,
        visit.status,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [items, search]);

  async function cancelVisit(visit: Visit) {
    const reason = window.prompt("Reason for cancelling this visit:");

    if (!reason?.trim()) {
      return;
    }

    setBusyVisitId(visit.id);
    setActionError("");

    try {
      await apiRequest(`/plugins/visitor/${visit.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      });

      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to cancel the visitor invitation.",
      );
    } finally {
      setBusyVisitId("");
    }
  }

  if (!user) {
    return <p className="error">Resident session is unavailable.</p>;
  }

  return (
    <>
      <div className="list-toolbar resident-visitor-toolbar">
        <label>
          Search visitors
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, mobile, purpose or status"
            type="search"
            value={search}
          />
        </label>

        <button onClick={() => void refresh()} type="button">
          Refresh
        </button>
      </div>

      {loading && <p>Loading visitors...</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      {!loading && !error && visibleItems.length === 0 && (
        <p>No visitor invitations found.</p>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Mobile</th>
                <th>Purpose</th>
                <th>Visit Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.visitor?.fullName ?? "Visitor"}</td>
                  <td>{visit.visitor?.mobile ?? "—"}</td>
                  <td>{visit.visitPurpose ?? "—"}</td>
                  <td>{formatDate(visit.visitDate)}</td>
                  <td>
                    <VisitorStatusBadge status={visit.status} />
                  </td>
                  <td>
                    <div className="resident-table-actions">
                      <Link
                        className="button-link secondary"
                        href={`/visitors/${visit.id}`}
                      >
                        View
                      </Link>

                      {![
                        "checked_out",
                        "cancelled",
                        "rejected",
                        "expired",
                      ].includes(visit.status) && (
                        <button
                          className="secondary"
                          disabled={Boolean(busyVisitId)}
                          onClick={() => void cancelVisit(visit)}
                          type="button"
                        >
                          {busyVisitId === visit.id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
