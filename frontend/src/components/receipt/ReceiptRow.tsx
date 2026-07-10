"use client";

import Link from "next/link";
import type { Receipt } from "@/types/receipt";

export default function ReceiptRow({
  receipt,
}: {
  receipt: Receipt;
}) {
  return (
    <tr>
      <td>
        <Link href={`/receipts/${receipt.id}`}>
          {receipt.receiptNumber}
        </Link>
      </td>
      <td>{receipt.tenantId}</td>
      <td>{receipt.rentLedgerId}</td>
      <td>{receipt.amount}</td>
      <td>{receipt.receiptDate}</td>
      <td>{receipt.paymentMode}</td>
      <td>{receipt.status}</td>
    </tr>
  );
}
