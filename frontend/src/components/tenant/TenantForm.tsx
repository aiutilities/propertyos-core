"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PersonLookup from "@/components/common/PersonLookup";
import PropertyLookup from "@/components/common/PropertyLookup";
import { apiRequest } from "@/lib/api";

type TenantPayload = {
  personId: string;
  propertyId: string;
  tenantNumber: string;
  status: string;
  moveInDate?: string;
  moveOutDate?: string;
};

export default function TenantForm() {
  const router = useRouter();

  const [form, setForm] = useState<TenantPayload>({
    personId: "",
    propertyId: "",
    tenantNumber: "",
    status: "ACTIVE",
    moveInDate: "",
    moveOutDate: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest("/tenants", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          moveInDate: form.moveInDate || undefined,
          moveOutDate: form.moveOutDate || undefined,
        }),
      });

      router.push("/tenants");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create tenant.");
    } finally {
      setSaving(false);
    }
  }

  function update(name: keyof TenantPayload, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <form onSubmit={submit} className="form">
      <label>
        Person
        <PersonLookup
          required
          value={form.personId}
          onChange={(personId) =>
            update("personId", personId)
          }
        />
      </label>

      <label>
        Property
        <PropertyLookup
          required
          value={form.propertyId}
          onChange={(propertyId) =>
            update("propertyId", propertyId)
          }
        />
      </label>

      <input
        placeholder="Tenant Number"
        value={form.tenantNumber}
        onChange={(e) => update("tenantNumber", e.target.value)}
        required
      />

      <select
        value={form.status}
        onChange={(e) => update("status", e.target.value)}
      >
        <option>ACTIVE</option>
        <option>INACTIVE</option>
        <option>VACATED</option>
      </select>

      <input
        type="date"
        value={form.moveInDate}
        onChange={(e) => update("moveInDate", e.target.value)}
      />

      <input
        type="date"
        value={form.moveOutDate}
        onChange={(e) => update("moveOutDate", e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button disabled={saving}>
        {saving ? "Creating..." : "Create Tenant"}
      </button>
    </form>
  );
}
