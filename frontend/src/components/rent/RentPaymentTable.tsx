"use client";

import { useRentPayments } from "@/hooks/useRentPayments";

export default function RentPaymentTable({
  rentLedgerId,
}: {
  rentLedgerId: string;
}) {
  const { payments, loading } = useRentPayments(rentLedgerId);

  if (loading) return <p>Loading payments...</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Mode</th>
          <th>Reference</th>
        </tr>
      </thead>

      <tbody>
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td>{payment.paymentDate}</td>
            <td>{payment.amount}</td>
            <td>{payment.paymentMode}</td>
            <td>{payment.referenceNumber ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
