"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  getStaff,
  recordStaffAttendance,
  updateStaffStatus,
} from "@/hooks/useStaffs";
import { Staff, StaffAttendanceType, StaffStatus } from "@/types/staff";

const STATUS_ACTIONS: Record<StaffStatus, StaffStatus[]> = {
  PENDING: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["INACTIVE", "SUSPENDED", "ARCHIVED"],
  INACTIVE: ["ACTIVE", "ARCHIVED"],
  SUSPENDED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export default function StaffDetails({ staffId }: { staffId: string }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [actorPersonId, setActorPersonId] = useState("");
  const [gate, setGate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setStaff(await getStaff(staffId));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load staff.",
      );
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(status: StaffStatus) {
    if (!actorPersonId) {
      setError("Acting person ID is required.");
      return;
    }

    setBusy(status);
    setError("");

    try {
      await updateStaffStatus(
        staffId,
        status,
        actorPersonId,
        remarks || undefined,
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update status.",
      );
    } finally {
      setBusy("");
    }
  }

  async function recordAttendance(attendanceType: StaffAttendanceType) {
    if (!actorPersonId) {
      setError("Security person ID is required.");
      return;
    }

    setBusy(attendanceType);
    setError("");

    try {
      await recordStaffAttendance(
        staffId,
        attendanceType,
        actorPersonId,
        gate || undefined,
        remarks || undefined,
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to record attendance.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="loading-state">Loading staff…</div>;
  }

  if (error && !staff) {
    return (
      <div className="error-state">
        <p>{error}</p>

        <button onClick={() => void load()} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (!staff) {
    return null;
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Staff Registry</p>

          <h1>{staff.employeeCode}</h1>

          <p>
            {[staff.designation, staff.department, staff.employerName]
              .filter(Boolean)
              .join(" · ") || "Staff member"}
          </p>
        </div>

        <Link className="secondary-button" href="/staff">
          Back to Staff
        </Link>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Staff Details</h2>

          <dl className="details-list">
            <div>
              <dt>Status</dt>
              <dd>{staff.status}</dd>
            </div>

            <div>
              <dt>Type</dt>
              <dd>{staff.staffType.replaceAll("_", " ")}</dd>
            </div>

            <div>
              <dt>Person</dt>
              <dd>{staff.personId}</dd>
            </div>

            <div>
              <dt>Property</dt>
              <dd>{staff.propertyId}</dd>
            </div>

            <div>
              <dt>Zone</dt>
              <dd>{staff.zoneId ?? "—"}</dd>
            </div>

            <div>
              <dt>Employer</dt>
              <dd>{staff.employerName ?? "—"}</dd>
            </div>

            <div>
              <dt>Department</dt>
              <dd>{staff.department ?? "—"}</dd>
            </div>

            <div>
              <dt>Designation</dt>
              <dd>{staff.designation ?? "—"}</dd>
            </div>

            <div>
              <dt>Shift</dt>
              <dd>{staff.shiftName ?? "—"}</dd>
            </div>

            <div>
              <dt>ID Card</dt>
              <dd>{staff.idCardNumber ?? "—"}</dd>
            </div>

            <div>
              <dt>RFID</dt>
              <dd>{staff.rfidTag ?? "—"}</dd>
            </div>

            <div>
              <dt>Activated At</dt>
              <dd>{formatDate(staff.verifiedAt)}</dd>
            </div>
          </dl>

          <p>{staff.notes ?? "No notes."}</p>
        </section>

        <section className="panel">
          <h2>Administration and Attendance</h2>

          <div className="form-grid">
            <label>
              Acting Person ID
              <input
                value={actorPersonId}
                onChange={(event) => setActorPersonId(event.target.value)}
              />
            </label>

            <label>
              Gate
              <input
                value={gate}
                onChange={(event) => setGate(event.target.value)}
              />
            </label>
          </div>

          <label>
            Reason or Remarks
            <textarea
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </label>

          <div className="button-row">
            {STATUS_ACTIONS[staff.status].map((status) => (
              <button
                disabled={busy === status}
                key={status}
                onClick={() => void changeStatus(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>

          {staff.status === "ACTIVE" ? (
            <div className="button-row">
              <button
                disabled={busy === "CHECK_IN"}
                onClick={() => void recordAttendance("CHECK_IN")}
                type="button"
              >
                Check In
              </button>

              <button
                disabled={busy === "CHECK_OUT"}
                onClick={() => void recordAttendance("CHECK_OUT")}
                type="button"
              >
                Check Out
              </button>
            </div>
          ) : null}

          {error ? <p className="text-danger">{error}</p> : null}
        </section>
      </div>

      <section className="panel">
        <h2>Attendance History</h2>

        {(staff.attendance ?? []).length > 0 ? (
          <div className="timeline">
            {(staff.attendance ?? []).map((item) => (
              <article className="timeline-item" key={item.id}>
                <strong>{item.attendanceType}</strong>

                <span>{formatDate(item.occurredAt)}</span>

                <p>
                  {item.gate ?? "Gate not specified"}

                  {item.remarks ? ` — ${item.remarks}` : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p>No attendance history available.</p>
        )}
      </section>
    </div>
  );
}
