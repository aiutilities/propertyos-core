import Link from "next/link";

import {
  InventoryCycleCount,
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

export default function InventoryCycleCountTable({
  counts,
  stores,
}: {
  counts: InventoryCycleCount[];
  stores: InventoryStore[];
}) {
  if (counts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No cycle counts</h3>
        <p>
          Inventory cycle counts will
          appear here.
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
              <th>Count</th>
              <th>Store</th>
              <th>Date</th>
              <th>Scope</th>
              <th>Mode</th>
              <th>Lines</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {counts.map((count) => {
              const lines =
                count.items ??
                count.lines ??
                [];

              return (
                <tr key={count.id}>
                  <td>
                    <Link
                      href={`/inventory/cycle-counts/${count.id}`}
                    >
                      <strong>
                        {count.countNumber}
                      </strong>
                    </Link>

                    <div className="muted-text">
                      {count.propertyId}
                    </div>
                  </td>

                  <td>
                    {storeNames.get(
                      count.storeId,
                    ) ?? count.storeId}
                  </td>

                  <td>
                    {formatDate(
                      count.countDate,
                    )}
                  </td>

                  <td>
                    {count.scopeType}
                    <div className="muted-text">
                      {count.binLocationId ??
                        count.itemId ??
                        "Entire store"}
                    </div>
                  </td>

                  <td>
                    {count.blindCount
                      ? "Blind"
                      : "Visible"}
                    <div className="muted-text">
                      {count.freezeStock
                        ? "Stock frozen"
                        : "Stock active"}
                    </div>
                  </td>

                  <td>{lines.length}</td>

                  <td>
                    <span className="status-badge">
                      {count.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
