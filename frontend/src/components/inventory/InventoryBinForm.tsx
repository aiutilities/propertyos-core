"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createInventoryBin,
  updateInventoryBin,
} from "@/hooks/useInventoryStores";

import {
  InventoryBinLocation,
  InventoryStore,
} from "@/types/inventory";

export default function InventoryBinForm({
  store,
  bins,
  selected,
  onSaved,
  onCancel,
}: {
  store: InventoryStore;
  bins: InventoryBinLocation[];
  selected: InventoryBinLocation | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    parentBinId: "",
    binCode: "",
    name: "",
    description: "",
    barcode: "",
    isReceivingBin: false,
    isDispatchBin: false,
    isQuarantineBin: false,
    isActive: true,
    personId: "",
    remarks: "",
  });

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    setForm({
      parentBinId:
        selected?.parentBinId ?? "",
      binCode:
        selected?.binCode ?? "",
      name: selected?.name ?? "",
      description:
        selected?.description ?? "",
      barcode:
        selected?.barcode ?? "",
      isReceivingBin:
        selected?.isReceivingBin ??
        false,
      isDispatchBin:
        selected?.isDispatchBin ??
        false,
      isQuarantineBin:
        selected?.isQuarantineBin ??
        false,
      isActive:
        selected?.isActive ?? true,
      personId: "",
      remarks: "",
    });
    setError("");
  }, [selected, store.id]);

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
      if (selected) {
        await updateInventoryBin(
          selected.id,
          {
            parentBinId:
              form.parentBinId ||
              undefined,
            name: form.name.trim(),
            description:
              form.description.trim() ||
              undefined,
            barcode:
              form.barcode.trim() ||
              undefined,
            isReceivingBin:
              form.isReceivingBin,
            isDispatchBin:
              form.isDispatchBin,
            isQuarantineBin:
              form.isQuarantineBin,
            isActive: form.isActive,
            updatedByPersonId:
              form.personId.trim(),
            remarks:
              form.remarks.trim() ||
              undefined,
          },
        );
      } else {
        await createInventoryBin({
          storeId: store.id,
          parentBinId:
            form.parentBinId ||
            undefined,
          binCode: form.binCode
            .trim()
            .toUpperCase(),
          name: form.name.trim(),
          description:
            form.description.trim() ||
            undefined,
          barcode:
            form.barcode.trim() ||
            undefined,
          isReceivingBin:
            form.isReceivingBin,
          isDispatchBin:
            form.isDispatchBin,
          isQuarantineBin:
            form.isQuarantineBin,
          createdByPersonId:
            form.personId.trim(),
        });
      }

      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save bin.",
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
      <h2>
        {selected
          ? "Edit Bin"
          : `Add Bin — ${store.name}`}
      </h2>

      <div className="form-grid">
        <label>
          Bin Code
          <input
            required
            disabled={Boolean(selected)}
            value={form.binCode}
            onChange={(event) =>
              update(
                "binCode",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Bin Name
          <input
            required
            value={form.name}
            onChange={(event) =>
              update(
                "name",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Parent Bin
          <select
            value={form.parentBinId}
            onChange={(event) =>
              update(
                "parentBinId",
                event.target.value,
              )
            }
          >
            <option value="">
              No parent
            </option>
            {bins
              .filter(
                (bin) =>
                  bin.id !==
                  selected?.id,
              )
              .map((bin) => (
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
          Barcode
          <input
            value={form.barcode}
            onChange={(event) =>
              update(
                "barcode",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          {selected
            ? "Updated By Person ID"
            : "Created By Person ID"}
          <input
            required
            value={form.personId}
            onChange={(event) =>
              update(
                "personId",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              form.isReceivingBin
            }
            onChange={(event) =>
              update(
                "isReceivingBin",
                event.target.checked,
              )
            }
          />
          Receiving Bin
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              form.isDispatchBin
            }
            onChange={(event) =>
              update(
                "isDispatchBin",
                event.target.checked,
              )
            }
          />
          Dispatch Bin
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              form.isQuarantineBin
            }
            onChange={(event) =>
              update(
                "isQuarantineBin",
                event.target.checked,
              )
            }
          />
          Quarantine Bin
        </label>

        {selected ? (
          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                update(
                  "isActive",
                  event.target.checked,
                )
              }
            />
            Active
          </label>
        ) : null}
      </div>

      <label>
        Description
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) =>
            update(
              "description",
              event.target.value,
            )
          }
        />
      </label>

      {selected ? (
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
      ) : null}

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
            ? "Saving…"
            : selected
              ? "Update Bin"
              : "Create Bin"}
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
