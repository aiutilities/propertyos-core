"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMaintenanceTicket,
  useMaintenance,
} from "@/hooks/useMaintenance";
import { MaintenancePriority } from "@/types/maintenance";

export default function MaintenanceForm({
  residentMode = false,
}: {
  residentMode?: boolean;
}) {
  const router = useRouter();
  const { categories, loading } = useMaintenance();
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    propertyId: "",
    spaceId: "",
    reporterPersonId: "",
    priority: "MEDIUM" as MaintenancePriority,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const ticket = await createMaintenanceTicket({
        ...form,
        spaceId: form.spaceId || undefined,
      });

      router.push(
        residentMode
          ? "/resident/maintenance"
          : `/maintenance/${ticket.id}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create maintenance ticket.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Title
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
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
              setForm({
                ...form,
                categoryId: event.target.value,
              })
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
          Priority
          <select
            value={form.priority}
            onChange={(event) =>
              setForm({
                ...form,
                priority:
                  event.target.value as MaintenancePriority,
              })
            }
          >
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </label>

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
          Reporter Person ID
          <input
            required
            value={form.reporterPersonId}
            onChange={(event) =>
              setForm({
                ...form,
                reporterPersonId: event.target.value,
              })
            }
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          required
          rows={6}
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description: event.target.value,
            })
          }
        />
      </label>

      <section className="panel muted-panel">
        <strong>Attachments</strong>
        <p>
          Photo and document uploads will be connected to the
          existing Storage module in the next hardening pass.
        </p>
      </section>

      {error ? <p className="text-danger">{error}</p> : null}

      <div className="form-actions">
        <button disabled={saving} type="submit">
          {saving ? "Creating…" : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
