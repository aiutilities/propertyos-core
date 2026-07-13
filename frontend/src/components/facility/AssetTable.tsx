"use client";

import Link from "next/link";
import { FacilityAsset } from "@/types/facility";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function AssetTable({
  assets,
}: {
  assets: FacilityAsset[];
}) {
  if (assets.length === 0) {
    return (
      <div className="empty-state">
        <h3>No facility assets found</h3>
        <p>Create an asset or adjust the filters.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Condition</th>
              <th>Warranty</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>
                  <Link href={`/facilities/assets/${asset.id}`}>
                    {asset.assetNumber}
                  </Link>
                </td>
                <td>
                  <strong>{asset.name}</strong>
                  <div className="muted-text">
                    {[asset.manufacturer, asset.model]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </td>
                <td>{asset.category?.name ?? asset.categoryId}</td>
                <td>
                  <span className="status-badge">
                    {asset.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  <span className="status-badge">
                    {asset.condition}
                  </span>
                </td>
                <td>{formatDate(asset.warrantyExpiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
