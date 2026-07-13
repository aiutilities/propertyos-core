"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  useCommunications,
} from "@/hooks/useCommunications";

import {
  CommunicationPriority,
  CommunicationStatus,
  CommunicationType,
} from "@/types/communication";

import {
  CommunicationPriorityBadge,
} from "./CommunicationPriorityBadge";

import {
  CommunicationStatusBadge,
} from "./CommunicationStatusBadge";

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

export default function CommunicationsDashboard() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    CommunicationStatus | ""
  >("");

  const [
    priority,
    setPriority,
  ] = useState<
    CommunicationPriority | ""
  >("");

  const [
    type,
    setType,
  ] = useState<
    CommunicationType | ""
  >("");

  const {
    items,
    metrics,
    loading,
    error,
    refresh,
  } = useCommunications({
    search,
    status,
    priority,
    type,
  });

  const cards = [
    [
      "Total",
      metrics?.total ?? 0,
    ],
    [
      "Draft",
      metrics?.draft ?? 0,
    ],
    [
      "Scheduled",
      metrics?.scheduled ?? 0,
    ],
    [
      "Published",
      metrics?.published ?? 0,
    ],
    [
      "Urgent",
      metrics?.urgent ?? 0,
    ],
    [
      "Pinned",
      metrics?.pinned ?? 0,
    ],
    [
      "Acknowledgement",
      metrics?.acknowledgementRequired ??
        0,
    ],
  ];

  return (
    <div className="stack-lg">
      <div className="metric-grid">
        {cards.map(
          ([label, value]) => (
            <article
              className="metric-card"
              key={String(label)}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ),
        )}
      </div>

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search communications"
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search number, title, summary, or content"
            value={search}
          />

          <select
            aria-label="Filter by status"
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  | CommunicationStatus
                  | "",
              )
            }
            value={status}
          >
            <option value="">
              All statuses
            </option>

            {[
              "DRAFT",
              "SCHEDULED",
              "PUBLISHED",
              "EXPIRED",
              "ARCHIVED",
              "CANCELLED",
            ].map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </select>

          <select
            aria-label="Filter by priority"
            onChange={(event) =>
              setPriority(
                event.target
                  .value as
                  | CommunicationPriority
                  | "",
              )
            }
            value={priority}
          >
            <option value="">
              All priorities
            </option>

            {[
              "LOW",
              "NORMAL",
              "HIGH",
              "URGENT",
            ].map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </select>

          <select
            aria-label="Filter by type"
            onChange={(event) =>
              setType(
                event.target
                  .value as
                  | CommunicationType
                  | "",
              )
            }
            value={type}
          >
            <option value="">
              All types
            </option>

            {[
              "ANNOUNCEMENT",
              "NOTICE",
              "ALERT",
              "EVENT",
              "POLL",
            ].map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
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
          Loading communications…
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
      items.length === 0 ? (
        <div className="empty-state">
          <h3>
            No communications found
          </h3>
          <p>
            Create a communication or adjust
            the current filters.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      items.length > 0 ? (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Communication</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Publish</th>
                  <th>Expiry</th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        <Link
                          href={`/communications/${item.id}`}
                        >
                          {
                            item.communicationNumber
                          }
                        </Link>
                      </td>

                      <td>
                        {item.isPinned
                          ? "📌 "
                          : ""}
                        {item.title}
                      </td>

                      <td>
                        {item.type}
                      </td>

                      <td>
                        <CommunicationPriorityBadge
                          priority={
                            item.priority
                          }
                        />
                      </td>

                      <td>
                        <CommunicationStatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td>
                        {formatDate(
                          item.publishAt ??
                            item.publishedAt,
                        )}
                      </td>

                      <td>
                        {formatDate(
                          item.expiresAt,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
