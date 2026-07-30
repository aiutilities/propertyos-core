"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createInventoryUnit,
  updateInventoryUnit,
} from "@/hooks/useInventoryMasterData";

import {
  InventoryUnitOfMeasure,
} from "@/types/inventory";

export default function UnitForm({
  selected,
  onSaved,
  onCancel,
}: {
  selected: InventoryUnitOfMeasure | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "",
    decimalPlaces: "2",
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
      code: selected?.code ?? "",
      name: selected?.name ?? "",
      symbol: selected?.symbol ?? "",
      decimalPlaces: String(
        selected?.decimalPlaces ?? 2,
      ),
      isActive:
        selected?.isActive ?? true,
      personId: "",
      remarks: "",
    });
    setError("");
  }, [selected]);

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
        await updateInventoryUnit(
          selected.id,
          {
            name: form.name.trim(),
            symbol: form.symbol.trim(),
            decimalPlaces: Number(
              form.decimalPlaces,
            ),
            isActive: form.isActive,
            updatedByPersonId:
              form.personId.trim(),
            remarks:
              form.remarks.trim() ||
              undefined,
          },
        );
      } else {
        await createInventoryUnit({
          code: form.code
            .trim()
            .toUpperCase(),
          name: form.name.trim(),
          symbol: form.symbol.trim(),
          decimalPlaces: Number(
            form.decimalPlaces,
          ),
          createdByPersonId:
            form.personId.trim(),
        });
      }

      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save unit.",
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
          ? "Edit Unit"
          : "Add Unit"}
      </h2>

      <div className="form-grid">
        <label>
          Code
          <input
            required
            disabled={Boolean(selected)}
            value={form.code}
            onChange={(event) =>
              update(
                "code",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Name
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
          Symbol
          <input
            required
            value={form.symbol}
            onChange={(event) =>
              update(
                "symbol",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Decimal Places
          <input
            min="0"
            max="6"
            required
            type="number"
            value={form.decimalPlaces}
            onChange={(event) =>
              update(
                "decimalPlaces",
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
              ? "Update Unit"
              : "Create Unit"}
        </button>

        {selected ? (
          <button
            className="secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
