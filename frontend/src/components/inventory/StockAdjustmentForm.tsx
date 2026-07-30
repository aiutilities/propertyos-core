"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createStockAdjustment,
} from "@/hooks/useStockAdjustments";

import {
  useInventoryItems,
} from "@/hooks/useInventoryItems";

import {
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

type LineForm = {
  itemId: string;
  binLocationId: string;
  quantityDelta: string;
  unitCost: string;
  remarks: string;
};

function emptyLine(): LineForm {
  return {
    itemId: "",
    binLocationId: "",
    quantityDelta: "",
    unitCost: "",
    remarks: "",
  };
}

export default function StockAdjustmentForm() {
  const router = useRouter();

  const {
    items,
    loading: itemsLoading,
  } = useInventoryItems({
    isActive: true,
  });

  const {
    stores,
    loading: storesLoading,
  } = useInventoryStores({
    isActive: true,
  });

  const [form, setForm] = useState({
    propertyId: "",
    storeId: "",
    adjustmentDate: "",
    reasonCode: "",
    reasonDescription: "",
    referenceNumber: "",
    remarks: "",
    createdByPersonId: "",
  });

  const [lines, setLines] = useState<
    LineForm[]
  >([emptyLine()]);

  const {
    bins,
    loading: binsLoading,
  } = useInventoryBins(
    form.storeId || undefined,
  );

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  function update(
    name: string,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateLine(
    index: number,
    name: keyof LineForm,
    value: string,
  ) {
    setLines((current) =>
      current.map((line, position) =>
        position === index
          ? {
              ...line,
              [name]: value,
            }
          : line,
      ),
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      emptyLine(),
    ]);
  }

  function removeLine(
    index: number,
  ) {
    setLines((current) =>
      current.length === 1
        ? current
        : current.filter(
            (_, position) =>
              position !== index,
          ),
    );
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const validLines = lines.filter(
      (line) =>
        line.itemId &&
        line.quantityDelta !== "",
    );

    if (validLines.length === 0) {
      setSaving(false);
      setError(
        "At least one adjustment line is required.",
      );
      return;
    }

    try {
      const adjustment =
        await createStockAdjustment({
          propertyId:
            form.propertyId.trim(),
          storeId: form.storeId,
          adjustmentDate:
            form.adjustmentDate ||
            undefined,
          reasonCode:
            form.reasonCode.trim() ||
            undefined,
          reasonDescription:
            form.reasonDescription
              .trim() || undefined,
          referenceNumber:
            form.referenceNumber
              .trim() || undefined,
          remarks:
            form.remarks.trim() ||
            undefined,
          createdByPersonId:
            form.createdByPersonId
              .trim(),
          items: validLines.map(
            (line) => ({
              itemId: line.itemId,
              binLocationId:
                line.binLocationId ||
                undefined,
              quantityDelta: Number(
                line.quantityDelta,
              ),
              unitCost:
                line.unitCost === ""
                  ? undefined
                  : Number(
                      line.unitCost,
                    ),
              remarks:
                line.remarks.trim() ||
                undefined,
            }),
          ),
        });

      router.push(
        `/inventory/adjustments/${adjustment.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create stock adjustment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-card"
      onSubmit={submit}
    >
      <div className="form-grid">
        <label>
          Property ID
          <input
            required
            value={form.propertyId}
            onChange={(event) =>
              update(
                "propertyId",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Store
          <select
            required
            disabled={storesLoading}
            value={form.storeId}
            onChange={(event) => {
              const storeId =
                event.target.value;

              const store = stores.find(
                (value) =>
                  value.id === storeId,
              );

              update(
                "storeId",
                storeId,
              );

              if (
                store &&
                !form.propertyId
              ) {
                update(
                  "propertyId",
                  store.propertyId,
                );
              }
            }}
          >
            <option value="">
              Select store
            </option>

            {stores.map((store) => (
              <option
                key={store.id}
                value={store.id}
              >
                {store.storeCode} ·{" "}
                {store.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Adjustment Date
          <input
            type="date"
            value={
              form.adjustmentDate
            }
            onChange={(event) =>
              update(
                "adjustmentDate",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Reason Code
          <input
            value={form.reasonCode}
            onChange={(event) =>
              update(
                "reasonCode",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Reference Number
          <input
            value={
              form.referenceNumber
            }
            onChange={(event) =>
              update(
                "referenceNumber",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Created By Person ID
          <input
            required
            value={
              form.createdByPersonId
            }
            onChange={(event) =>
              update(
                "createdByPersonId",
                event.target.value,
              )
            }
          />
        </label>
      </div>

      <label>
        Reason Description
        <textarea
          rows={3}
          value={
            form.reasonDescription
          }
          onChange={(event) =>
            update(
              "reasonDescription",
              event.target.value,
            )
          }
        />
      </label>

      <label>
        Remarks
        <textarea
          rows={3}
          value={form.remarks}
          onChange={(event) =>
            update(
              "remarks",
              event.target.value,
            )
          }
        />
      </label>

      <section className="stack-lg">
        <div className="page-header">
          <div>
            <h2>Adjustment Lines</h2>
            <p className="muted-text">
              Use positive quantities to
              increase stock and negative
              quantities to reduce stock.
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={addLine}
          >
            Add Line
          </button>
        </div>

        {lines.map((line, index) => (
          <div
            className="panel"
            key={index}
          >
            <div className="form-grid">
              <label>
                Item
                <select
                  required
                  disabled={itemsLoading}
                  value={line.itemId}
                  onChange={(event) =>
                    updateLine(
                      index,
                      "itemId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select item
                  </option>

                  {items.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.sku} ·{" "}
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Bin
                <select
                  disabled={
                    binsLoading ||
                    !form.storeId
                  }
                  value={
                    line.binLocationId
                  }
                  onChange={(event) =>
                    updateLine(
                      index,
                      "binLocationId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No bin
                  </option>

                  {bins.map((bin) => (
                    <option
                      key={bin.id}
                      value={bin.id}
                    >
                      {bin.binCode} ·{" "}
                      {bin.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantity Delta
                <input
                  required
                  step="0.01"
                  type="number"
                  value={
                    line.quantityDelta
                  }
                  onChange={(event) =>
                    updateLine(
                      index,
                      "quantityDelta",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Unit Cost
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={line.unitCost}
                  onChange={(event) =>
                    updateLine(
                      index,
                      "unitCost",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Line Remarks
                <input
                  value={line.remarks}
                  onChange={(event) =>
                    updateLine(
                      index,
                      "remarks",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                className="secondary-button"
                disabled={
                  lines.length === 1
                }
                type="button"
                onClick={() =>
                  removeLine(index)
                }
              >
                Remove Line
              </button>
            </div>
          </div>
        ))}
      </section>

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          disabled={
            saving ||
            storesLoading ||
            itemsLoading
          }
          type="submit"
        >
          {saving
            ? "Creating…"
            : "Create Stock Adjustment"}
        </button>
      </div>
    </form>
  );
}
