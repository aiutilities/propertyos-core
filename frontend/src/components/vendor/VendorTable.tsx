"use client";

import Link from "next/link";

import {
  VendorStatusBadge,
} from "./VendorStatusBadge";

import type {
  Vendor,
} from "@/types/vendor";

export function VendorTable({
  vendors,
}: {
  vendors: Vendor[];
}) {
  if (
    vendors.length === 0
  ) {
    return (
      <div className="panel">
        <p className="muted">
          No vendors found.
        </p>
      </div>
    );
  }

  return (
    <div className="panel table-scroll">
      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Type</th>
            <th>Contact</th>
            <th>Location</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {vendors.map(
            (vendor) => (
              <tr key={vendor.id}>
                <td>
                  <strong>
                    {vendor.displayName}
                  </strong>

                  <div className="muted">
                    {vendor.vendorNumber}
                  </div>
                </td>

                <td>
                  {vendor.vendorType}
                </td>

                <td>
                  <div>
                    {vendor.email ||
                      "—"}
                  </div>

                  <div className="muted">
                    {vendor.phone ||
                      ""}
                  </div>
                </td>

                <td>
                  {[
                    vendor.city,
                    vendor.state,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "—"}
                </td>

                <td>
                  <VendorStatusBadge
                    status={
                      vendor.status
                    }
                  />
                </td>

                <td>
                  <Link
                    className="button button-secondary"
                    href={
                      `/vendors/${vendor.id}`
                    }
                  >
                    View
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
