"use client";

import { useRentLedgers } from "@/hooks/useRentLedgers";

export default function RentLedgerTable() {
  const { ledgers, loading, error } = useRentLedgers();

  if (loading) return <p>Loading rent ledgers...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Period</th>
          <th>Tenant</th>
          <th>Agreement</th>
          <th>Rent</th>
          <th>Paid</th>
          <th>Balance</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {ledgers.map((ledger) => (
          <tr key={ledger.id}>
            <td>{ledger.periodMonth}/{ledger.periodYear}</td>
            <td>{ledger.tenantId}</td>
            <td>{ledger.agreementId}</td>
            <td>{ledger.rentAmount}</td>
            <td>{ledger.amountPaid}</td>
            <td>{ledger.balanceAmount}</td>
            <td>{ledger.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
