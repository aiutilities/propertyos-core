"use client";

import { useInvoices } from "@/hooks/useInvoices";
import InvoiceRow from "./InvoiceRow";

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
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </tbody>
    </table>
  );
}
