"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type CreatePropertyPayload = {
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
  data: {
    id: string;
  };
};

const initialForm: CreatePropertyPayload = {
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

export default function PropertyForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePropertyPayload>(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof CreatePropertyPayload, value: string) {
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
      const response = await apiRequest<PropertyResponse>("/properties", {
        method: "POST",
        body: JSON.stringify(cleanPayload(form)),
      });

      router.replace(`/properties/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create property.");
    } finally {
      setSaving(false);
    }
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
        {saving ? "Creating..." : "Create Property"}
      </button>
    </form>
  );
}

function cleanPayload(payload: CreatePropertyPayload): CreatePropertyPayload {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, value?.trim()])
      .filter(([, value]) => Boolean(value)),
  ) as CreatePropertyPayload;
}
