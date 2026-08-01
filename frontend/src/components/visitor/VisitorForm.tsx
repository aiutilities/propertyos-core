"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { PropertyListResponse } from "@/types/property";
import type {
  VisitResponse,
  VisitorInviteInput,
} from "@/types/visitor";

interface Person {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: string;
}

function defaultVisitDate() {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
}

export default function VisitorForm() {
  const router = useRouter();

  const [properties, setProperties] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [form, setForm] = useState<VisitorInviteInput>({
    visitorName: "",
    mobile: "",
    email: "",
    visitDate: defaultVisitDate(),
    visitPurpose: "",
    hostPersonId: "",
    propertyId: "",
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const [propertyResponse, personResponse] = await Promise.all([
          apiRequest<PropertyListResponse>(
            "/properties?page=1&limit=100&sortBy=name&sortOrder=asc",
          ),
          apiRequest<Person[]>("/persons"),
        ]);

        setProperties(
          propertyResponse.data.items.map((property) => ({
            id: property.id,
            name: property.name,
          })),
        );
        setPersons(
          personResponse.filter((person) => person.status === "ACTIVE"),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load form options.",
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<VisitResponse>(
        "/plugins/visitor/invite",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
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
          : "Unable to invite visitor.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
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
        Host
        <select
          disabled={loadingOptions || submitting}
          onChange={(event) =>
            setForm({ ...form, hostPersonId: event.target.value })
          }
          required
          value={form.hostPersonId}
        >
          <option value="">Select host</option>
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.displayName}
              {person.email ? ` — ${person.email}` : ""}
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
        <button disabled={submitting || loadingOptions} type="submit">
          {submitting ? "Creating invite..." : "Invite Visitor"}
        </button>

        <button
          className="secondary"
          disabled={submitting}
          onClick={() => router.push("/visitors")}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
