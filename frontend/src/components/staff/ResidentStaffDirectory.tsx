"use client";

import Link from "next/link";
import { useState } from "react";

import { useStaffs } from "@/hooks/useStaffs";

import StaffTable from "./StaffTable";

export default function ResidentStaffDirectory() {
  const [personId, setPersonId] = useState("");

  const { staffs, loading, error, refresh } = useStaffs({
    personId: personId || undefined,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Person ID"
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          />

          <button onClick={() => void refresh()} type="button">
            Refresh
          </button>

          <Link className="button-link" href="/resident/staff/new">
            Register Staff
          </Link>
        </div>
      </section>

      {loading ? <div className="loading-state">Loading staff…</div> : null}

      {error ? <div className="error-state">{error}</div> : null}

      {!loading && !error ? <StaffTable residentMode staffs={staffs} /> : null}
    </div>
  );
}
