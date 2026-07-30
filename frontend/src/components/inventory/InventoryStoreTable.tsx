import {
  InventoryStore,
} from "@/types/inventory";

export default function InventoryStoreTable({
  stores,
  onEdit,
  onManageBins,
  onChangeStatus,
}: {
  stores: InventoryStore[];
  onEdit: (
    store: InventoryStore,
  ) => void;
  onManageBins: (
    store: InventoryStore,
  ) => void;
  onChangeStatus: (
    store: InventoryStore,
  ) => void;
}) {
  if (stores.length === 0) {
    return (
      <div className="empty-state">
        <h3>No inventory stores</h3>
        <p>
          Create a store before recording
          stock movements.
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
              <th>Store</th>
              <th>Property</th>
              <th>Zone / Space</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td>
                  <strong>
                    {store.storeCode}
                  </strong>
                  <div className="muted-text">
                    {store.name}
                  </div>
                </td>
                <td>
                  {store.propertyId}
                </td>
                <td>
                  {store.zoneId ?? "—"}
                  <div className="muted-text">
                    {store.spaceId ?? "—"}
                  </div>
                </td>
                <td>
                  {store.managerPersonId ??
                    "—"}
                </td>
                <td>
                  <span className="status-badge">
                    {store.isActive
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </span>
                </td>
                <td>
                  <div className="button-row">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        onManageBins(store)
                      }
                    >
                      Bins
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        onEdit(store)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        onChangeStatus(
                          store,
                        )
                      }
                    >
                      {store.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>
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
