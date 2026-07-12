"use client";

import Link from "next/link";
import { MaintenanceTicket } from "@/types/maintenance";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isOverdue(ticket: MaintenanceTicket) {
  if (
    !ticket.slaDueAt ||
    ["RESOLVED", "CLOSED", "CANCELLED", "REJECTED"].includes(
      ticket.status,
    )
  ) {
    return false;
  }

  return new Date(ticket.slaDueAt).getTime() < Date.now();
}

export default function MaintenanceTable({
  items,
}: {
  items: MaintenanceTicket[];
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No maintenance tickets found</h3>
        <p>Create a ticket or adjust the current filters.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link href={`/maintenance/${ticket.id}`}>
                    {ticket.ticketNumber}
                  </Link>
                </td>
                <td>{ticket.title}</td>
                <td>
                  <span
                    className={`status-badge status-${ticket.priority.toLowerCase()}`}
                  >
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className="status-badge">
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      isOverdue(ticket) ? "text-danger" : undefined
                    }
                  >
                    {formatDate(ticket.slaDueAt)}
                  </span>
                </td>
                <td>{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
