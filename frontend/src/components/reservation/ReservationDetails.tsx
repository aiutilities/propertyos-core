"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import PersonLookup from "@/components/common/PersonLookup";
import {
  approveReservation,
  cancelReservation,
  checkInReservation,
  completeReservation,
  getReservation,
  markReservationNoShow,
  rejectReservation,
} from "@/hooks/useReservations";
import {
  Reservation,
} from "@/types/reservation";

function formatDate(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function ReservationDetails({
  reservationId,
}: {
  reservationId: string;
}) {
  const [
    reservation,
    setReservation,
  ] = useState<Reservation | null>(
    null,
  );

  const [
    actorPersonId,
    setActorPersonId,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setReservation(
        await getReservation(
          reservationId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reservation.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [reservationId]);

  async function runAction(
    action:
      | "approve"
      | "reject"
      | "cancel"
      | "check-in"
      | "complete"
      | "no-show",
  ) {
    if (!actorPersonId) {
      setError(
        "Acting person is required.",
      );
      return;
    }

    setBusy(action);
    setError("");

    try {
      if (action === "approve") {
        await approveReservation(
          reservationId,
          {
            approvedByPersonId:
              actorPersonId,
            remarks:
              remarks || undefined,
          },
        );
      }

      if (action === "reject") {
        await rejectReservation(
          reservationId,
          {
            rejectedByPersonId:
              actorPersonId,
            reason:
              remarks ||
              "Reservation rejected",
          },
        );
      }

      if (action === "cancel") {
        await cancelReservation(
          reservationId,
          {
            cancelledByPersonId:
              actorPersonId,
            reason:
              remarks ||
              "Reservation cancelled",
          },
        );
      }

      if (action === "check-in") {
        await checkInReservation(
          reservationId,
          {
            changedByPersonId:
              actorPersonId,
            remarks:
              remarks || undefined,
          },
        );
      }

      if (action === "complete") {
        await completeReservation(
          reservationId,
          {
            changedByPersonId:
              actorPersonId,
            remarks:
              remarks || undefined,
          },
        );
      }

      if (action === "no-show") {
        await markReservationNoShow(
          reservationId,
          {
            changedByPersonId:
              actorPersonId,
            remarks:
              remarks || undefined,
          },
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Reservation action failed.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading reservation…
      </div>
    );
  }

  if (
    error &&
    !reservation
  ) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Booking Operations
          </p>
          <h1>
            {
              reservation.reservationNumber
            }
          </h1>
          <p>
            {reservation.title}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/reservations"
        >
          Back to Reservations
        </Link>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>
            Reservation Details
          </h2>

          <dl className="details-list">
            <div>
              <dt>Status</dt>
              <dd>
                {reservation.status.replaceAll(
                  "_",
                  " ",
                )}
              </dd>
            </div>

            <div>
              <dt>Resource</dt>
              <dd>
                {reservation.resource
                  ?.name ??
                  reservation.resourceId}
              </dd>
            </div>

            <div>
              <dt>Property</dt>
              <dd>
                {
                  reservation.propertyId
                }
              </dd>
            </div>

            <div>
              <dt>Requester</dt>
              <dd>
                {
                  reservation.requesterPersonId
                }
              </dd>
            </div>

            <div>
              <dt>Beneficiary</dt>
              <dd>
                {reservation.beneficiaryPersonId ??
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Start</dt>
              <dd>
                {formatDate(
                  reservation.startAt,
                )}
              </dd>
            </div>

            <div>
              <dt>End</dt>
              <dd>
                {formatDate(
                  reservation.endAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Attendees</dt>
              <dd>
                {
                  reservation.attendeeCount
                }
              </dd>
            </div>

            <div>
              <dt>Approval</dt>
              <dd>
                {reservation.approvalRequired
                  ? "Required"
                  : "Automatic"}
              </dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>
                {formatDate(
                  reservation.createdAt,
                )}
              </dd>
            </div>
          </dl>

          {reservation.description ? (
            <p>
              {
                reservation.description
              }
            </p>
          ) : null}

          {reservation.notes ? (
            <p>
              <strong>Notes:</strong>{" "}
              {reservation.notes}
            </p>
          ) : null}
        </section>

        <section className="panel">
          <h2>Actions</h2>

          <div className="stack">
            <label>
              Acting Person
              <PersonLookup
                required
                value={actorPersonId}
                onChange={
                  setActorPersonId
                }
              />
            </label>

            <label>
              Remarks or Reason
              <textarea
                rows={4}
                value={remarks}
                onChange={(event) =>
                  setRemarks(
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="button-row">
            {reservation.status ===
            "PENDING" ? (
              <>
                <button
                  disabled={
                    busy === "approve"
                  }
                  onClick={() =>
                    runAction(
                      "approve",
                    )
                  }
                >
                  Approve
                </button>

                <button
                  className="secondary-button"
                  disabled={
                    busy === "reject"
                  }
                  onClick={() =>
                    runAction(
                      "reject",
                    )
                  }
                >
                  Reject
                </button>
              </>
            ) : null}

            {[
              "PENDING",
              "APPROVED",
            ].includes(
              reservation.status,
            ) ? (
              <button
                className="secondary-button"
                disabled={
                  busy === "cancel"
                }
                onClick={() =>
                  runAction(
                    "cancel",
                  )
                }
              >
                Cancel
              </button>
            ) : null}

            {reservation.status ===
            "APPROVED" ? (
              <>
                <button
                  disabled={
                    busy === "check-in"
                  }
                  onClick={() =>
                    runAction(
                      "check-in",
                    )
                  }
                >
                  Check In
                </button>

                <button
                  className="secondary-button"
                  disabled={
                    busy === "no-show"
                  }
                  onClick={() =>
                    runAction(
                      "no-show",
                    )
                  }
                >
                  Mark No Show
                </button>
              </>
            ) : null}

            {reservation.status ===
            "CHECKED_IN" ? (
              <button
                disabled={
                  busy === "complete"
                }
                onClick={() =>
                  runAction(
                    "complete",
                  )
                }
              >
                Complete
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="text-danger">
              {error}
            </p>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <h2>Status History</h2>

        {reservation.history
          ?.length ? (
          <div className="timeline">
            {reservation.history.map(
              (entry) => (
                <article
                  className="timeline-item"
                  key={entry.id}
                >
                  <strong>
                    {entry.toStatus.replaceAll(
                      "_",
                      " ",
                    )}
                  </strong>

                  <span>
                    {formatDate(
                      entry.createdAt,
                    )}
                  </span>

                  <p>
                    {entry.remarks ??
                      "No remarks"}
                  </p>
                </article>
              ),
            )}
          </div>
        ) : (
          <p>
            No history available.
          </p>
        )}
      </section>
    </div>
  );
}
