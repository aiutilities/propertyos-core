"use client";

import {
  useState,
} from "react";

import {
  useHelpdesk,
} from "@/hooks/useHelpdesk";

import {
  HelpdeskPriority,
  HelpdeskStatus,
} from "@/types/helpdesk";

import HelpdeskMetrics from "./HelpdeskMetrics";
import HelpdeskTable from "./HelpdeskTable";

export default function HelpdeskDashboard() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    HelpdeskStatus | ""
  >("");

  const [
    priority,
    setPriority,
  ] = useState<
    HelpdeskPriority | ""
  >("");

  const {
    items,
    metrics,
    loading,
    error,
    refresh,
  } = useHelpdesk({
    search,
    status,
    priority,
  });

  return (
    <div className="stack-lg">
      <HelpdeskMetrics
        metrics={metrics}
      />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search helpdesk tickets"
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search ticket number, title, or description"
            value={search}
          />

          <select
            aria-label="Filter by status"
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  | HelpdeskStatus
                  | "",
              )
            }
            value={status}
          >
            <option value="">
              All statuses
            </option>

            {[
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS",
              "ESCALATED",
              "RESOLVED",
              "CLOSED",
              "REOPENED",
              "CANCELLED",
            ].map(
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

          <select
            aria-label="Filter by priority"
            onChange={(event) =>
              setPriority(
                event.target
                  .value as
                  | HelpdeskPriority
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
              "MEDIUM",
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
          Loading helpdesk tickets…
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
        <HelpdeskTable
          items={items}
        />
      ) : null}
    </div>
  );
}
