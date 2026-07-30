import Link from "next/link";

import {
  InventoryMaterialIssue,
  InventoryStore,
} from "@/types/inventory";

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
    },
  ).format(new Date(value));
}

export default function InventoryMaterialIssueTable({
  issues,
  stores,
}: {
  issues: InventoryMaterialIssue[];
  stores: InventoryStore[];
}) {
  if (issues.length === 0) {
    return (
      <div className="empty-state">
        <h3>No material issues</h3>
        <p>
          Material issue transactions
          will appear here.
        </p>
      </div>
    );
  }

  const storeNames = new Map(
    stores.map((store) => [
      store.id,
      `${store.storeCode} · ${store.name}`,
    ]),
  );

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Issue</th>
              <th>Store</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Requested By</th>
              <th>Lines</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td>
                  <Link
                    href={`/inventory/material-issues/${issue.id}`}
                  >
                    <strong>
                      {issue.issueNumber}
                    </strong>
                  </Link>
                  <div className="muted-text">
                    {issue.propertyId}
                  </div>
                </td>

                <td>
                  {storeNames.get(
                    issue.storeId,
                  ) ?? issue.storeId}
                </td>

                <td>
                  {formatDate(
                    issue.issueDate,
                  )}
                </td>

                <td>
                  {issue.reasonCode}
                  <div className="muted-text">
                    {issue.reasonDescription ??
                      "—"}
                  </div>
                </td>

                <td>
                  {issue.requestedByPersonId ??
                    "—"}
                </td>

                <td>
                  {issue.items?.length ?? 0}
                </td>

                <td>
                  <span className="status-badge">
                    {issue.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
