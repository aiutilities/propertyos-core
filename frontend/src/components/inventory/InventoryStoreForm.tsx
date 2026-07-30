"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createInventoryStore,
  updateInventoryStore,
} from "@/hooks/useInventoryStores";

import {
  InventoryStore,
} from "@/types/inventory";

export default function InventoryStoreForm({
  selected,
  onSaved,
  onCancel,
}: {
  selected: InventoryStore | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    storeCode: "",
    name: "",
    description: "",
    propertyId: "",
    zoneId: "",
    spaceId: "",
    managerPersonId: "",
    personId: "",
    remarks: "",
  });

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    setForm({
      storeCode:
        selected?.storeCode ?? "",
      name: selected?.name ?? "",
      description:
        selected?.description ?? "",
      propertyId:
        selected?.propertyId ?? "",
      zoneId: selected?.zoneId ?? "",
      spaceId: selected?.spaceId ?? "",
      managerPersonId:
        selected?.managerPersonId ?? "",
      personId: "",
      remarks: "",
    });
    setError("");
  }, [selected]);

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
      if (selected) {
        await updateInventoryStore(
          selected.id,
          {
            name: form.name.trim(),
            description:
              form.description.trim() ||
              undefined,
            zoneId:
              form.zoneId.trim() ||
              undefined,
            spaceId:
              form.spaceId.trim() ||
              undefined,
            managerPersonId:
              form.managerPersonId
                .trim() || undefined,
            updatedByPersonId:
              form.personId.trim(),
            remarks:
              form.remarks.trim() ||
              undefined,
          },
        );
      } else {
        await createInventoryStore({
          storeCode: form.storeCode
            .trim()
            .toUpperCase(),
          name: form.name.trim(),
          description:
            form.description.trim() ||
            undefined,
          propertyId:
            form.propertyId.trim(),
          zoneId:
            form.zoneId.trim() ||
            undefined,
          spaceId:
            form.spaceId.trim() ||
            undefined,
          managerPersonId:
            form.managerPersonId
              .trim() || undefined,
          createdByPersonId:
            form.personId.trim(),
        });
      }

      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save inventory store.",
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
          ? "Edit Store"
          : "Add Store"}
      </h2>

      <div className="form-grid">
        <label>
          Store Code
          <input
            required
            disabled={Boolean(selected)}
            value={form.storeCode}
            onChange={(event) =>
              update(
                "storeCode",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Store Name
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
          Property ID
          <input
            required
            disabled={Boolean(selected)}
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
          Zone ID
          <input
            value={form.zoneId}
            onChange={(event) =>
              update(
                "zoneId",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Space ID
          <input
            value={form.spaceId}
            onChange={(event) =>
              update(
                "spaceId",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Manager Person ID
          <input
            value={
              form.managerPersonId
            }
            onChange={(event) =>
              update(
                "managerPersonId",
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
              ? "Update Store"
              : "Create Store"}
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
