"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { apiRequest } from "@/lib/api";

export default function SpaceForm({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const notifications = useNotifications();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [floor, setFloor] = useState("");
  const [description, setDescription] = useState("");
  const [zoneId, setZoneId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest(`/properties/${propertyId}/spaces`, {
        method: "POST",
        body: JSON.stringify({
          name,
          code,
          zoneId: zoneId || undefined,
          spaceType,
          floor,
          description,
        }),
      });

      notifications.afterRedirect.created(
        "Space",
        name.trim(),
        "The space was added successfully.",
      );

      router.replace(`/properties/${propertyId}/spaces`);
    } catch (err) {
      console.error(
        "Space creation failed",
        err,
      );

      notifications.error(
        err,
        "Space could not be created.",
      );

      setError(
        "Unable to create space. Please review the form and try again.",
      );
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
        Zone ID (optional)
        <input
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
        />
      </label>

      <label>
        Space Type
        <input
          value={spaceType}
          onChange={(e) => setSpaceType(e.target.value)}
        />
      </label>

      <label>
        Floor
        <input
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
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
        {saving ? "Creating..." : "Create Space"}
      </button>
    </form>
  );
}
