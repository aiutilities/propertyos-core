import {
  InventoryItemCategory,
} from "@/types/inventory";

export default function CategoryTable({
  categories,
  onEdit,
}: {
  categories: InventoryItemCategory[];
  onEdit: (
    category: InventoryItemCategory,
  ) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No inventory categories</h3>
        <p>
          Create the first category to
          classify inventory items.
        </p>
      </div>
    );
  }

  const names = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ]),
  );

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Category</th>
              <th>Parent</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {categories.map(
              (category) => (
                <tr key={category.id}>
                  <td>
                    <strong>
                      {category.code}
                    </strong>
                  </td>
                  <td>{category.name}</td>
                  <td>
                    {category.parentCategoryId
                      ? names.get(
                          category.parentCategoryId,
                        ) ??
                        category.parentCategoryId
                      : "—"}
                  </td>
                  <td>
                    {category.description ??
                      "—"}
                  </td>
                  <td>
                    <span className="status-badge">
                      {category.isActive
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        onEdit(category)
                      }
                    >
                      Edit
                    </button>
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
