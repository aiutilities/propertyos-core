import Link from "next/link";

import {
  InventoryStockAdjustment,
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
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function StockAdjustmentTable({
  adjustments,
}: {
  adjustments: InventoryStockAdjustment[];
}) {
  if (adjustments.length === 0) {
    return (
      <div className="empty-state">
        <h3>No stock adjustments</h3>
        <p>
          Stock adjustments will appear
          here after they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Adjustment</th>
              <th>Property / Store</th>
              <th>Reason</th>
              <th>Lines</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {adjustments.map(
              (adjustment) => (
                <tr key={adjustment.id}>
                  <td>
                    <Link
                      href={`/inventory/adjustments/${adjustment.id}`}
                    >
                      <strong>
                        {adjustment.adjustmentNumber ??
                          adjustment.id}
                      </strong>
                    </Link>
                    <div className="muted-text">
                      {adjustment.referenceNumber ??
                        "—"}
                    </div>
                  </td>

                  <td>
                    {adjustment.propertyId ??
                      "—"}
                    <div className="muted-text">
                      {adjustment.storeId ??
                        "—"}
                    </div>
                  </td>

                  <td>
                    {adjustment.reasonCode ??
                      "—"}
                    <div className="muted-text">
                      {adjustment.reasonDescription ??
                        adjustment.remarks ??
                        "—"}
                    </div>
                  </td>

                  <td>
                    {adjustment.items?.length ??
                      0}
                  </td>

                  <td>
                    <span className="status-badge">
                      {adjustment.status}
                    </span>
                  </td>

                  <td>
                    {formatDate(
                      adjustment.createdAt,
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
