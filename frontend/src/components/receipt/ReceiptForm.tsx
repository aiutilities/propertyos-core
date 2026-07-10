"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RentLedgerLookup from "@/components/common/RentLedgerLookup";
import { apiRequest } from "@/lib/api";
import type { Receipt } from "@/types/receipt";

type ReceiptPayload = {
  receiptNumber: string;
  rentPaymentId: string;
  rentLedgerId: string;
  tenantId: string;
  amount: string;
  receiptDate: string;
  paymentMode: string;
  referenceNumber: string;
};

export default function ReceiptForm() {
  const router = useRouter();

  const [form, setForm] = useState<ReceiptPayload>({
    receiptNumber: "",
    rentPaymentId: "",
    rentLedgerId: "",
    tenantId: "",
    amount: "",
    receiptDate: "",
    paymentMode: "",
    referenceNumber: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof ReceiptPayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const receipt = await apiRequest<Receipt>("/receipts", {
        method: "POST",
        body: JSON.stringify({
          receiptNumber: form.receiptNumber.trim(),
          rentPaymentId: form.rentPaymentId.trim(),
          rentLedgerId: form.rentLedgerId.trim(),
          tenantId: form.tenantId.trim(),
          amount: Number(form.amount),
          receiptDate: form.receiptDate,
          paymentMode: form.paymentMode.trim(),
          referenceNumber: form.referenceNumber.trim() || undefined,
        }),
      });

      router.replace(`/receipts/${receipt.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create receipt.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>
        Receipt Number
        <input
          required
          value={form.receiptNumber}
          onChange={(event) => update("receiptNumber", event.target.value)}
        />
      </label>

      <label>
        Tenant ID
        <input
          required
          value={form.tenantId}
          onChange={(event) => update("tenantId", event.target.value)}
        />
      </label>

      <label>
        Rent Ledger
        <RentLedgerLookup
          required
          value={form.rentLedgerId}
          onChange={(rentLedgerId) =>
            update("rentLedgerId", rentLedgerId)
          }
        />
      </label>

      <label>
        Rent Payment ID
        <input
          required
          value={form.rentPaymentId}
          onChange={(event) => update("rentPaymentId", event.target.value)}
        />
      </label>

      <div className="form-grid">
        <label>
          Amount
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => update("amount", event.target.value)}
          />
        </label>

        <label>
          Receipt Date
          <input
            required
            type="date"
            value={form.receiptDate}
            onChange={(event) => update("receiptDate", event.target.value)}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Payment Mode
          <input
            required
            placeholder="UPI, cash, bank transfer..."
            value={form.paymentMode}
            onChange={(event) => update("paymentMode", event.target.value)}
          />
        </label>

        <label>
          Reference Number
          <input
            value={form.referenceNumber}
            onChange={(event) => update("referenceNumber", event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button disabled={saving}>
        {saving ? "Creating..." : "Create Receipt"}
      </button>
    </form>
  );
}
