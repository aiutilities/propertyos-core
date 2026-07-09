"use client";

import Link from "next/link";
import type { Lease } from "@/types/lease";

export default function LeaseRow({ lease }: { lease: Lease }) {
  return (
    <tr>
      <td>
        <Link href={`/leases/${lease.id}`}>{lease.leaseNumber}</Link>
      </td>
      <td>{lease.tenantId}</td>
      <td>{lease.currentVersionId ?? "-"}</td>
      <td>{lease.status}</td>
      <td>{lease.createdAt ?? "-"}</td>
    </tr>
  );
}
