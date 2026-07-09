"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function RentPaymentForm({
  rentLedgerId,
}: {
  rentLedgerId: string;
}) {
  const router = useRouter();

  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest(`/rent-ledgers/${rentLedgerId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          paymentDate,
          amount: Number(amount),
          paymentMode,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        }),
      });

      router.push(`/rent-ledgers/${rentLedgerId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <select
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value)}
      >
        <option>UPI</option>
        <option>BANK_TRANSFER</option>
        <option>CASH</option>
        <option>CHEQUE</option>
      </select>

      <input
        placeholder="Reference Number"
        value={referenceNumber}
        onChange={(e) => setReferenceNumber(e.target.value)}
      />

      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button disabled={saving}>
        {saving ? "Posting..." : "Post Payment"}
      </button>
    </form>
  );
}
