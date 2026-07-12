"use client";

import {
  useState,
} from "react";

import {
  useReservations,
} from "@/hooks/useReservations";
import {
  ReservationStatus,
} from "@/types/reservation";

import ReservationMetrics from "./ReservationMetrics";
import ReservationTable from "./ReservationTable";

const statuses:
  ReservationStatus[] = [
    "PENDING",
    "APPROVED",
    "CHECKED_IN",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
    "NO_SHOW",
  ];

export default function ReservationDashboard() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    ReservationStatus | ""
  >("");

  const {
    reservations,
    metrics,
    loading,
    error,
    refresh,
  } = useReservations({
    search,
    status,
  });

  return (
    <div className="stack-lg">
      <ReservationMetrics
        metrics={metrics}
      />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search reservations"
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search reservation number or title"
            value={search}
          />

          <select
            aria-label="Filter by reservation status"
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  | ReservationStatus
                  | "",
              )
            }
            value={status}
          >
            <option value="">
              All statuses
            </option>

            {statuses.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value.replaceAll(
                    "_",
                    " ",
                  )}
                </option>
              ),
            )}
          </select>

          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading reservations…
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

      {!loading && !error ? (
        <ReservationTable
          reservations={reservations}
        />
      ) : null}
    </div>
  );
}
