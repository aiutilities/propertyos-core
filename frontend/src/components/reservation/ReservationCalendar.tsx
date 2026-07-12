"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import PropertyLookup from "@/components/common/PropertyLookup";
import {
  useReservations,
} from "@/hooks/useReservations";

function startOfDayIso(
  value: string,
) {
  const date = new Date(
    `${value}T00:00:00`,
  );

  return date.toISOString();
}

function endOfDayIso(
  value: string,
) {
  const date = new Date(
    `${value}T23:59:59`,
  );

  return date.toISOString();
}

function defaultDate(
  daysFromToday: number,
) {
  const date = new Date();

  date.setDate(
    date.getDate() +
      daysFromToday,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

export default function ReservationCalendar() {
  const [
    propertyId,
    setPropertyId,
  ] = useState("");

  const [
    startsFrom,
    setStartsFrom,
  ] = useState(
    defaultDate(0),
  );

  const [
    startsUntil,
    setStartsUntil,
  ] = useState(
    defaultDate(30),
  );

  const {
    reservations,
    loading,
    error,
    refresh,
  } = useReservations({
    propertyId,
    startsFrom:
      startOfDayIso(
        startsFrom,
      ),
    startsUntil:
      endOfDayIso(
        startsUntil,
      ),
  });

  const grouped =
    useMemo(() => {
      const groups =
        new Map<
          string,
          typeof reservations
        >();

      reservations
        .filter(
          (reservation) =>
            ![
              "REJECTED",
              "CANCELLED",
              "NO_SHOW",
            ].includes(
              reservation.status,
            ),
        )
        .sort(
          (left, right) =>
            new Date(
              left.startAt,
            ).getTime() -
            new Date(
              right.startAt,
            ).getTime(),
        )
        .forEach(
          (reservation) => {
            const dateKey =
              new Date(
                reservation.startAt,
              ).toLocaleDateString(
                "en-CA",
              );

            const current =
              groups.get(
                dateKey,
              ) ?? [];

            current.push(
              reservation,
            );

            groups.set(
              dateKey,
              current,
            );
          },
        );

      return Array.from(
        groups.entries(),
      );
    }, [reservations]);

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="form-grid">
          <label>
            Property
            <PropertyLookup
              value={propertyId}
              onChange={setPropertyId}
            />
          </label>

          <label>
            From
            <input
              type="date"
              value={startsFrom}
              onChange={(event) =>
                setStartsFrom(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Until
            <input
              type="date"
              value={startsUntil}
              onChange={(event) =>
                setStartsUntil(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <div className="form-actions">
          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh Calendar
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading booking calendar…
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
      grouped.length === 0 ? (
        <div className="empty-state">
          <h3>
            No scheduled reservations
          </h3>
          <p>
            Adjust the selected calendar
            range or property.
          </p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="stack-lg">
          {grouped.map(
            ([
              dateKey,
              items,
            ]) => (
              <section
                className="panel"
                key={dateKey}
              >
                <h2>
                  {new Intl.DateTimeFormat(
                    "en-IN",
                    {
                      dateStyle:
                        "full",
                    },
                  ).format(
                    new Date(
                      `${dateKey}T00:00:00`,
                    ),
                  )}
                </h2>

                <div className="timeline">
                  {items.map(
                    (reservation) => (
                      <article
                        className="timeline-item"
                        key={
                          reservation.id
                        }
                      >
                        <strong>
                          {
                            reservation.title
                          }
                        </strong>

                        <span>
                          {new Intl.DateTimeFormat(
                            "en-IN",
                            {
                              timeStyle:
                                "short",
                            },
                          ).format(
                            new Date(
                              reservation.startAt,
                            ),
                          )}
                          {" – "}
                          {new Intl.DateTimeFormat(
                            "en-IN",
                            {
                              timeStyle:
                                "short",
                            },
                          ).format(
                            new Date(
                              reservation.endAt,
                            ),
                          )}
                        </span>

                        <p>
                          {reservation.resource
                            ?.name ??
                            reservation.resourceId}
                          {" · "}
                          {
                            reservation.status
                          }
                          {" · "}
                          {
                            reservation.attendeeCount
                          }
                          {" attendee(s)"}
                        </p>

                        <Link
                          href={`/reservations/${reservation.id}`}
                        >
                          View reservation
                        </Link>
                      </article>
                    ),
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
