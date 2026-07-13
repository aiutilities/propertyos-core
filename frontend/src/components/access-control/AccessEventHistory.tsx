"use client";

import { useCallback, useEffect, useState } from "react";

import { listAccessEvents } from "@/hooks/useAccessControl";
import {
  AccessDecision,
  AccessEvent,
  AccessEventType,
  AccessSubjectType,
} from "@/types/access-control";

const SUBJECT_TYPES: AccessSubjectType[] = [
  "PERSON",
  "STAFF",
  "VISITOR",
  "VEHICLE",
];

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function AccessEventHistory() {
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    propertyId: "",
    accessPointId: "",
    subjectType: "" as AccessSubjectType | "",
    subjectId: "",
    eventType: "" as AccessEventType | "",
    decision: "" as AccessDecision | "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setEvents(
        await listAccessEvents({
          propertyId: filters.propertyId || undefined,
          accessPointId: filters.accessPointId || undefined,
          subjectType: filters.subjectType || undefined,
          subjectId: filters.subjectId || undefined,
          eventType: filters.eventType || undefined,
          decision: filters.decision || undefined,
          limit: 200,
        }),
      );
    } catch (caught) {
      setEvents([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load access events.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.accessPointId,
    filters.subjectType,
    filters.subjectId,
    filters.eventType,
    filters.decision,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Property ID"
            value={filters.propertyId}
            onChange={(event) =>
              setFilters({
                ...filters,
                propertyId: event.target.value,
              })
            }
          />

          <input
            placeholder="Access Point ID"
            value={filters.accessPointId}
            onChange={(event) =>
              setFilters({
                ...filters,
                accessPointId: event.target.value,
              })
            }
          />

          <select
            value={filters.subjectType}
            onChange={(event) =>
              setFilters({
                ...filters,
                subjectType: event.target.value as AccessSubjectType | "",
              })
            }
          >
            <option value="">All subjects</option>

            {SUBJECT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <input
            placeholder="Subject ID"
            value={filters.subjectId}
            onChange={(event) =>
              setFilters({
                ...filters,
                subjectId: event.target.value,
              })
            }
          />

          <select
            value={filters.eventType}
            onChange={(event) =>
              setFilters({
                ...filters,
                eventType: event.target.value as AccessEventType | "",
              })
            }
          >
            <option value="">Entry and exit</option>
            <option value="ENTRY">Entry</option>
            <option value="EXIT">Exit</option>
          </select>

          <select
            value={filters.decision}
            onChange={(event) =>
              setFilters({
                ...filters,
                decision: event.target.value as AccessDecision | "",
              })
            }
          >
            <option value="">All decisions</option>
            <option value="GRANTED">Granted</option>
            <option value="DENIED">Denied</option>
          </select>

          <button onClick={() => void load()} type="button">
            Refresh
          </button>
        </div>
      </section>

      {error ? <div className="error-state">{error}</div> : null}

      {loading ? (
        <div className="loading-state">Loading access events…</div>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Access Point</th>
                  <th>Subject</th>
                  <th>Event</th>
                  <th>Decision</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.occurredAt)}</td>
                    <td>{event.accessPointId}</td>
                    <td>
                      {event.subjectType ?? "UNKNOWN"}
                      <div className="muted-text">{event.subjectId ?? "—"}</div>
                    </td>
                    <td>{event.eventType}</td>
                    <td>{event.decision}</td>
                    <td>{event.denialReason ?? "—"}</td>
                  </tr>
                ))}

                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No access events found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
