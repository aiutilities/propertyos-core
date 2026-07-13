"use client";

import Link from "next/link";
import {
  useState,
} from "react";

import {
  approveReservation,
  rejectReservation,
  useReservations,
} from "@/hooks/useReservations";
import {
  getSessionUser,
} from "@/lib/session";
import {
  Reservation,
} from "@/types/reservation";

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function ReservationApprovalQueue() {
  const user = getSessionUser();

  const {
    reservations,
    loading,
    error,
    refresh,
  } = useReservations({
    status: "PENDING",
  });

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    busyId,
    setBusyId,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  async function approve(
    reservation: Reservation,
  ) {
    if (!user?.id) {
      setActionError(
        "Approver session is unavailable.",
      );
      return;
    }

    setBusyId(reservation.id);
    setActionError("");

    try {
      await approveReservation(
        reservation.id,
        {
          approvedByPersonId:
            user.id,
          remarks:
            reason || undefined,
        },
      );

      setReason("");
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to approve reservation.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function reject(
    reservation: Reservation,
  ) {
    if (!user?.id) {
      setActionError(
        "Approver session is unavailable.",
      );
      return;
    }

    if (!reason.trim()) {
      setActionError(
        "A rejection reason is required.",
      );
      return;
    }

    setBusyId(reservation.id);
    setActionError("");

    try {
      await rejectReservation(
        reservation.id,
        {
          rejectedByPersonId:
            user.id,
          reason:
            reason.trim(),
        },
      );

      setReason("");
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to reject reservation.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <textarea
            aria-label="Approval remarks or rejection reason"
            placeholder="Optional approval remarks or required rejection reason"
            rows={3}
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value,
              )
            }
          />

          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh Queue
          </button>
        </div>
      </section>

      {actionError ? (
        <div className="error-state">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="loading-state">
          Loading pending approvals…
        </div>
      ) : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refresh}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading &&
      !error &&
      reservations.length === 0 ? (
        <div className="empty-state">
          <h3>
            No pending reservations
          </h3>
          <p>
            All approval requests have
            been processed.
          </p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="security-card-grid">
          {reservations.map(
            (reservation) => (
              <article
                className="security-visitor-card"
                key={reservation.id}
              >
                <div>
                  <h3>
                    {reservation.title}
                  </h3>

                  <p>
                    {
                      reservation.reservationNumber
                    }
                  </p>

                  <p>
                    Resource:{" "}
                    {reservation.resource
                      ?.name ??
                      reservation.resourceId}
                  </p>

                  <p>
                    Requester:{" "}
                    {
                      reservation.requesterPersonId
                    }
                  </p>

                  <p>
                    <strong>
                      {formatDate(
                        reservation.startAt,
                      )}
                    </strong>
                    {" – "}
                    {formatDate(
                      reservation.endAt,
                    )}
                  </p>

                  <p>
                    Attendees:{" "}
                    {
                      reservation.attendeeCount
                    }
                  </p>
                </div>

                <div className="security-card-actions">
                  <Link
                    className="button-link secondary"
                    href={`/reservations/${reservation.id}`}
                  >
                    Details
                  </Link>

                  <button
                    disabled={
                      Boolean(busyId)
                    }
                    onClick={() =>
                      void approve(
                        reservation,
                      )
                    }
                  >
                    {busyId ===
                    reservation.id
                      ? "Processing…"
                      : "Approve"}
                  </button>

                  <button
                    className="secondary-button"
                    disabled={
                      Boolean(busyId)
                    }
                    onClick={() =>
                      void reject(
                        reservation,
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
