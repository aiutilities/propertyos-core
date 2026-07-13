"use client";

import Link from "next/link";

import {
  useReservations,
} from "@/hooks/useReservations";
import {
  useVisitors,
} from "@/hooks/useVisitors";
import {
  getSessionUser,
} from "@/lib/session";

function isUpcoming(
  value: string,
) {
  return (
    new Date(value).getTime() >=
    Date.now()
  );
}

export default function ResidentDashboard() {
  const user = getSessionUser();
  const personId = user?.id;

  const {
    items,
    loading:
      visitorsLoading,
    error:
      visitorsError,
  } = useVisitors({
    hostPersonId: personId,
  });

  const {
    reservations,
    loading:
      reservationsLoading,
    error:
      reservationsError,
  } = useReservations({
    requesterPersonId:
      personId,
  });

  const upcomingVisitors =
    items.filter(
      (visit) =>
        isUpcoming(
          visit.visitDate,
        ) &&
        ![
          "rejected",
          "cancelled",
          "expired",
          "checked_out",
        ].includes(
          visit.status,
        ),
    );

  const currentlyInside =
    items.filter(
      (visit) =>
        visit.status ===
        "checked_in",
    );

  const upcomingReservations =
    reservations.filter(
      (reservation) =>
        isUpcoming(
          reservation.startAt,
        ) &&
        ![
          "REJECTED",
          "CANCELLED",
          "NO_SHOW",
          "COMPLETED",
        ].includes(
          reservation.status,
        ),
    );

  if (!user) {
    return (
      <p className="error">
        Resident session is unavailable.
      </p>
    );
  }

  const loading =
    visitorsLoading ||
    reservationsLoading;

  const error =
    visitorsError ||
    reservationsError;

  return (
    <>
      <section className="resident-profile-card">
        <div>
          <p className="eyebrow">
            Resident Profile
          </p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>

        <div className="button-row">
          <Link
            className="button-link secondary"
            href="/resident/reservations/new"
          >
            Book Resource
          </Link>

          <Link
            className="button-link"
            href="/resident/visitors/new"
          >
            Invite Visitor
          </Link>
        </div>
      </section>

      {loading ? (
        <p>
          Loading resident dashboard...
        </p>
      ) : null}

      {error ? (
        <p className="error">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="resident-summary-grid">
            <div className="card">
              <h3>
                Upcoming Visitors
              </h3>
              <strong>
                {
                  upcomingVisitors.length
                }
              </strong>
            </div>

            <div className="card">
              <h3>
                Currently Inside
              </h3>
              <strong>
                {
                  currentlyInside.length
                }
              </strong>
            </div>

            <div className="card">
              <h3>
                Upcoming Bookings
              </h3>
              <strong>
                {
                  upcomingReservations.length
                }
              </strong>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  Bookings
                </p>
                <h2>
                  Upcoming reservations
                </h2>
              </div>

              <Link
                className="button-link secondary"
                href="/resident/reservations"
              >
                View My Bookings
              </Link>
            </div>

            {upcomingReservations.length ===
            0 ? (
              <p>
                No upcoming reservations.
              </p>
            ) : (
              <div className="resident-visitor-grid">
                {upcomingReservations
                  .slice(0, 6)
                  .map(
                    (reservation) => (
                      <article
                        className="resident-visitor-card"
                        key={
                          reservation.id
                        }
                      >
                        <div>
                          <h3>
                            {
                              reservation.title
                            }
                          </h3>

                          <p>
                            {reservation.resource
                              ?.name ??
                              reservation.resourceId}
                          </p>

                          <p>
                            {
                              reservation.status
                            }
                          </p>
                        </div>

                        <strong>
                          {new Intl.DateTimeFormat(
                            "en-IN",
                            {
                              dateStyle:
                                "medium",
                              timeStyle:
                                "short",
                            },
                          ).format(
                            new Date(
                              reservation.startAt,
                            ),
                          )}
                        </strong>

                        <Link
                          className="button-link secondary"
                          href={`/reservations/${reservation.id}`}
                        >
                          View
                        </Link>
                      </article>
                    ),
                  )}
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
