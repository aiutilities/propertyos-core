import Link from "next/link";

import {
  InventoryStockTransfer,
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

export default function InventoryTransferTable({
  transfers,
  stores,
}: {
  transfers: InventoryStockTransfer[];
  stores: InventoryStore[];
}) {
  if (transfers.length === 0) {
    return (
      <div className="empty-state">
        <h3>No inventory transfers</h3>
        <p>
          Store-to-store transfers will
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
              <th>Transfer</th>
              <th>Source Store</th>
              <th>Destination Store</th>
              <th>Date</th>
              <th>Lines</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td>
                  <Link
                    href={`/inventory/transfers/${transfer.id}`}
                  >
                    <strong>
                      {transfer.transferNumber}
                    </strong>
                  </Link>

                  <div className="muted-text">
                    {transfer.propertyId}
                  </div>
                </td>

                <td>
                  {storeNames.get(
                    transfer.sourceStoreId,
                  ) ??
                    transfer.sourceStoreId}
                </td>

                <td>
                  {storeNames.get(
                    transfer.destinationStoreId,
                  ) ??
                    transfer.destinationStoreId}
                </td>

                <td>
                  {formatDate(
                    transfer.transferDate,
                  )}
                </td>

                <td>
                  {transfer.items?.length ??
                    0}
                </td>

                <td>
                  <span className="status-badge">
                    {transfer.status}
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
