"use client";

import { use } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { useInvoice } from "@/hooks/useInvoice";

export default function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { invoice, loading, error } = useInvoice(id);

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Invoice Details</h1>
          <Link className="button-link" href="/invoices">
            Back to Invoices
          </Link>
        </div>

        {loading && <p>Loading invoice...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && invoice && (
          <table className="table">
            <tbody>
              <tr>
                <th>Invoice Number</th>
                <td>{invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <th>Tenant ID</th>
                <td>
                  <Link href={`/tenants/${invoice.tenantId}`}>
                    {invoice.tenantId}
                  </Link>
                </td>
              </tr>
              <tr>
                <th>Agreement ID</th>
                <td>
                  {invoice.agreementId ? (
                    <Link href={`/leases/${invoice.agreementId}`}>
                      {invoice.agreementId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr>
                <th>Rent Ledger ID</th>
                <td>
                  {invoice.rentLedgerId ? (
                    <Link href={`/rent-ledgers/${invoice.rentLedgerId}`}>
                      {invoice.rentLedgerId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr>
                <th>Receipt ID</th>
                <td>
                  {invoice.receiptId ? (
                    <Link href={`/receipts/${invoice.receiptId}`}>
                      {invoice.receiptId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr>
                <th>Billing Period</th>
                <td>
                  {invoice.billingPeriodStart} to {invoice.billingPeriodEnd}
                </td>
              </tr>
              <tr>
                <th>Invoice Date</th>
                <td>{invoice.invoiceDate}</td>
              </tr>
              <tr>
                <th>Due Date</th>
                <td>{invoice.dueDate}</td>
              </tr>
              <tr>
                <th>Amount</th>
                <td>{invoice.amount}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{invoice.status}</td>
              </tr>
            </tbody>
          </table>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
