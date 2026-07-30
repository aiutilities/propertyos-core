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
  createInventoryReservation,
} from "@/hooks/useInventoryReservations";

import {
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

export default function InventoryReservationForm() {
  const router = useRouter();

  const { items, loading: itemsLoading } =
    useInventoryItems({
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
    binLocationId: "",
    itemId: "",
    quantity: "",
    sourceType: "",
    sourceId: "",
    referenceNumber: "",
    expiresAt: "",
    remarks: "",
    createdByPersonId: "",
  });

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

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const reservation =
        await createInventoryReservation({
          propertyId:
            form.propertyId.trim() ||
            undefined,
          storeId: form.storeId,
          binLocationId:
            form.binLocationId ||
            undefined,
          itemId: form.itemId,
          quantity: Number(
            form.quantity,
          ),
          sourceType:
            form.sourceType.trim() ||
            undefined,
          sourceId:
            form.sourceId.trim() ||
            undefined,
          referenceNumber:
            form.referenceNumber
              .trim() || undefined,
          expiresAt:
            form.expiresAt ||
            undefined,
          remarks:
            form.remarks.trim() ||
            undefined,
          createdByPersonId:
            form.createdByPersonId
              .trim(),
        });

      router.push(
        `/inventory/reservations/${reservation.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create stock reservation.",
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
          Property ID
          <input
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
          Item
          <select
            required
            disabled={itemsLoading}
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

        <label>
          Bin
          <select
            disabled={
              binsLoading ||
              !form.storeId
            }
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
          Quantity
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={form.quantity}
            onChange={(event) =>
              update(
                "quantity",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Expiry
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) =>
              update(
                "expiresAt",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Source Type
          <input
            value={form.sourceType}
            onChange={(event) =>
              update(
                "sourceType",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Source ID
          <input
            value={form.sourceId}
            onChange={(event) =>
              update(
                "sourceId",
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
        Remarks
        <textarea
          rows={4}
          value={form.remarks}
          onChange={(event) =>
            update(
              "remarks",
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
          disabled={
            saving ||
            storesLoading ||
            itemsLoading
          }
          type="submit"
        >
          {saving
            ? "Creating…"
            : "Create Reservation"}
        </button>
      </div>
    </form>
  );
}
