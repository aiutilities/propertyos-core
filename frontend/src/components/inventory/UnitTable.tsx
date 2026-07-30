import {
  InventoryUnitOfMeasure,
} from "@/types/inventory";

export default function UnitTable({
  units,
  onEdit,
}: {
  units: InventoryUnitOfMeasure[];
  onEdit: (
    unit: InventoryUnitOfMeasure,
  ) => void;
}) {
  if (units.length === 0) {
    return (
      <div className="empty-state">
        <h3>No units of measure</h3>
        <p>
          Create units before creating
          inventory items.
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
              <th>Code</th>
              <th>Unit</th>
              <th>Symbol</th>
              <th>Decimals</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td>
                  <strong>
                    {unit.code}
                  </strong>
                </td>
                <td>{unit.name}</td>
                <td>{unit.symbol}</td>
                <td>
                  {unit.decimalPlaces}
                </td>
                <td>
                  <span className="status-badge">
                    {unit.isActive
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </span>
                </td>
                <td>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      onEdit(unit)
                    }
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
