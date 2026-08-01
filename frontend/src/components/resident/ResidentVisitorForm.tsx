"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import type { PropertyListResponse } from "@/types/property";
import type {
  VisitResponse,
  VisitorInviteInput,
} from "@/types/visitor";

function defaultVisitDate() {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
}

export default function ResidentVisitorForm() {
  const router = useRouter();
  const user = getSessionUser();

  const [properties, setProperties] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [form, setForm] = useState<
    Omit<VisitorInviteInput, "hostPersonId">
  >({
    visitorName: "",
    mobile: "",
    email: "",
    visitDate: defaultVisitDate(),
    visitPurpose: "",
    propertyId: "",
  });

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      setLoadingOptions(true);
      setError("");

      try {
        const response = await apiRequest<PropertyListResponse>(
          "/properties?page=1&limit=100&sortBy=name&sortOrder=asc",
        );

        setProperties(
          response.data.items.map((property) => ({
            id: property.id,
            name: property.name,
          })),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load properties.",
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadProperties();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id) {
      setError("Resident session is unavailable.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<VisitResponse>(
        "/plugins/visitor/invite",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            hostPersonId: user.id,
            email: form.email || undefined,
            visitPurpose: form.visitPurpose || undefined,
            visitDate: new Date(form.visitDate).toISOString(),
          }),
        },
      );

      router.push(`/visitors/${response.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create visitor invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return <p className="error">Resident session is unavailable.</p>;
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="resident-host-summary">
        <p className="eyebrow">Host</p>
        <strong>{user.name}</strong>
        <span>{user.email}</span>
      </div>

      {error && <p className="error">{error}</p>}

      <label>
        Visitor name
        <input
          disabled={submitting}
          onChange={(event) =>
            setForm({ ...form, visitorName: event.target.value })
          }
          required
          value={form.visitorName}
        />
      </label>

      <label>
        Mobile
        <input
          disabled={submitting}
          onChange={(event) =>
            setForm({ ...form, mobile: event.target.value })
          }
          required
          type="tel"
          value={form.mobile}
        />
      </label>

      <label>
        Email
        <input
          disabled={submitting}
          onChange={(event) =>
            setForm({ ...form, email: event.target.value })
          }
          type="email"
          value={form.email}
        />
      </label>

      <label>
        Property
        <select
          disabled={loadingOptions || submitting}
          onChange={(event) =>
            setForm({ ...form, propertyId: event.target.value })
          }
          required
          value={form.propertyId}
        >
          <option value="">Select property</option>

          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Visit date and time
        <input
          disabled={submitting}
          min={new Date().toISOString().slice(0, 16)}
          onChange={(event) =>
            setForm({ ...form, visitDate: event.target.value })
          }
          required
          type="datetime-local"
          value={form.visitDate}
        />
      </label>

      <label>
        Purpose
        <textarea
          disabled={submitting}
          onChange={(event) =>
            setForm({ ...form, visitPurpose: event.target.value })
          }
          rows={3}
          value={form.visitPurpose}
        />
      </label>

      <div className="actions">
        <button
          disabled={submitting || loadingOptions}
          type="submit"
        >
          {submitting ? "Creating invite..." : "Invite Visitor"}
        </button>

        <button
          className="secondary"
          disabled={submitting}
          onClick={() => router.push("/resident/visitors")}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
