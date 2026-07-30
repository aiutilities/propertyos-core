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
  createInventoryMaterialIssue,
} from "@/hooks/useInventoryMaterialIssues";

import {
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

type MaterialIssueLineForm = {
  itemId: string;
  binLocationId: string;
  batchId: string;
  quantity: string;
  unitCost: string;
  remarks: string;
  manualBatchIds: string;
  strict: boolean;
};

function emptyLine(): MaterialIssueLineForm {
  return {
    itemId: "",
    binLocationId: "",
    batchId: "",
    quantity: "",
    unitCost: "",
    remarks: "",
    manualBatchIds: "",
    strict: false,
  };
}

export default function InventoryMaterialIssueForm() {
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
    storeId: "",
    issueDate:
      new Date()
        .toISOString()
        .slice(0, 10),
    reasonCode: "",
    reasonDescription: "",
    requestedByPersonId: "",
    createdByPersonId: "",
    remarks: "",
  });

  const [lines, setLines] = useState<
    MaterialIssueLineForm[]
  >([emptyLine()]);

  const { bins } = useInventoryBins(
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
    name: keyof MaterialIssueLineForm,
    value: string | boolean,
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

    try {
      const issue =
        await createInventoryMaterialIssue({
          propertyId:
            form.propertyId.trim(),
          storeId: form.storeId,
          issueDate: form.issueDate,
          reasonCode:
            form.reasonCode.trim(),
          reasonDescription:
            form.reasonDescription
              .trim() || undefined,
          requestedByPersonId:
            form.requestedByPersonId
              .trim() || undefined,
          createdByPersonId:
            form.createdByPersonId
              .trim(),
          remarks:
            form.remarks.trim() ||
            undefined,
          items: lines.map((line) => ({
            itemId: line.itemId,
            binLocationId:
              line.binLocationId ||
              undefined,
            batchId:
              line.batchId.trim() ||
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
            manualBatchIds:
              line.manualBatchIds.trim()
                ? line.manualBatchIds
                    .split(",")
                    .map((value) =>
                      value.trim(),
                    )
                    .filter(Boolean)
                : undefined,
            strict: line.strict,
          })),
        });

      router.push(
        `/inventory/material-issues/${issue.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create material issue.",
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

              if (store) {
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
          Issue Date
          <input
            required
            type="date"
            value={form.issueDate}
            onChange={(event) =>
              update(
                "issueDate",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Reason Code
          <input
            required
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
          Requested By Person ID
          <input
            value={
              form.requestedByPersonId
            }
            onChange={(event) =>
              update(
                "requestedByPersonId",
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
            <h2>Material Issue Lines</h2>
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
                Bin
                <select
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
                Batch ID
                <input
                  value={line.batchId}
                  onChange={(event) =>
                    updateLine(
                      index,
                      "batchId",
                      event.target.value,
                    )
                  }
                />
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
                Manual Batch IDs
                <input
                  placeholder="Comma-separated"
                  value={
                    line.manualBatchIds
                  }
                  onChange={(event) =>
                    updateLine(
                      index,
                      "manualBatchIds",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={line.strict}
                  onChange={(event) =>
                    updateLine(
                      index,
                      "strict",
                      event.target.checked,
                    )
                  }
                />
                Strict batch allocation
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
            : "Create Material Issue"}
        </button>
      </div>
    </form>
  );
}
