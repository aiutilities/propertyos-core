"use client";

import { useInvoices } from "@/hooks/useInvoices";

export default function InvoiceTable() {
  const { invoices, loading, error } = useInvoices();

  if (loading) return <p>Loading invoices...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Tenant</th>
          <th>Period</th>
          <th>Due Date</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.invoiceNumber}</td>
            <td>{invoice.tenantId}</td>
            <td>{invoice.billingPeriodStart} to {invoice.billingPeriodEnd}</td>
            <td>{invoice.dueDate}</td>
            <td>{invoice.amount}</td>
            <td>{invoice.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
