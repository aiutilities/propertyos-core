"use client";

import Link from "next/link";

import { Staff } from "@/types/staff";

export default function StaffTable({
  staffs,
  residentMode = false,
}: {
  staffs: Staff[];
  residentMode?: boolean;
}) {
  if (staffs.length === 0) {
    return (
      <div className="empty-state">
        <h3>No staff found</h3>
        <p>Register a staff member or adjust the filters.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Type</th>
              <th>Designation</th>
              <th>Employer</th>
              <th>Shift</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {staffs.map((staff) => (
              <tr key={staff.id}>
                <td>
                  <Link href={`/staff/${staff.id}`}>{staff.employeeCode}</Link>

                  {residentMode ? (
                    <div className="muted-text">Resident directory</div>
                  ) : null}
                </td>

                <td>{staff.staffType.replaceAll("_", " ")}</td>

                <td>
                  {staff.designation ?? "—"}

                  <div className="muted-text">{staff.department ?? ""}</div>
                </td>

                <td>{staff.employerName ?? "—"}</td>

                <td>{staff.shiftName ?? "—"}</td>

                <td>
                  <span className="status-badge">{staff.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
