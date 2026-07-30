"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useInventoryItems,
} from "@/hooks/useInventoryItems";

import {
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import {
  createInventoryTransfer,
} from "@/hooks/useInventoryTransfers";

type TransferLineForm = {
  itemId: string;
  sourceBinLocationId: string;
  destinationBinLocationId: string;
  quantity: string;
  unitCost: string;
  remarks: string;
};

function emptyLine(): TransferLineForm {
  return {
    itemId: "",
    sourceBinLocationId: "",
    destinationBinLocationId: "",
    quantity: "",
    unitCost: "",
    remarks: "",
  };
}

export default function InventoryTransferForm() {
  const router = useRouter();

  const { items } = useInventoryItems({
    isActive: true,
  });

  const { stores } =
    useInventoryStores({
      isActive: true,
    });

  const [form, setForm] = useState({
    propertyId: "",
    sourceStoreId: "",
    destinationStoreId: "",
    transferDate:
      new Date()
        .toISOString()
        .slice(0, 10),
    createdByPersonId: "",
    remarks: "",
  });

  const [lines, setLines] = useState<
    TransferLineForm[]
  >([emptyLine()]);

  const {
    bins: sourceBins,
  } = useInventoryBins(
    form.sourceStoreId || undefined,
  );

  const {
    bins: destinationBins,
  } = useInventoryBins(
    form.destinationStoreId ||
      undefined,
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
    name: keyof TransferLineForm,
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

    if (
      form.sourceStoreId ===
      form.destinationStoreId
    ) {
      setSaving(false);
      setError(
        "Source and destination stores must differ.",
      );
      return;
    }

    try {
      const transfer =
        await createInventoryTransfer({
          propertyId:
            form.propertyId.trim(),
          sourceStoreId:
            form.sourceStoreId,
          destinationStoreId:
            form.destinationStoreId,
          transferDate:
            form.transferDate,
          createdByPersonId:
            form.createdByPersonId
              .trim(),
          remarks:
            form.remarks.trim() ||
            undefined,
          items: lines.map((line) => ({
            itemId: line.itemId,
            sourceBinLocationId:
              line.sourceBinLocationId ||
              undefined,
            destinationBinLocationId:
              line.destinationBinLocationId ||
              undefined,
            quantity: Number(
              line.quantity,
            ),
            unitCost: Number(
              line.unitCost,
            ),
            remarks:
              line.remarks.trim() ||
              undefined,
          })),
        });

      router.push(
        `/inventory/transfers/${transfer.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create inventory transfer.",
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
          Source Store
          <select
            required
            value={form.sourceStoreId}
            onChange={(event) => {
              const storeId =
                event.target.value;

              const store = stores.find(
                (value) =>
                  value.id === storeId,
              );

              update(
                "sourceStoreId",
                storeId,
              );

              if (store) {
                update(
                  "propertyId",
                  store.propertyId,
                );
              }
            }}
          >
            <option value="">
              Select source store
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
          Destination Store
          <select
            required
            value={
              form.destinationStoreId
            }
            onChange={(event) =>
              update(
                "destinationStoreId",
                event.target.value,
              )
            }
          >
            <option value="">
              Select destination store
            </option>

            {stores
              .filter(
                (store) =>
                  store.id !==
                  form.sourceStoreId,
              )
              .map((store) => (
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
          Transfer Date
          <input
            required
            type="date"
            value={form.transferDate}
            onChange={(event) =>
              update(
                "transferDate",
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
            <h2>Transfer Lines</h2>
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
                Source Bin
                <select
                  value={
                    line.sourceBinLocationId
                  }
                  onChange={(event) =>
                    updateLine(
                      index,
                      "sourceBinLocationId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No source bin
                  </option>

                  {sourceBins.map((bin) => (
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
                Destination Bin
                <select
                  value={
                    line.destinationBinLocationId
                  }
                  onChange={(event) =>
                    updateLine(
                      index,
                      "destinationBinLocationId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No destination bin
                  </option>

                  {destinationBins.map(
                    (bin) => (
                      <option
                        key={bin.id}
                        value={bin.id}
                      >
                        {bin.binCode} ·{" "}
                        {bin.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Quantity
                <input
                  required
                  min="0.000001"
                  step="0.000001"
                  type="number"
                  value={line.quantity}
                  onChange={(event) =>
                    updateLine(
                      index,
                      "quantity",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Unit Cost
                <input
                  required
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
          disabled={saving}
          type="submit"
        >
          {saving
            ? "Creating…"
            : "Create Transfer"}
        </button>
      </div>
    </form>
  );
}
