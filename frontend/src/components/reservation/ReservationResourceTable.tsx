"use client";

import Link from "next/link";

import {
  ReservationResource,
} from "@/types/reservation";

export default function ReservationResourceTable({
  resources,
}: {
  resources: ReservationResource[];
}) {
  if (
    resources.length === 0
  ) {
    return (
      <div className="empty-state">
        <h3>
          No booking resources found
        </h3>
        <p>
          Add a resource or adjust the current filters.
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
              <th>Resource</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Approval</th>
              <th>Booking Rules</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {resources.map(
              (resource) => (
                <tr key={resource.id}>
                  <td>
                    <Link
                      href={`/reservations/resources/${resource.id}`}
                    >
                      {resource.name}
                    </Link>
                    <br />
                    <small>
                      {resource.code}
                    </small>
                  </td>

                  <td>
                    {resource.resourceType.replaceAll(
                      "_",
                      " ",
                    )}
                  </td>

                  <td>
                    {resource.capacity}
                  </td>

                  <td>
                    {resource.requiresApproval
                      ? "Required"
                      : "Automatic"}
                  </td>

                  <td>
                    <span>
                      {resource.minimumDurationMinutes}
                      {" min minimum"}
                    </span>
                    <br />
                    <small>
                      Up to{" "}
                      {resource.advanceBookingDays}
                      {" days ahead"}
                    </small>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        resource.isActive
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {resource.isActive
                        ? "ACTIVE"
                        : "INACTIVE"}
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
