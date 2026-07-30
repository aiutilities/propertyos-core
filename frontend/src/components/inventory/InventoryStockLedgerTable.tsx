import {
  InventoryItem,
  InventoryStockLedgerEntry,
  InventoryStore,
} from "@/types/inventory";

function formatQuantity(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 6,
    },
  ).format(Number(value));
}

function formatMoney(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(Number(value));
}

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

export default function InventoryStockLedgerTable({
  entries,
  items,
  stores,
}: {
  entries: InventoryStockLedgerEntry[];
  items: InventoryItem[];
  stores: InventoryStore[];
}) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <h3>No stock movements</h3>
        <p>
          Posted inventory transactions
          will appear in the stock ledger.
        </p>
      </div>
    );
  }

  const itemNames = new Map(
    items.map((item) => [
      item.id,
      `${item.sku} · ${item.name}`,
    ]),
  );

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
              <th>Movement</th>
              <th>Date</th>
              <th>Item</th>
              <th>Store / Bin</th>
              <th>Quantity</th>
              <th>Balance</th>
              <th>Reserved</th>
              <th>Value</th>
              <th>Source</th>
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>
                    {entry.movementNumber}
                  </strong>
                  <div className="muted-text">
                    {entry.movementType}
                  </div>
                </td>

                <td>
                  {formatDate(
                    entry.movementDate,
                  )}
                </td>

                <td>
                  {itemNames.get(
                    entry.itemId,
                  ) ?? entry.itemId}
                  {entry.batchId ? (
                    <div className="muted-text">
                      Batch: {entry.batchId}
                    </div>
                  ) : null}
                </td>

                <td>
                  {storeNames.get(
                    entry.storeId,
                  ) ?? entry.storeId}
                  <div className="muted-text">
                    {entry.binLocationId ??
                      "No bin"}
                  </div>
                </td>

                <td>
                  {entry.quantityDelta > 0
                    ? "+"
                    : ""}
                  {formatQuantity(
                    entry.quantityDelta,
                  )}
                </td>

                <td>
                  {formatQuantity(
                    entry.quantityBefore,
                  )}
                  {" → "}
                  {formatQuantity(
                    entry.quantityAfter,
                  )}
                </td>

                <td>
                  {formatQuantity(
                    entry.reservedQuantityBefore,
                  )}
                  {" → "}
                  {formatQuantity(
                    entry.reservedQuantityAfter,
                  )}
                </td>

                <td>
                  <div>
                    Unit:{" "}
                    {formatMoney(
                      entry.unitCost,
                    )}
                  </div>
                  <div className="muted-text">
                    Total:{" "}
                    {formatMoney(
                      entry.totalCost,
                    )}
                  </div>
                </td>

                <td>
                  {entry.sourceType}
                  <div className="muted-text">
                    {entry.referenceNumber ??
                      entry.sourceId ??
                      "—"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
