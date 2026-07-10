"use client";

import Link from "next/link";
import type { Invoice } from "@/types/invoice";

export default function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <tr>
      <td>
        <Link href={`/invoices/${invoice.id}`}>
          {invoice.invoiceNumber}
        </Link>
      </td>
      <td>{invoice.tenantId}</td>
      <td>{invoice.billingPeriodStart} to {invoice.billingPeriodEnd}</td>
      <td>{invoice.dueDate}</td>
      <td>{invoice.amount}</td>
      <td>{invoice.status}</td>
    </tr>
  );
}
