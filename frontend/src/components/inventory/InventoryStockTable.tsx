import {
  InventoryItem,
  InventoryStockBalance,
  InventoryStore,
} from "@/types/inventory";

function formatQuantity(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  ).format(Number(value));
}

export default function InventoryStockTable({
  balances,
  items,
  stores,
}: {
  balances: InventoryStockBalance[];
  items: InventoryItem[];
  stores: InventoryStore[];
}) {
  if (balances.length === 0) {
    return (
      <div className="empty-state">
        <h3>No stock balances found</h3>
        <p>
          Stock balances appear after inventory
          movements are posted.
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
              <th>Item</th>
              <th>Store</th>
              <th>On Hand</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Average Cost</th>
              <th>Last Movement</th>
            </tr>
          </thead>

          <tbody>
            {balances.map((row) => (
              <tr key={row.id}>
                <td>
                  {
                    itemNames.get(
                      row.itemId,
                    ) ?? row.itemId
                  }
                </td>
                <td>
                  {
                    storeNames.get(
                      row.storeId,
                    ) ?? row.storeId
                  }
                </td>
                <td>
                  {formatQuantity(
                    row.quantityOnHand,
                  )}
                </td>
                <td>
                  {formatQuantity(
                    row.reservedQuantity,
                  )}
                </td>
                <td>
                  <strong>
                    {formatQuantity(
                      row.availableQuantity,
                    )}
                  </strong>
                </td>
                <td>
                  {formatQuantity(
                    row.averageUnitCost,
                  )}
                </td>
                <td>
                  {row.lastMovementAt
                    ? new Intl.DateTimeFormat(
                        "en-IN",
                        {
                          dateStyle: "medium",
                        },
                      ).format(
                        new Date(
                          row.lastMovementAt,
                        ),
                      )
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
