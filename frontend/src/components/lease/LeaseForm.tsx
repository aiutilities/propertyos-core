"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { Lease } from "@/types/lease";

type LeasePayload = {
  tenantId: string;
  agreementNumber: string;
  startDate: string;
  endDate?: string;
  rentAmount: string;
  depositAmount: string;
  noticePeriodDays: string;
};

type LeaseResponse = {
  success: boolean;
  data: Lease;
};

export default function LeaseForm() {
  const router = useRouter();

  const [form, setForm] = useState<LeasePayload>({
    tenantId: "",
    agreementNumber: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    depositAmount: "",
    noticePeriodDays: "30",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof LeasePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await apiRequest<LeaseResponse>("/agreements", {
        method: "POST",
        body: JSON.stringify({
          tenantId: form.tenantId,
          agreementNumber: form.agreementNumber,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          rentAmount: Number(form.rentAmount),
          depositAmount: Number(form.depositAmount),
          noticePeriodDays: Number(form.noticePeriodDays),
        }),
      });

      router.replace(`/leases/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create lease.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>
        Tenant ID
        <input
          required
          value={form.tenantId}
          onChange={(event) => update("tenantId", event.target.value)}
        />
      </label>

      <label>
        Agreement Number
        <input
          required
          value={form.agreementNumber}
          onChange={(event) => update("agreementNumber", event.target.value)}
        />
      </label>

      <div className="form-grid">
        <label>
          Start Date
          <input
            required
            type="date"
            value={form.startDate}
            onChange={(event) => update("startDate", event.target.value)}
          />
        </label>

        <label>
          End Date
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => update("endDate", event.target.value)}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Rent Amount
          <input
            required
            type="number"
            min="0"
            value={form.rentAmount}
            onChange={(event) => update("rentAmount", event.target.value)}
          />
        </label>

        <label>
          Deposit Amount
          <input
            required
            type="number"
            min="0"
            value={form.depositAmount}
            onChange={(event) => update("depositAmount", event.target.value)}
          />
        </label>
      </div>

      <label>
        Notice Period Days
        <input
          required
          type="number"
          min="0"
          value={form.noticePeriodDays}
          onChange={(event) => update("noticePeriodDays", event.target.value)}
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button disabled={saving}>
        {saving ? "Creating..." : "Create Lease"}
      </button>
    </form>
  );
}
