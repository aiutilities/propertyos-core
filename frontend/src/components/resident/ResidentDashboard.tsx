"use client";

import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { useVisitors } from "@/hooks/useVisitors";

function isUpcoming(value: string) {
  return new Date(value).getTime() >= Date.now();
}

export default function ResidentDashboard() {
  const user = getSessionUser();
  const personId = user?.id;

  const { items, loading, error } = useVisitors({
    hostPersonId: personId,
  });

  const upcomingVisitors = items.filter(
    (visit) =>
      isUpcoming(visit.visitDate) &&
      !["rejected", "cancelled", "expired", "checked_out"].includes(
        visit.status,
      ),
  );

  const currentlyInside = items.filter(
    (visit) => visit.status === "checked_in",
  );

  const completedVisits = items.filter(
    (visit) => visit.status === "checked_out",
  );

  if (!user) {
    return <p className="error">Resident session is unavailable.</p>;
  }

  return (
    <>
      <section className="resident-profile-card">
        <div>
          <p className="eyebrow">Resident Profile</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>

        <Link className="button-link" href="/resident/visitors/new">
          Invite Visitor
        </Link>
      </section>

      {loading && <p>Loading resident dashboard...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="resident-summary-grid">
            <div className="card">
              <h3>Upcoming Visitors</h3>
              <strong>{upcomingVisitors.length}</strong>
            </div>

            <div className="card">
              <h3>Currently Inside</h3>
              <strong>{currentlyInside.length}</strong>
            </div>

            <div className="card">
              <h3>Completed Visits</h3>
              <strong>{completedVisits.length}</strong>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Upcoming</p>
                <h2>Expected visitors</h2>
              </div>

              <Link
                className="button-link secondary"
                href="/resident/visitors"
              >
                View All Visitors
              </Link>
            </div>

            {upcomingVisitors.length === 0 ? (
              <p>No upcoming visitors.</p>
            ) : (
              <div className="resident-visitor-grid">
                {upcomingVisitors.slice(0, 6).map((visit) => (
                  <article className="resident-visitor-card" key={visit.id}>
                    <div>
                      <h3>
                        {visit.visitor?.fullName ?? "Visitor"}
                      </h3>
                      <p>{visit.visitor?.mobile ?? "Mobile unavailable"}</p>
                      <p>{visit.visitPurpose ?? "Purpose not provided"}</p>
                    </div>

                    <div>
                      <strong>
                        {new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(visit.visitDate))}
                      </strong>
                    </div>

                    <Link
                      className="button-link secondary"
                      href={`/visitors/${visit.id}`}
                    >
                      View
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
