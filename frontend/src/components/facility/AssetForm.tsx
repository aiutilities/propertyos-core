"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFacilityAsset,
  useFacilities,
} from "@/hooks/useFacilities";
import {
  AssetCondition,
  AssetStatus,
} from "@/types/facility";

export default function AssetForm() {
  const router = useRouter();
  const { categories, loading } = useFacilities();

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    propertyId: "",
    zoneId: "",
    spaceId: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    status: "DRAFT" as AssetStatus,
    condition: "GOOD" as AssetCondition,
    purchaseDate: "",
    purchaseCost: "",
    warrantyExpiresAt: "",
    vendorName: "",
    vendorContact: "",
    installedAt: "",
    createdByPersonId: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const asset = await createFacilityAsset({
        ...form,
        description: form.description || undefined,
        zoneId: form.zoneId || undefined,
        spaceId: form.spaceId || undefined,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        purchaseDate: form.purchaseDate || undefined,
        purchaseCost: form.purchaseCost
          ? Number(form.purchaseCost)
          : undefined,
        warrantyExpiresAt:
          form.warrantyExpiresAt || undefined,
        vendorName: form.vendorName || undefined,
        vendorContact: form.vendorContact || undefined,
        installedAt: form.installedAt || undefined,
      });

      router.push(`/facilities/assets/${asset.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create facility asset.",
      );
    } finally {
      setSaving(false);
    }
  }

  function update(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Asset Name
          <input
            required
            value={form.name}
            onChange={(event) =>
              update("name", event.target.value)
            }
          />
        </label>

        <label>
          Category
          <select
            required
            disabled={loading}
            value={form.categoryId}
            onChange={(event) =>
              update("categoryId", event.target.value)
            }
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Property ID
          <input
            required
            value={form.propertyId}
            onChange={(event) =>
              update("propertyId", event.target.value)
            }
          />
        </label>

        <label>
          Zone ID
          <input
            value={form.zoneId}
            onChange={(event) =>
              update("zoneId", event.target.value)
            }
          />
        </label>

        <label>
          Space ID
          <input
            value={form.spaceId}
            onChange={(event) =>
              update("spaceId", event.target.value)
            }
          />
        </label>

        <label>
          Condition
          <select
            value={form.condition}
            onChange={(event) =>
              update("condition", event.target.value)
            }
          >
            {["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Manufacturer
          <input
            value={form.manufacturer}
            onChange={(event) =>
              update("manufacturer", event.target.value)
            }
          />
        </label>

        <label>
          Model
          <input
            value={form.model}
            onChange={(event) =>
              update("model", event.target.value)
            }
          />
        </label>

        <label>
          Serial Number
          <input
            value={form.serialNumber}
            onChange={(event) =>
              update("serialNumber", event.target.value)
            }
          />
        </label>

        <label>
          Purchase Date
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(event) =>
              update("purchaseDate", event.target.value)
            }
          />
        </label>

        <label>
          Purchase Cost
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.purchaseCost}
            onChange={(event) =>
              update("purchaseCost", event.target.value)
            }
          />
        </label>

        <label>
          Warranty Expiry
          <input
            type="date"
            value={form.warrantyExpiresAt}
            onChange={(event) =>
              update("warrantyExpiresAt", event.target.value)
            }
          />
        </label>

        <label>
          Vendor Name
          <input
            value={form.vendorName}
            onChange={(event) =>
              update("vendorName", event.target.value)
            }
          />
        </label>

        <label>
          Vendor Contact
          <input
            value={form.vendorContact}
            onChange={(event) =>
              update("vendorContact", event.target.value)
            }
          />
        </label>

        <label>
          Installed Date
          <input
            type="date"
            value={form.installedAt}
            onChange={(event) =>
              update("installedAt", event.target.value)
            }
          />
        </label>

        <label>
          Created By Person ID
          <input
            required
            value={form.createdByPersonId}
            onChange={(event) =>
              update("createdByPersonId", event.target.value)
            }
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={5}
          value={form.description}
          onChange={(event) =>
            update("description", event.target.value)
          }
        />
      </label>

      {error ? <p className="text-danger">{error}</p> : null}

      <div className="form-actions">
        <button disabled={saving} type="submit">
          {saving ? "Creating…" : "Create Asset"}
        </button>
      </div>
    </form>
  );
}
