"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AgreementLookup from "@/components/common/AgreementLookup";
import { apiRequest } from "@/lib/api";
import type { Invoice } from "@/types/invoice";

type InvoicePayload = {
  tenantId: string;
  agreementId?: string;
  rentLedgerId?: string;
  receiptId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  status: string;
};

type InvoiceResponse = {
  success: boolean;
  data: {
    invoice: Invoice;
  };
};

export default function InvoiceForm() {
  const router = useRouter();

  const [form, setForm] = useState<InvoicePayload>({
    tenantId: "",
    agreementId: "",
    rentLedgerId: "",
    receiptId: "",
    billingPeriodStart: "",
    billingPeriodEnd: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    status: "DRAFT",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof InvoicePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await apiRequest<InvoiceResponse>("/invoices", {
        method: "POST",
        body: JSON.stringify({
          tenantId: form.tenantId,
          agreementId: form.agreementId || undefined,
          rentLedgerId: form.rentLedgerId || undefined,
          receiptId: form.receiptId || undefined,
          billingPeriodStart: form.billingPeriodStart,
          billingPeriodEnd: form.billingPeriodEnd,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate,
          amount: Number(form.amount),
          status: form.status,
        }),
      });

      router.replace(`/invoices/${response.data.invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invoice.");
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
        Agreement
        <AgreementLookup
          value={form.agreementId}
          onChange={(agreementId) => update("agreementId", agreementId)}
        />
      </label>

      <label>
        Rent Ledger ID
        <input
          value={form.rentLedgerId}
          onChange={(event) => update("rentLedgerId", event.target.value)}
        />
      </label>

      <label>
        Receipt ID
        <input
          value={form.receiptId}
          onChange={(event) => update("receiptId", event.target.value)}
        />
      </label>

      <div className="form-grid">
        <label>
          Billing Period Start
          <input
            required
            type="date"
            value={form.billingPeriodStart}
            onChange={(event) => update("billingPeriodStart", event.target.value)}
          />
        </label>

        <label>
          Billing Period End
          <input
            required
            type="date"
            value={form.billingPeriodEnd}
            onChange={(event) => update("billingPeriodEnd", event.target.value)}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Invoice Date
          <input
            required
            type="date"
            value={form.invoiceDate}
            onChange={(event) => update("invoiceDate", event.target.value)}
          />
        </label>

        <label>
          Due Date
          <input
            required
            type="date"
            value={form.dueDate}
            onChange={(event) => update("dueDate", event.target.value)}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Amount
          <input
            required
            type="number"
            min="0"
            value={form.amount}
            onChange={(event) => update("amount", event.target.value)}
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option>DRAFT</option>
            <option>ISSUED</option>
            <option>PAID</option>
            <option>OVERDUE</option>
            <option>CANCELLED</option>
          </select>
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button disabled={saving}>
        {saving ? "Creating..." : "Create Invoice"}
      </button>
    </form>
  );
}
