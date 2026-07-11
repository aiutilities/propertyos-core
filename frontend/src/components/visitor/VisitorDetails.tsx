"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useVisitor } from "@/hooks/useVisitor";
import type { QrPassResponse } from "@/types/visitor";
import VisitorStatusBadge from "./VisitorStatusBadge";
import QrPassCard from "@/components/qr/QrPassCard";

function formatDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VisitorDetails({ visitId }: { visitId: string }) {
  const { visit, history, loading, error, refresh } = useVisitor(visitId);
  const [busyAction, setBusyAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrExpiry, setQrExpiry] = useState("");

  async function postAction(
    action: string,
    body?: Record<string, unknown>,
  ) {
    setBusyAction(action);
    setActionError("");

    try {
      await apiRequest(`/plugins/visitor/${visitId}/${action}`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      });

      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : `Unable to ${action}.`,
      );
    } finally {
      setBusyAction("");
    }
  }

  async function generateQr() {
    setBusyAction("generate-qr");
    setActionError("");

    try {
      const response = await apiRequest<QrPassResponse>(
        `/plugins/visitor/${visitId}/generate-qr`,
        {
          method: "POST",
        },
      );

      setQrToken(response.data.qrToken);
      setQrExpiry(response.data.expiresAt);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to generate QR pass.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function reject() {
    const reason = window.prompt("Reason for rejection:");

    if (!reason?.trim()) return;

    await postAction("reject", { reason: reason.trim() });
  }

  async function cancel() {
    const reason = window.prompt("Reason for cancellation:");

    if (!reason?.trim()) return;

    await postAction("cancel", { reason: reason.trim() });
  }

  if (loading) {
    return <p>Loading visitor details...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!visit) {
    return <p>Visitor record not found.</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Visitor Operations</p>
          <h1>{visit.visitor?.fullName ?? "Visitor Details"}</h1>
        </div>

        <Link className="button-link secondary" href="/visitors">
          Back to Visitors
        </Link>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Visit</p>
            <h2>Visit information</h2>
          </div>
        </div>

        <table className="table">
          <tbody>
            <tr>
              <th>Status</th>
              <td>
                <VisitorStatusBadge status={visit.status} />
              </td>
            </tr>
            <tr>
              <th>Visitor</th>
              <td>{visit.visitor?.fullName ?? visit.visitorId}</td>
            </tr>
            <tr>
              <th>Mobile</th>
              <td>{visit.visitor?.mobile ?? "—"}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{visit.visitor?.email ?? "—"}</td>
            </tr>
            <tr>
              <th>Purpose</th>
              <td>{visit.visitPurpose ?? "—"}</td>
            </tr>
            <tr>
              <th>Visit date</th>
              <td>{formatDate(visit.visitDate)}</td>
            </tr>
            <tr>
              <th>Property ID</th>
              <td>{visit.propertyId}</td>
            </tr>
            <tr>
              <th>Host ID</th>
              <td>{visit.hostPersonId}</td>
            </tr>
            <tr>
              <th>Checked in</th>
              <td>{formatDate(visit.checkedInAt)}</td>
            </tr>
            <tr>
              <th>Checked out</th>
              <td>{formatDate(visit.checkedOutAt)}</td>
            </tr>
            <tr>
              <th>Notes</th>
              <td>{visit.notes ?? "—"}</td>
            </tr>
          </tbody>
        </table>

        <div className="actions visitor-actions">
          {visit.status === "invited" && (
            <>
              <button
                disabled={Boolean(busyAction)}
                onClick={() => void postAction("approve", {})}
                type="button"
              >
                Approve
              </button>

              <button
                className="secondary"
                disabled={Boolean(busyAction)}
                onClick={() => void reject()}
                type="button"
              >
                Reject
              </button>
            </>
          )}

          {["invited", "approved"].includes(visit.status) && (
            <button
              disabled={Boolean(busyAction)}
              onClick={() => void generateQr()}
              type="button"
            >
              Generate QR Pass
            </button>
          )}

          {visit.status === "approved" && (
            <button
              disabled={Boolean(busyAction)}
              onClick={() => void postAction("arrive")}
              type="button"
            >
              Mark Arrived
            </button>
          )}

          {visit.status === "arrived" && (
            <button
              disabled={Boolean(busyAction)}
              onClick={() =>
                void postAction("check-in", { gate: "Main Gate" })
              }
              type="button"
            >
              Check In
            </button>
          )}

          {visit.status === "checked_in" && (
            <button
              disabled={Boolean(busyAction)}
              onClick={() =>
                void postAction("check-out", { gate: "Main Gate" })
              }
              type="button"
            >
              Check Out
            </button>
          )}

          {!["checked_out", "cancelled", "rejected", "expired"].includes(
            visit.status,
          ) && (
            <button
              className="secondary"
              disabled={Boolean(busyAction)}
              onClick={() => void cancel()}
              type="button"
            >
              Cancel Visit
            </button>
          )}
        </div>
      </section>

      {qrToken && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Credential</p>
              <h2>QR pass generated</h2>
            </div>
          </div>

          <QrPassCard
            expiresAt={qrExpiry}
            token={qrToken}
          />
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Audit Trail</p>
            <h2>Status history</h2>
          </div>
        </div>

        {history.length === 0 ? (
          <p>No status history is available.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Previous</th>
                  <th>Reason</th>
                  <th>Changed</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.newStatus.replaceAll("_", " ")}</td>
                    <td>{entry.previousStatus?.replaceAll("_", " ") ?? "—"}</td>
                    <td>{entry.changeReason ?? "—"}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
