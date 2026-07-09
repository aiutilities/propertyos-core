"use client";

import { useReceipts } from "@/hooks/useReceipts";

export default function ReceiptTable() {
  const { receipts, loading, error } = useReceipts();

  if (loading) return <p>Loading receipts...</p>;
  if (error) return <p>{error}</p>;

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
          <tr key={receipt.id}>
            <td>{receipt.receiptNumber}</td>
            <td>{receipt.tenantId}</td>
            <td>{receipt.rentLedgerId}</td>
            <td>{receipt.amount}</td>
            <td>{receipt.receiptDate}</td>
            <td>{receipt.paymentMode}</td>
            <td>{receipt.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
