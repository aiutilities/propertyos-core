"use client";

import Link from "next/link";

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

function statusClass(
  status: string,
) {
  return `status-badge status-${status
    .toLowerCase()
    .replaceAll("_", "-")}`;
}

export default function ReservationTable({
  reservations,
}: {
  reservations: Reservation[];
}) {
  if (
    reservations.length === 0
  ) {
    return (
      <div className="empty-state">
        <h3>
          No reservations found
        </h3>
        <p>
          Create a booking or adjust the
          current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Reservation</th>
              <th>Title</th>
              <th>Resource</th>
              <th>Schedule</th>
              <th>Attendees</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map(
              (reservation) => (
                <tr
                  key={reservation.id}
                >
                  <td>
                    <Link
                      href={`/reservations/${reservation.id}`}
                    >
                      {
                        reservation.reservationNumber
                      }
                    </Link>
                  </td>

                  <td>
                    {reservation.title}
                  </td>

                  <td>
                    {reservation.resource
                      ?.name ??
                      reservation.resourceId}
                  </td>

                  <td>
                    <div>
                      <strong>
                        {formatDate(
                          reservation.startAt,
                        )}
                      </strong>
                      <br />
                      <span>
                        to{" "}
                        {formatDate(
                          reservation.endAt,
                        )}
                      </span>
                    </div>
                  </td>

                  <td>
                    {
                      reservation.attendeeCount
                    }
                  </td>

                  <td>
                    <span
                      className={statusClass(
                        reservation.status,
                      )}
                    >
                      {reservation.status.replaceAll(
                        "_",
                        " ",
                      )}
                    </span>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
