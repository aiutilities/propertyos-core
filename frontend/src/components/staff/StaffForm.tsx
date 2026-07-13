"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createStaff } from "@/hooks/useStaffs";
import { CreateStaffInput, StaffType } from "@/types/staff";

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

export default function StaffForm({
  residentMode = false,
}: {
  residentMode?: boolean;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    employeeCode: "",
    personId: "",
    staffType: "HOUSEKEEPING" as StaffType,
    propertyId: "",
    zoneId: "",
    employerName: "",
    department: "",
    designation: "",
    shiftName: "",
    idCardNumber: "",
    qrCode: "",
    rfidTag: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const input: CreateStaffInput = {
      employeeCode: form.employeeCode,
      personId: form.personId,
      staffType: form.staffType,
      propertyId: form.propertyId,
      zoneId: form.zoneId || undefined,
      employerName: form.employerName || undefined,
      department: form.department || undefined,
      designation: form.designation || undefined,
      shiftName: form.shiftName || undefined,
      idCardNumber: form.idCardNumber || undefined,
      qrCode: form.qrCode || undefined,
      rfidTag: form.rfidTag || undefined,
      notes: form.notes || undefined,
    };

    try {
      const staff = await createStaff(input);

      router.push(residentMode ? "/resident/staff" : `/staff/${staff.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to register staff.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Employee Code
          <input
            required
            placeholder="EMP-001"
            value={form.employeeCode}
            onChange={(event) =>
              update("employeeCode", event.target.value.toUpperCase())
            }
          />
        </label>

        <label>
          Staff Type
          <select
            value={form.staffType}
            onChange={(event) => update("staffType", event.target.value)}
          >
            {STAFF_TYPES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          Person ID
          <input
            required
            value={form.personId}
            onChange={(event) => update("personId", event.target.value)}
          />
        </label>

        <label>
          Property ID
          <input
            required
            value={form.propertyId}
            onChange={(event) => update("propertyId", event.target.value)}
          />
        </label>

        <label>
          Zone ID
          <input
            value={form.zoneId}
            onChange={(event) => update("zoneId", event.target.value)}
          />
        </label>

        <label>
          Employer
          <input
            value={form.employerName}
            onChange={(event) => update("employerName", event.target.value)}
          />
        </label>

        <label>
          Department
          <input
            value={form.department}
            onChange={(event) => update("department", event.target.value)}
          />
        </label>

        <label>
          Designation
          <input
            value={form.designation}
            onChange={(event) => update("designation", event.target.value)}
          />
        </label>

        <label>
          Shift
          <input
            placeholder="Day / Night / General"
            value={form.shiftName}
            onChange={(event) => update("shiftName", event.target.value)}
          />
        </label>

        <label>
          ID Card Number
          <input
            value={form.idCardNumber}
            onChange={(event) => update("idCardNumber", event.target.value)}
          />
        </label>

        <label>
          QR Code
          <input
            value={form.qrCode}
            onChange={(event) => update("qrCode", event.target.value)}
          />
        </label>

        <label>
          RFID Tag
          <input
            value={form.rfidTag}
            onChange={(event) => update("rfidTag", event.target.value)}
          />
        </label>
      </div>

      <label>
        Notes
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
        />
      </label>

      {error ? <p className="text-danger">{error}</p> : null}

      <div className="button-row">
        <button disabled={saving} type="submit">
          {saving ? "Registering…" : "Register Staff"}
        </button>

        <button
          className="secondary-button"
          onClick={() => router.back()}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
