"use client";

import Link from "next/link";

import {
  useReservations,
} from "@/hooks/useReservations";
import {
  getSessionUser,
} from "@/lib/session";

import ReservationTable from "./ReservationTable";

export default function ResidentReservationList() {
  const user = getSessionUser();
  const requesterPersonId =
    user?.id ?? "";

  const {
    reservations,
    loading,
    error,
    refresh,
  } = useReservations({
    requesterPersonId,
  });

  if (!user) {
    return (
      <div className="error-state">
        Resident session is unavailable.
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="resident-profile-card">
        <div>
          <p className="eyebrow">
            Resident Bookings
          </p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>

        <Link
          className="button-link"
          href="/resident/reservations/new"
        >
          Book a Resource
        </Link>
      </section>

      <section className="panel">
        <div className="toolbar">
          <p>
            Showing reservations requested
            using your resident account.
          </p>

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
          Loading your reservations…
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
