"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import SpaceLookup from "@/components/common/SpaceLookup";
import { apiRequest } from "@/lib/api";

export default function AssignSpaceForm({
  tenantId,
}: {
  tenantId: string;
}) {
  const router = useRouter();
  const [spaceId, setSpaceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest(`/tenants/${tenantId}/assign-space`, {
        method: "POST",
        body: JSON.stringify({ spaceId }),
      });

      router.replace(`/tenants/${tenantId}/spaces`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign space.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>
        Space
        <SpaceLookup
          required
          tenantId={tenantId}
          value={spaceId}
          onChange={setSpaceId}
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button disabled={saving}>
        {saving ? "Assigning..." : "Assign Space"}
      </button>
    </form>
  );
}
