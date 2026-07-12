"use client";

import { useState } from "react";

import {
  lookupStaffByEmployeeCode,
  lookupStaffByQrCode,
  lookupStaffByRfidTag,
  recordStaffAttendance,
} from "@/hooks/useStaffs";
import { Staff, StaffAttendanceType } from "@/types/staff";

type LookupMode = "EMPLOYEE_CODE" | "QR" | "RFID";

export default function SecurityStaffLookup() {
  const [mode, setMode] = useState<LookupMode>("EMPLOYEE_CODE");
  const [lookupValue, setLookupValue] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [securityPersonId, setSecurityPersonId] = useState("");
  const [gate, setGate] = useState("");
  const [staff, setStaff] = useState<Staff | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function lookup() {
    setError("");
    setStaff(null);

    try {
      if (mode === "EMPLOYEE_CODE") {
        if (!propertyId) {
          throw new Error("Property ID is required.");
        }

        setStaff(await lookupStaffByEmployeeCode(propertyId, lookupValue));
        return;
      }

      if (mode === "QR") {
        setStaff(await lookupStaffByQrCode(lookupValue));
        return;
      }

      setStaff(await lookupStaffByRfidTag(lookupValue));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Staff not found.");
    }
  }

  async function record(attendanceType: StaffAttendanceType) {
    if (!staff) {
      return;
    }

    if (!securityPersonId) {
      setError("Security person ID is required.");
      return;
    }

    setBusy(attendanceType);
    setError("");

    try {
      await recordStaffAttendance(
        staff.id,
        attendanceType,
        securityPersonId,
        gate || undefined,
      );

      setStaff((current) =>
        current
          ? {
              ...current,
              attendance: [...(current.attendance ?? [])],
            }
          : current,
      );

      await lookup();
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

  return (
    <div className="stack-lg">
      <section className="panel">
        <h2>Staff Lookup</h2>

        <div className="form-grid">
          <label>
            Lookup Type
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as LookupMode)}
            >
              <option value="EMPLOYEE_CODE">Employee Code</option>
              <option value="QR">QR Code</option>
              <option value="RFID">RFID Tag</option>
            </select>
          </label>

          {mode === "EMPLOYEE_CODE" ? (
            <label>
              Property ID
              <input
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
              />
            </label>
          ) : null}

          <label>
            Lookup Value
            <input
              value={lookupValue}
              onChange={(event) => setLookupValue(event.target.value)}
            />
          </label>

          <label>
            Security Person ID
            <input
              value={securityPersonId}
              onChange={(event) => setSecurityPersonId(event.target.value)}
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

        <button onClick={() => void lookup()} type="button">
          Lookup Staff
        </button>
      </section>

      {error ? <div className="error-state">{error}</div> : null}

      {staff ? (
        <section className="panel">
          <h2>{staff.employeeCode}</h2>

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
              <dt>Designation</dt>
              <dd>{staff.designation ?? "—"}</dd>
            </div>

            <div>
              <dt>Department</dt>
              <dd>{staff.department ?? "—"}</dd>
            </div>

            <div>
              <dt>Employer</dt>
              <dd>{staff.employerName ?? "—"}</dd>
            </div>

            <div>
              <dt>Shift</dt>
              <dd>{staff.shiftName ?? "—"}</dd>
            </div>
          </dl>

          {staff.status === "ACTIVE" ? (
            <div className="button-row">
              <button
                disabled={busy === "CHECK_IN"}
                onClick={() => void record("CHECK_IN")}
                type="button"
              >
                Check In
              </button>

              <button
                disabled={busy === "CHECK_OUT"}
                onClick={() => void record("CHECK_OUT")}
                type="button"
              >
                Check Out
              </button>
            </div>
          ) : (
            <p className="text-danger">
              Only active staff can record attendance.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
