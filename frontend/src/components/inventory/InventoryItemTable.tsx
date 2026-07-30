import {
  InventoryBrand,
  InventoryItem,
  InventoryItemCategory,
  InventoryUnitOfMeasure,
} from "@/types/inventory";

function buildLookup<T extends {
  id: string;
  name: string;
}>(
  values: T[],
): Map<string, string> {
  return new Map(
    values.map((value) => [
      value.id,
      value.name,
    ]),
  );
}

function formatMoney(
  value: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      },
    ).format(Number(value));
  } catch {
    return `${currency} ${Number(
      value,
    ).toFixed(2)}`;
  }
}

export default function InventoryItemTable({
  items,
  categories,
  brands,
  units,
}: {
  items: InventoryItem[];
  categories: InventoryItemCategory[];
  brands: InventoryBrand[];
  units: InventoryUnitOfMeasure[];
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No inventory items found</h3>
        <p>
          Create an inventory item or adjust
          the filters.
        </p>
      </div>
    );
  }

  const categoryNames =
    buildLookup(categories);
  const brandNames = buildLookup(brands);
  const unitNames = new Map(
    units.map((unit) => [
      unit.id,
      unit.symbol || unit.name,
    ]),
  );

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Classification</th>
              <th>Unit</th>
              <th>Reorder Level</th>
              <th>Standard Cost</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.sku}</strong>
                </td>
                <td>
                  <strong>{item.name}</strong>
                  <div className="muted-text">
                    {item.description ?? "—"}
                  </div>
                </td>
                <td>
                  {
                    categoryNames.get(
                      item.categoryId,
                    ) ?? item.categoryId
                  }
                  <div className="muted-text">
                    {item.brandId
                      ? brandNames.get(
                          item.brandId,
                        ) ?? item.brandId
                      : item.itemType}
                  </div>
                </td>
                <td>
                  {
                    unitNames.get(
                      item.unitOfMeasureId,
                    ) ?? item.unitOfMeasureId
                  }
                </td>
                <td>{item.reorderLevel}</td>
                <td>
                  {formatMoney(
                    item.standardCost,
                    item.currency,
                  )}
                </td>
                <td>
                  <span className="status-badge">
                    {item.isActive
                      ? "ACTIVE"
                      : "INACTIVE"}
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
