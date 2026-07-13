"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createAccessPoint } from "@/hooks/useAccessControl";
import { AccessDirection, AccessPointType } from "@/types/access-control";

export default function AccessPointForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    propertyId: "",
    zoneId: "",
    spaceId: "",
    code: "",
    name: "",
    description: "",
    accessPointType: "GATE" as AccessPointType,
    direction: "BIDIRECTIONAL" as AccessDirection,
    controllerProvider: "",
    controllerReference: "",
    requiresAntiPassback: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const point = await createAccessPoint({
        propertyId: form.propertyId,
        zoneId: form.zoneId || undefined,
        spaceId: form.spaceId || undefined,
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        accessPointType: form.accessPointType,
        direction: form.direction,
        controllerProvider: form.controllerProvider || undefined,
        controllerReference: form.controllerReference || undefined,
        requiresAntiPassback: form.requiresAntiPassback,
      });

      router.push(`/access/points/${point.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create access point.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Property ID
          <input
            required
            value={form.propertyId}
            onChange={(event) =>
              setForm({
                ...form,
                propertyId: event.target.value,
              })
            }
          />
        </label>

        <label>
          Code
          <input
            required
            placeholder="MAIN-GATE"
            value={form.code}
            onChange={(event) =>
              setForm({
                ...form,
                code: event.target.value.toUpperCase(),
              })
            }
          />
        </label>

        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
          />
        </label>

        <label>
          Type
          <select
            value={form.accessPointType}
            onChange={(event) =>
              setForm({
                ...form,
                accessPointType: event.target.value as AccessPointType,
              })
            }
          >
            {[
              "GATE",
              "DOOR",
              "TURNSTILE",
              "VEHICLE_BARRIER",
              "ELEVATOR",
              "OTHER",
            ].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          Direction
          <select
            value={form.direction}
            onChange={(event) =>
              setForm({
                ...form,
                direction: event.target.value as AccessDirection,
              })
            }
          >
            <option value="ENTRY">Entry</option>
            <option value="EXIT">Exit</option>
            <option value="BIDIRECTIONAL">Bidirectional</option>
          </select>
        </label>

        <label>
          Zone ID
          <input
            value={form.zoneId}
            onChange={(event) =>
              setForm({
                ...form,
                zoneId: event.target.value,
              })
            }
          />
        </label>

        <label>
          Space ID
          <input
            value={form.spaceId}
            onChange={(event) =>
              setForm({
                ...form,
                spaceId: event.target.value,
              })
            }
          />
        </label>

        <label>
          Controller Provider
          <input
            value={form.controllerProvider}
            onChange={(event) =>
              setForm({
                ...form,
                controllerProvider: event.target.value,
              })
            }
          />
        </label>

        <label>
          Controller Reference
          <input
            value={form.controllerReference}
            onChange={(event) =>
              setForm({
                ...form,
                controllerReference: event.target.value,
              })
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
            setForm({
              ...form,
              description: event.target.value,
            })
          }
        />
      </label>

      <label>
        <input
          checked={form.requiresAntiPassback}
          onChange={(event) =>
            setForm({
              ...form,
              requiresAntiPassback: event.target.checked,
            })
          }
          type="checkbox"
        />
        Enable anti-passback
      </label>

      {error ? <p className="text-danger">{error}</p> : null}

      <button disabled={saving} type="submit">
        {saving ? "Creating…" : "Create Access Point"}
      </button>
    </form>
  );
}
