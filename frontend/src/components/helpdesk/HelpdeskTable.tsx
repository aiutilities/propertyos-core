"use client";

import Link from "next/link";

import {
  HelpdeskTicket,
} from "@/types/helpdesk";

import {
  HelpdeskPriorityBadge,
} from "./HelpdeskPriorityBadge";

import {
  HelpdeskSlaCountdown,
} from "./HelpdeskSlaCountdown";

import {
  HelpdeskStatusBadge,
} from "./HelpdeskStatusBadge";

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
  ).format(
    new Date(value),
  );
}


export default function HelpdeskTable({
  items,
  residentMode = false,
}: {
  items: HelpdeskTicket[];
  residentMode?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>
          No helpdesk tickets found
        </h3>
        <p>
          Create a ticket or adjust the current
          filters.
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
              <th>Ticket</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Resolution SLA</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {items.map(
              (ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link
                      href={
                        residentMode
                          ? `/resident/helpdesk/${ticket.id}`
                          : `/helpdesk/${ticket.id}`
                      }
                    >
                      {ticket.ticketNumber}
                    </Link>
                  </td>

                  <td>
                    {ticket.title}
                  </td>

                  <td>
                    <HelpdeskPriorityBadge
                      priority={ticket.priority}
                    />
                  </td>

                  <td>
                    <HelpdeskStatusBadge
                      status={ticket.status}
                    />
                  </td>

                  <td>
                    <div className="stack-xs">
                      <span>
                        {formatDate(
                          ticket.resolutionDueAt,
                        )}
                      </span>

                      <HelpdeskSlaCountdown
                        dueAt={
                          ticket.resolutionDueAt
                        }
                      />
                    </div>
                  </td>

                  <td>
                    {formatDate(
                      ticket.createdAt,
                    )}
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
