"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AgreementLookup from "@/components/common/AgreementLookup";
import TenantLookup from "@/components/common/TenantLookup";
import { apiRequest } from "@/lib/api";
import type { RentLedger } from "@/types/rent";

type RentLedgerPayload = {
  tenantId: string;
  agreementId: string;
  periodYear: string;
  periodMonth: string;
  dueDate: string;
  rentAmount: string;
};

export default function RentLedgerForm() {
  const router = useRouter();

  const [form, setForm] = useState<RentLedgerPayload>({
    tenantId: "",
    agreementId: "",
    periodYear: String(new Date().getFullYear()),
    periodMonth: String(new Date().getMonth() + 1),
    dueDate: "",
    rentAmount: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof RentLedgerPayload, value: string) {
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
      const ledger = await apiRequest<RentLedger>("/rent-ledgers", {
        method: "POST",
        body: JSON.stringify({
          tenantId: form.tenantId.trim(),
          agreementId: form.agreementId.trim(),
          periodYear: Number(form.periodYear),
          periodMonth: Number(form.periodMonth),
          dueDate: form.dueDate,
          rentAmount: Number(form.rentAmount),
        }),
      });

      router.replace(`/rent-ledgers/${ledger.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create rent ledger.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>
        Tenant
        <TenantLookup
          required
          value={form.tenantId}
          onChange={(tenantId) => update("tenantId", tenantId)}
        />
      </label>

      <label>
        Agreement
        <AgreementLookup
          required
          value={form.agreementId}
          onChange={(agreementId) => update("agreementId", agreementId)}
        />
      </label>

      <div className="form-grid">
        <label>
          Period Year
          <input
            required
            type="number"
            min="2000"
            max="2100"
            value={form.periodYear}
            onChange={(event) => update("periodYear", event.target.value)}
          />
        </label>

        <label>
          Period Month
          <select
            required
            value={form.periodMonth}
            onChange={(event) => update("periodMonth", event.target.value)}
          >
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label>
          Due Date
          <input
            required
            type="date"
            value={form.dueDate}
            onChange={(event) => update("dueDate", event.target.value)}
          />
        </label>

        <label>
          Rent Amount
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.rentAmount}
            onChange={(event) => update("rentAmount", event.target.value)}
          />
        </label>
      </div>

      <p className="muted">
        New ledgers start as unpaid, with zero paid and the full rent amount
        outstanding.
      </p>

      {error ? <p className="error">{error}</p> : null}

      <button disabled={saving}>
        {saving ? "Creating..." : "Create Rent Ledger"}
      </button>
    </form>
  );
}
