"use client";

import { use } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import RentPaymentTable from "@/components/rent/RentPaymentTable";
import { useRentLedger } from "@/hooks/useRentLedger";

export default function RentLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <RentLedgerDetails id={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}

function RentLedgerDetails({ id }: { id: string }) {
  const { ledger, loading } = useRentLedger(id);

  if (loading) return <p>Loading...</p>;
  if (!ledger) return <p>Rent ledger not found.</p>;

  return (
    <>
      <div className="page-header">
        <h1>Rent Ledger</h1>
        <Link className="button-link" href="/rent-ledgers">
          Back to Rent Ledgers
        </Link>
      </div>

      <table className="table">
        <tbody>
          <tr>
            <th>Tenant</th>
            <td>
              <Link href={`/tenants/${ledger.tenantId}`}>
                {ledger.tenantId}
              </Link>
            </td>
          </tr>
          <tr>
            <th>Agreement</th>
            <td>
              <Link href={`/leases/${ledger.agreementId}`}>
                {ledger.agreementId}
              </Link>
            </td>
          </tr>
          <tr>
            <th>Period</th>
            <td>
              {ledger.periodMonth}/{ledger.periodYear}
            </td>
          </tr>
          <tr>
            <th>Rent</th>
            <td>{ledger.rentAmount}</td>
          </tr>
          <tr>
            <th>Paid</th>
            <td>{ledger.amountPaid}</td>
          </tr>
          <tr>
            <th>Balance</th>
            <td>{ledger.balanceAmount}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>{ledger.status}</td>
          </tr>
        </tbody>
      </table>

      <h2>Payments</h2>

      <RentPaymentTable rentLedgerId={id} />
    </>
  );
}
