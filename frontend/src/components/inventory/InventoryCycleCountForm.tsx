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
  createInventoryCycleCount,
} from "@/hooks/useInventoryCycleCounts";

import {
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

export default function InventoryCycleCountForm() {
  const router = useRouter();

  const { stores } =
    useInventoryStores({
      isActive: true,
    });

  const { items } =
    useInventoryItems({
      isActive: true,
    });

  const [form, setForm] = useState({
    propertyId: "",
    storeId: "",
    countDate:
      new Date()
        .toISOString()
        .slice(0, 10),
    blindCount: false,
    freezeStock: false,
    scopeType: "STORE",
    binLocationId: "",
    itemId: "",
    createdByPersonId: "",
    notes: "",
  });

  const { bins } = useInventoryBins(
    form.storeId || undefined,
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function update(
    name: string,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const count =
        await createInventoryCycleCount({
          propertyId:
            form.propertyId.trim(),
          storeId: form.storeId,
          countDate: form.countDate,
          blindCount:
            form.blindCount,
          freezeStock:
            form.freezeStock,
          scopeType:
            form.scopeType,
          binLocationId:
            form.scopeType === "BIN"
              ? form.binLocationId ||
                undefined
              : undefined,
          itemId:
            form.scopeType === "ITEM"
              ? form.itemId ||
                undefined
              : undefined,
          createdByPersonId:
            form.createdByPersonId
              .trim(),
          notes:
            form.notes.trim() ||
            undefined,
        });

      router.push(
        `/inventory/cycle-counts/${count.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create cycle count.",
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
          Count Date
          <input
            required
            type="date"
            value={form.countDate}
            onChange={(event) =>
              update(
                "countDate",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Scope
          <select
            value={form.scopeType}
            onChange={(event) =>
              update(
                "scopeType",
                event.target.value,
              )
            }
          >
            <option value="STORE">
              Entire Store
            </option>
            <option value="BIN">
              Specific Bin
            </option>
            <option value="ITEM">
              Specific Item
            </option>
          </select>
        </label>

        {form.scopeType === "BIN" ? (
          <label>
            Bin
            <select
              required
              value={
                form.binLocationId
              }
              onChange={(event) =>
                update(
                  "binLocationId",
                  event.target.value,
                )
              }
            >
              <option value="">
                Select bin
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
        ) : null}

        {form.scopeType === "ITEM" ? (
          <label>
            Item
            <select
              required
              value={form.itemId}
              onChange={(event) =>
                update(
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
        ) : null}

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

        <label>
          <input
            type="checkbox"
            checked={form.blindCount}
            onChange={(event) =>
              update(
                "blindCount",
                event.target.checked,
              )
            }
          />
          Blind count
        </label>

        <label>
          <input
            type="checkbox"
            checked={form.freezeStock}
            onChange={(event) =>
              update(
                "freezeStock",
                event.target.checked,
              )
            }
          />
          Freeze stock during count
        </label>
      </div>

      <label>
        Notes
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) =>
            update(
              "notes",
              event.target.value,
            )
          }
        />
      </label>

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
            : "Create Cycle Count"}
        </button>
      </div>
    </form>
  );
}
