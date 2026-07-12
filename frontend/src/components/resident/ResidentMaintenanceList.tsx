"use client";

import Link from "next/link";
import { useState } from "react";
import { useMaintenance } from "@/hooks/useMaintenance";
import MaintenanceTable from "@/components/maintenance/MaintenanceTable";

export default function ResidentMaintenanceList() {
  const [reporterPersonId, setReporterPersonId] = useState("");
  const { items, loading, error, refresh } = useMaintenance({
    reporterPersonId,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Your person ID"
            value={reporterPersonId}
            onChange={(event) =>
              setReporterPersonId(event.target.value)
            }
          />
          <button onClick={refresh}>Refresh</button>
          <Link
            className="button-link"
            href="/resident/maintenance/new"
          >
            Raise Complaint
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">Loading complaints…</div>
      ) : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? (
        <MaintenanceTable items={items} />
      ) : null}
    </div>
  );
}
