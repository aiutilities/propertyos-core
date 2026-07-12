"use client";

import { useState } from "react";
import { useMaintenance } from "@/hooks/useMaintenance";
import {
  MaintenancePriority,
  MaintenanceStatus,
} from "@/types/maintenance";
import MaintenanceMetrics from "./MaintenanceMetrics";
import MaintenanceTable from "./MaintenanceTable";

export default function MaintenanceDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    MaintenanceStatus | ""
  >("");
  const [priority, setPriority] = useState<
    MaintenancePriority | ""
  >("");

  const {
    items,
    metrics,
    loading,
    error,
    refresh,
  } = useMaintenance({
    search,
    status,
    priority,
  });

  return (
    <div className="stack-lg">
      <MaintenanceMetrics metrics={metrics} />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search maintenance tickets"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket number, title, or description"
            value={search}
          />

          <select
            aria-label="Filter by status"
            onChange={(event) =>
              setStatus(
                event.target.value as MaintenanceStatus | "",
              )
            }
            value={status}
          >
            <option value="">All statuses</option>
            {[
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS",
              "RESOLVED",
              "CLOSED",
              "CANCELLED",
              "REJECTED",
            ].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            onChange={(event) =>
              setPriority(
                event.target.value as MaintenancePriority | "",
              )
            }
            value={priority}
          >
            <option value="">All priorities</option>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>

          <button className="secondary-button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">Loading maintenance tickets…</div>
      ) : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      ) : null}

      {!loading && !error ? (
        <MaintenanceTable items={items} />
      ) : null}
    </div>
  );
}
