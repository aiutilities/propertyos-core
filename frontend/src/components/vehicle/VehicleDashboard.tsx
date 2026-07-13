"use client";

import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import {
  VehicleStatus,
  VehicleType,
} from "@/types/vehicle";
import VehicleTable from "./VehicleTable";

export default function VehicleDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<VehicleStatus | "">("");
  const [vehicleType, setVehicleType] =
    useState<VehicleType | "">("");

  const {
    vehicles,
    metrics,
    loading,
    error,
    refresh,
  } = useVehicles({
    search,
    status,
    vehicleType,
  });

  const cards = [
    ["Total", metrics?.total ?? 0],
    ["Pending", metrics?.pending ?? 0],
    ["Verified", metrics?.verified ?? 0],
    ["Inside", metrics?.currentlyInside ?? 0],
    ["Cars", metrics?.cars ?? 0],
    ["Two Wheelers", metrics?.twoWheelers ?? 0],
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
            placeholder="Search registration, make, model, colour, RFID"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as VehicleStatus | "",
              )
            }
          >
            <option value="">All statuses</option>
            {[
              "PENDING",
              "VERIFIED",
              "REJECTED",
              "SUSPENDED",
              "ARCHIVED",
            ].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={vehicleType}
            onChange={(event) =>
              setVehicleType(
                event.target.value as VehicleType | "",
              )
            }
          >
            <option value="">All vehicle types</option>
            {[
              "TWO_WHEELER",
              "CAR",
              "COMMERCIAL",
              "BICYCLE",
              "OTHER",
            ].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button className="secondary-button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">Loading vehicles…</div>
      ) : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      ) : null}

      {!loading && !error ? (
        <VehicleTable vehicles={vehicles} />
      ) : null}
    </div>
  );
}
