"use client";

import ReceiptRow from "./ReceiptRow";
import { useReceipts } from "@/hooks/useReceipts";

export default function ReceiptTable() {
  const { receipts, loading, error } = useReceipts();

  if (loading) return <p>Loading receipts...</p>;
  if (error) return <p className="error">{error}</p>;
  if (receipts.length === 0) return <p>No receipts found.</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Receipt</th>
          <th>Tenant</th>
          <th>Ledger</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Mode</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {receipts.map((receipt) => (
          <ReceiptRow key={receipt.id} receipt={receipt} />
        ))}
      </tbody>
    </table>
  );
}
