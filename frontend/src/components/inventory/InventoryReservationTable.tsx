import Link from "next/link";

import {
  InventoryItem,
  InventoryStockReservation,
  InventoryStore,
} from "@/types/inventory";

function quantity(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  ).format(Number(value));
}

export default function InventoryReservationTable({
  reservations,
  items,
  stores,
}: {
  reservations: InventoryStockReservation[];
  items: InventoryItem[];
  stores: InventoryStore[];
}) {
  if (reservations.length === 0) {
    return (
      <div className="empty-state">
        <h3>No stock reservations</h3>
        <p>
          Reserved stock will appear here.
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
              <th>Reservation</th>
              <th>Item</th>
              <th>Store</th>
              <th>Reserved</th>
              <th>Fulfilled</th>
              <th>Released</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map(
              (reservation) => (
                <tr key={reservation.id}>
                  <td>
                    <Link
                      href={`/inventory/reservations/${reservation.id}`}
                    >
                      <strong>
                        {reservation.reservationNumber ??
                          reservation.id}
                      </strong>
                    </Link>
                    <div className="muted-text">
                      {reservation.referenceNumber ??
                        "—"}
                    </div>
                  </td>

                  <td>
                    {itemNames.get(
                      reservation.itemId,
                    ) ??
                      reservation.itemId}
                  </td>

                  <td>
                    {storeNames.get(
                      reservation.storeId,
                    ) ??
                      reservation.storeId}
                  </td>

                  <td>
                    {quantity(
                      reservation.quantity,
                    )}
                  </td>

                  <td>
                    {quantity(
                      reservation.fulfilledQuantity,
                    )}
                  </td>

                  <td>
                    {quantity(
                      reservation.releasedQuantity,
                    )}
                  </td>

                  <td>
                    <span className="status-badge">
                      {reservation.status}
                    </span>
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
