"use client";

import { useState } from "react";

import { useStaffs } from "@/hooks/useStaffs";
import { StaffStatus, StaffType } from "@/types/staff";

import StaffTable from "./StaffTable";

const STAFF_TYPES: StaffType[] = [
  "SECURITY",
  "HOUSEKEEPING",
  "MAINTENANCE",
  "ELECTRICIAN",
  "PLUMBER",
  "GARDENER",
  "ADMIN",
  "VENDOR",
  "CONTRACTOR",
  "OTHER",
];

const STAFF_STATUSES: StaffStatus[] = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "ARCHIVED",
];

export default function StaffDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StaffStatus | "">("");
  const [staffType, setStaffType] = useState<StaffType | "">("");

  const { staffs, metrics, loading, error, refresh } = useStaffs({
    search,
    status,
    staffType,
  });

  const cards = [
    ["Total", metrics?.total ?? 0],
    ["Pending", metrics?.pending ?? 0],
    ["Active", metrics?.active ?? 0],
    ["Currently Inside", metrics?.currentlyInside ?? 0],
    ["Security", metrics?.security ?? 0],
    ["Housekeeping", metrics?.housekeeping ?? 0],
    ["Maintenance", metrics?.maintenance ?? 0],
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
            placeholder="Search employee code, employer, department, designation or credential"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as StaffStatus | "")
            }
          >
            <option value="">All statuses</option>

            {STAFF_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={staffType}
            onChange={(event) =>
              setStaffType(event.target.value as StaffType | "")
            }
          >
            <option value="">All staff types</option>

            {STAFF_TYPES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button
            className="secondary-button"
            onClick={() => void refresh()}
            type="button"
          >
            Refresh
          </button>
        </div>
      </section>

      {loading ? <div className="loading-state">Loading staff…</div> : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>

          <button onClick={() => void refresh()} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error ? <StaffTable staffs={staffs} /> : null}
    </div>
  );
}
