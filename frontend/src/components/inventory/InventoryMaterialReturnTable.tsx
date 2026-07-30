import Link from "next/link";

import {
  InventoryMaterialReturn,
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

export default function InventoryMaterialReturnTable({
  returns,
  stores,
}: {
  returns: InventoryMaterialReturn[];
  stores: InventoryStore[];
}) {
  if (returns.length === 0) {
    return (
      <div className="empty-state">
        <h3>No material returns</h3>
        <p>
          Returned inventory transactions
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
              <th>Return</th>
              <th>Store</th>
              <th>Return Date</th>
              <th>Material Issue</th>
              <th>Reason</th>
              <th>Returned By</th>
              <th>Lines</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {returns.map((materialReturn) => (
              <tr key={materialReturn.id}>
                <td>
                  <Link
                    href={`/inventory/material-returns/${materialReturn.id}`}
                  >
                    <strong>
                      {materialReturn.returnNumber}
                    </strong>
                  </Link>

                  <div className="muted-text">
                    {materialReturn.propertyId}
                  </div>
                </td>

                <td>
                  {storeNames.get(
                    materialReturn.storeId,
                  ) ??
                    materialReturn.storeId}
                </td>

                <td>
                  {formatDate(
                    materialReturn.returnDate,
                  )}
                </td>

                <td>
                  {materialReturn.materialIssueId ??
                    "—"}
                </td>

                <td>
                  {materialReturn.reasonCode}

                  <div className="muted-text">
                    {materialReturn.reasonDescription ??
                      "—"}
                  </div>
                </td>

                <td>
                  {materialReturn.returnedByPersonId ??
                    "—"}
                </td>

                <td>
                  {materialReturn.items?.length ??
                    0}
                </td>

                <td>
                  <span className="status-badge">
                    {materialReturn.status}
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
