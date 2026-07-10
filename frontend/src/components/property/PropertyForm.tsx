"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { Property } from "@/types/property";

type PropertyFormProps = {
  propertyId?: string;
};

type PropertyPayload = {
  name: string;
  code?: string;
  propertyType?: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

type PropertyResponse = {
  success: boolean;
  data: Property;
};

const initialForm: PropertyPayload = {
  name: "",
  code: "",
  propertyType: "PG",
  description: "",
  addressLine1: "",
  addressLine2: "",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  postalCode: "",
};

export default function PropertyForm({ propertyId }: PropertyFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(propertyId);

  const [form, setForm] = useState<PropertyPayload>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) return;

      try {
        const response = await apiRequest<PropertyResponse>(`/properties/${propertyId}`);
        const property = response.data;

        setForm({
          name: property.name ?? "",
          code: property.code ?? "",
          propertyType: property.propertyType ?? "",
          description: property.description ?? "",
          addressLine1: property.addressLine1 ?? "",
          addressLine2: property.addressLine2 ?? "",
          city: property.city ?? "",
          state: property.state ?? "",
          country: property.country ?? "",
          postalCode: property.postalCode ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load property.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  function updateField(field: keyof PropertyPayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Property name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiRequest<PropertyResponse>(
        propertyId ? `/properties/${propertyId}` : "/properties",
        {
          method: propertyId ? "PATCH" : "POST",
          body: JSON.stringify(cleanPayload(form)),
        },
      );

      router.replace(`/properties/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save property.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading property...</p>;
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <label>
        Property Name
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
      </label>

      <label>
        Code
        <input
          value={form.code}
          onChange={(event) => updateField("code", event.target.value)}
        />
      </label>

      <label>
        Property Type
        <input
          value={form.propertyType}
          onChange={(event) => updateField("propertyType", event.target.value)}
        />
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>

      <label>
        Address Line 1
        <input
          value={form.addressLine1}
          onChange={(event) => updateField("addressLine1", event.target.value)}
        />
      </label>

      <label>
        Address Line 2
        <input
          value={form.addressLine2}
          onChange={(event) => updateField("addressLine2", event.target.value)}
        />
      </label>

      <div className="form-grid">
        <label>
          City
          <input
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </label>

        <label>
          State
          <input
            value={form.state}
            onChange={(event) => updateField("state", event.target.value)}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Country
          <input
            value={form.country}
            onChange={(event) => updateField("country", event.target.value)}
          />
        </label>

        <label>
          Postal Code
          <input
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button type="submit" disabled={saving}>
        {saving
          ? isEditMode
            ? "Updating..."
            : "Creating..."
          : isEditMode
            ? "Update Property"
            : "Create Property"}
      </button>
    </form>
  );
}

function cleanPayload(payload: PropertyPayload): PropertyPayload {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, value?.trim()])
      .filter(([, value]) => Boolean(value)),
  ) as PropertyPayload;
}
