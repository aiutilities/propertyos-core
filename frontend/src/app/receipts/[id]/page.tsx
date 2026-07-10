"use client";

import { use } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { useReceipt } from "@/hooks/useReceipt";

export default function ReceiptDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { receipt, loading, error } = useReceipt(id);

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Receipt Details</h1>
          <Link className="button-link" href="/receipts">
            Back to Receipts
          </Link>
        </div>

        {loading && <p>Loading receipt...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && !receipt && <p>Receipt not found.</p>}

        {!loading && receipt && (
          <table className="table">
            <tbody>
              <tr>
                <th>Receipt Number</th>
                <td>{receipt.receiptNumber}</td>
              </tr>
              <tr>
                <th>Tenant ID</th>
                <td>
                  <Link href={`/tenants/${receipt.tenantId}`}>
                    {receipt.tenantId}
                  </Link>
                </td>
              </tr>
              <tr>
                <th>Rent Ledger ID</th>
                <td>
                  <Link href={`/rent-ledgers/${receipt.rentLedgerId}`}>
                    {receipt.rentLedgerId}
                  </Link>
                </td>
              </tr>
              <tr>
                <th>Rent Payment ID</th>
                <td>{receipt.rentPaymentId}</td>
              </tr>
              <tr>
                <th>Amount</th>
                <td>{receipt.amount}</td>
              </tr>
              <tr>
                <th>Receipt Date</th>
                <td>{receipt.receiptDate}</td>
              </tr>
              <tr>
                <th>Payment Mode</th>
                <td>{receipt.paymentMode}</td>
              </tr>
              <tr>
                <th>Reference Number</th>
                <td>{receipt.referenceNumber ?? "-"}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{receipt.status}</td>
              </tr>
              <tr>
                <th>Created At</th>
                <td>{receipt.createdAt ?? "-"}</td>
              </tr>
              <tr>
                <th>Updated At</th>
                <td>{receipt.updatedAt ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
