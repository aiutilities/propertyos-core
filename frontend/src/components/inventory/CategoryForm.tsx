"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createInventoryCategory,
  updateInventoryCategory,
} from "@/hooks/useInventoryMasterData";

import {
  InventoryItemCategory,
} from "@/types/inventory";

export default function CategoryForm({
  categories,
  selected,
  onSaved,
  onCancel,
}: {
  categories: InventoryItemCategory[];
  selected: InventoryItemCategory | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    parentCategoryId: "",
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
      parentCategoryId:
        selected?.parentCategoryId ?? "",
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
        await updateInventoryCategory(
          selected.id,
          {
            parentCategoryId:
              form.parentCategoryId ||
              undefined,
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
        await createInventoryCategory({
          parentCategoryId:
            form.parentCategoryId ||
            undefined,
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
          : "Unable to save category.",
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
          ? "Edit Category"
          : "Add Category"}
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
          Parent Category
          <select
            value={
              form.parentCategoryId
            }
            onChange={(event) =>
              update(
                "parentCategoryId",
                event.target.value,
              )
            }
          >
            <option value="">
              No parent
            </option>
            {categories
              .filter(
                (category) =>
                  category.id !==
                  selected?.id,
              )
              .map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.code} ·{" "}
                  {category.name}
                </option>
              ))}
          </select>
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
              ? "Update Category"
              : "Create Category"}
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
