"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createInventoryBrand,
  updateInventoryBrand,
} from "@/hooks/useInventoryMasterData";

import {
  InventoryBrand,
} from "@/types/inventory";

export default function BrandForm({
  selected,
  onSaved,
  onCancel,
}: {
  selected: InventoryBrand | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
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
      description:
        selected?.description ?? "",
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
        await updateInventoryBrand(
          selected.id,
          {
            name: form.name.trim(),
            description:
              form.description.trim() ||
              undefined,
            isActive: form.isActive,
            updatedByPersonId:
              form.personId.trim(),
            remarks:
              form.remarks.trim() ||
              undefined,
          },
        );
      } else {
        await createInventoryBrand({
          code: form.code
            .trim()
            .toUpperCase(),
          name: form.name.trim(),
          description:
            form.description.trim() ||
            undefined,
          createdByPersonId:
            form.personId.trim(),
        });
      }

      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save brand.",
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
          ? "Edit Brand"
          : "Add Brand"}
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

      <label>
        Description
        <textarea
          rows={4}
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
              ? "Update Brand"
              : "Create Brand"}
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
