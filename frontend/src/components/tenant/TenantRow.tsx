"use client";

import Link from "next/link";
import type { Tenant } from "@/types/tenant";

export default function TenantRow({ tenant }: { tenant: Tenant }) {
  return (
    <tr>
      <td>
        <Link href={`/tenants/${tenant.id}`}>
          {tenant.tenantNumber}
        </Link>
      </td>
      <td>{tenant.status}</td>
      <td>{tenant.propertyId}</td>
      <td>{tenant.moveInDate ?? "-"}</td>
      <td>{tenant.moveOutDate ?? "-"}</td>
    </tr>
  );
}
