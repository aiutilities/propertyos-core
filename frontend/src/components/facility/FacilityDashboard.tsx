"use client";

import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import {
  AssetCondition,
  AssetStatus,
} from "@/types/facility";
import AssetMetrics from "./AssetMetrics";
import AssetTable from "./AssetTable";

export default function FacilityDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AssetStatus | "">("");
  const [condition, setCondition] =
    useState<AssetCondition | "">("");

  const {
    assets,
    metrics,
    loading,
    error,
    refresh,
  } = useFacilities({
    search,
    status,
    condition,
  });

  return (
    <div className="stack-lg">
      <AssetMetrics metrics={metrics} />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search facility assets"
            placeholder="Search asset, serial number, manufacturer, or model"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter asset status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AssetStatus | "")
            }
          >
            <option value="">All statuses</option>
            {[
              "DRAFT",
              "ACTIVE",
              "IN_MAINTENANCE",
              "OUT_OF_SERVICE",
              "RETIRED",
              "DISPOSED",
            ].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter asset condition"
            value={condition}
            onChange={(event) =>
              setCondition(
                event.target.value as AssetCondition | "",
              )
            }
          >
            <option value="">All conditions</option>
            {["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"].map(
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
        <div className="loading-state">Loading facility assets…</div>
      ) : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      ) : null}

      {!loading && !error ? (
        <AssetTable assets={assets} />
      ) : null}
    </div>
  );
}
