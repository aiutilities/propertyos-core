import {
  InventoryBinLocation,
} from "@/types/inventory";

export default function InventoryBinTable({
  bins,
  onEdit,
}: {
  bins: InventoryBinLocation[];
  onEdit: (
    bin: InventoryBinLocation,
  ) => void;
}) {
  if (bins.length === 0) {
    return (
      <div className="empty-state">
        <h3>No bins configured</h3>
        <p>
          Create receiving, storage,
          dispatch or quarantine bins.
        </p>
      </div>
    );
  }

  const binNames = new Map(
    bins.map((bin) => [
      bin.id,
      bin.name,
    ]),
  );

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bin</th>
              <th>Parent</th>
              <th>Barcode</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {bins.map((bin) => {
              const purposes = [
                bin.isReceivingBin
                  ? "Receiving"
                  : null,
                bin.isDispatchBin
                  ? "Dispatch"
                  : null,
                bin.isQuarantineBin
                  ? "Quarantine"
                  : null,
              ].filter(Boolean);

              return (
                <tr key={bin.id}>
                  <td>
                    <strong>
                      {bin.binCode}
                    </strong>
                    <div className="muted-text">
                      {bin.name}
                    </div>
                  </td>
                  <td>
                    {bin.parentBinId
                      ? binNames.get(
                          bin.parentBinId,
                        ) ??
                        bin.parentBinId
                      : "—"}
                  </td>
                  <td>
                    {bin.barcode ?? "—"}
                  </td>
                  <td>
                    {purposes.length
                      ? purposes.join(", ")
                      : "Storage"}
                  </td>
                  <td>
                    <span className="status-badge">
                      {bin.isActive
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        onEdit(bin)
                      }
                    >
                      Edit
                    </button>
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
