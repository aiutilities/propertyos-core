"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Props = {
  propertyId: string;
};

export default function ZoneForm({ propertyId }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [zoneType, setZoneType] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest(`/properties/${propertyId}/zones`, {
        method: "POST",
        body: JSON.stringify({
          name,
          code,
          zoneType,
          description,
        }),
      });

      router.replace(`/properties/${propertyId}/zones`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create zone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label>
        Code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>

      <label>
        Zone Type
        <input
          value={zoneType}
          onChange={(e) => setZoneType(e.target.value)}
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button disabled={saving}>
        {saving ? "Creating..." : "Create Zone"}
      </button>
    </form>
  );
}
