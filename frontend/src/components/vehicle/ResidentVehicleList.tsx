"use client";

import Link from "next/link";
import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import VehicleTable from "./VehicleTable";

export default function ResidentVehicleList() {
  const [ownerPersonId, setOwnerPersonId] = useState("");

  const {
    vehicles,
    loading,
    error,
    refresh,
  } = useVehicles({
    ownerPersonId,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Your person ID"
            value={ownerPersonId}
            onChange={(event) =>
              setOwnerPersonId(event.target.value)
            }
          />

          <button onClick={refresh}>Refresh</button>

          <Link
            className="button-link"
            href="/resident/vehicles/new"
          >
            Register Vehicle
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">Loading vehicles…</div>
      ) : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <VehicleTable
          residentMode
          vehicles={vehicles}
        />
      ) : null}
    </div>
  );
}
