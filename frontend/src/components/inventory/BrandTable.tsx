import {
  InventoryBrand,
} from "@/types/inventory";

export default function BrandTable({
  brands,
  onEdit,
}: {
  brands: InventoryBrand[];
  onEdit: (
    brand: InventoryBrand,
  ) => void;
}) {
  if (brands.length === 0) {
    return (
      <div className="empty-state">
        <h3>No inventory brands</h3>
        <p>
          Create the first brand for
          branded inventory items.
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
              <th>Brand</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td>
                  <strong>
                    {brand.code}
                  </strong>
                </td>
                <td>{brand.name}</td>
                <td>
                  {brand.description ??
                    "—"}
                </td>
                <td>
                  <span className="status-badge">
                    {brand.isActive
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </span>
                </td>
                <td>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      onEdit(brand)
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
