"use client";

import Link from "next/link";
import { useState } from "react";

import { useAccessPoints } from "@/hooks/useAccessControl";
import { AccessPointStatus, AccessPointType } from "@/types/access-control";

const TYPES: AccessPointType[] = [
  "GATE",
  "DOOR",
  "TURNSTILE",
  "VEHICLE_BARRIER",
  "ELEVATOR",
  "OTHER",
];

const STATUSES: AccessPointStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "EMERGENCY_OPEN",
  "ARCHIVED",
];

export default function AccessDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccessPointStatus | "">("");
  const [accessPointType, setType] = useState<AccessPointType | "">("");

  const { points, metrics, loading, error, refresh } = useAccessPoints({
    search,
    status,
    accessPointType,
  });

  const cards = [
    ["Access Points", metrics?.totalAccessPoints ?? 0],
    ["Active Points", metrics?.activeAccessPoints ?? 0],
    ["Maintenance", metrics?.maintenanceAccessPoints ?? 0],
    ["Active Grants", metrics?.activeGrants ?? 0],
    ["Granted Today", metrics?.grantedToday ?? 0],
    ["Denied Today", metrics?.deniedToday ?? 0],
    ["Currently Inside", metrics?.currentlyInside ?? 0],
  ];

  return (
    <div className="stack-lg">
      <div className="metric-grid">
        {cards.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Search access points"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AccessPointStatus | "")
            }
          >
            <option value="">All statuses</option>

            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={accessPointType}
            onChange={(event) =>
              setType(event.target.value as AccessPointType | "")
            }
          >
            <option value="">All types</option>

            {TYPES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button onClick={() => void refresh()} type="button">
            Refresh
          </button>

          <Link className="button-link" href="/access/points/new">
            New Access Point
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">Loading access points…</div>
      ) : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th>Anti-passback</th>
                </tr>
              </thead>

              <tbody>
                {points.map((point) => (
                  <tr key={point.id}>
                    <td>
                      <Link href={`/access/points/${point.id}`}>
                        {point.code}
                      </Link>
                    </td>
                    <td>{point.name}</td>
                    <td>{point.accessPointType.replaceAll("_", " ")}</td>
                    <td>{point.direction}</td>
                    <td>{point.status}</td>
                    <td>
                      {point.requiresAntiPassback ? "Enabled" : "Disabled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
