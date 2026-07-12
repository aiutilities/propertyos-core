"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createAccessGrant,
  listAccessGrants,
  revokeAccessGrant,
} from "@/hooks/useAccessControl";
import {
  AccessDirection,
  AccessGrant,
  AccessGrantStatus,
  AccessSubjectType,
} from "@/types/access-control";

const SUBJECT_TYPES: AccessSubjectType[] = [
  "PERSON",
  "STAFF",
  "VISITOR",
  "VEHICLE",
];

const DIRECTIONS: AccessDirection[] = ["ENTRY", "EXIT", "BIDIRECTIONAL"];

const STATUSES: AccessGrantStatus[] = [
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
  "EXPIRED",
];

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function AccessGrantManager() {
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyGrantId, setBusyGrantId] = useState("");
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    accessPointId: "",
    subjectType: "" as AccessSubjectType | "",
    subjectId: "",
    status: "" as AccessGrantStatus | "",
  });

  const [form, setForm] = useState({
    accessPointId: "",
    subjectType: "PERSON" as AccessSubjectType,
    subjectId: "",
    direction: "BIDIRECTIONAL" as AccessDirection,
    validFrom: "",
    validUntil: "",
    daysOfWeek: "",
    startTime: "",
    endTime: "",
    issuedByPersonId: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setGrants(
        await listAccessGrants({
          accessPointId: filters.accessPointId || undefined,
          subjectType: filters.subjectType || undefined,
          subjectId: filters.subjectId || undefined,
          status: filters.status || undefined,
        }),
      );
    } catch (caught) {
      setGrants([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load access grants.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.accessPointId,
    filters.subjectType,
    filters.subjectId,
    filters.status,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const parsedDays = form.daysOfWeek
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map(Number);

    try {
      await createAccessGrant({
        accessPointId: form.accessPointId,
        subjectType: form.subjectType,
        subjectId: form.subjectId,
        direction: form.direction,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        schedule:
          parsedDays.length > 0 || form.startTime || form.endTime
            ? {
                daysOfWeek: parsedDays.length > 0 ? parsedDays : undefined,
                startTime: form.startTime || undefined,
                endTime: form.endTime || undefined,
              }
            : undefined,
        issuedByPersonId: form.issuedByPersonId,
        notes: form.notes || undefined,
      });

      setForm((current) => ({
        ...current,
        subjectId: "",
        validFrom: "",
        validUntil: "",
        daysOfWeek: "",
        startTime: "",
        endTime: "",
        notes: "",
      }));

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create access grant.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function revoke(grant: AccessGrant) {
    const revokedByPersonId = window.prompt(
      "Enter the person ID revoking this grant:",
    );

    if (!revokedByPersonId) {
      return;
    }

    const reason = window.prompt("Enter the revocation reason:");

    if (!reason) {
      return;
    }

    setBusyGrantId(grant.id);
    setError("");

    try {
      await revokeAccessGrant(grant.id, revokedByPersonId, reason);

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to revoke grant.",
      );
    } finally {
      setBusyGrantId("");
    }
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <h2>Create Access Grant</h2>

        <form className="stack-lg" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Access Point ID
              <input
                required
                value={form.accessPointId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    accessPointId: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Subject Type
              <select
                value={form.subjectType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    subjectType: event.target.value as AccessSubjectType,
                  })
                }
              >
                {SUBJECT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Subject ID
              <input
                required
                value={form.subjectId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    subjectId: event.target.value,
                  })
                }
              />
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
                {DIRECTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Valid From
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(event) =>
                  setForm({
                    ...form,
                    validFrom: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Valid Until
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(event) =>
                  setForm({
                    ...form,
                    validUntil: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Days of Week
              <input
                placeholder="0,1,2,3,4,5,6"
                value={form.daysOfWeek}
                onChange={(event) =>
                  setForm({
                    ...form,
                    daysOfWeek: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Start Time
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm({
                    ...form,
                    startTime: event.target.value,
                  })
                }
              />
            </label>

            <label>
              End Time
              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm({
                    ...form,
                    endTime: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Issued By Person ID
              <input
                required
                value={form.issuedByPersonId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    issuedByPersonId: event.target.value,
                  })
                }
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
            />
          </label>

          <button disabled={saving} type="submit">
            {saving ? "Creating…" : "Create Grant"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Grant Filters</h2>

        <div className="toolbar">
          <input
            placeholder="Access Point ID"
            value={filters.accessPointId}
            onChange={(event) =>
              setFilters({
                ...filters,
                accessPointId: event.target.value,
              })
            }
          />

          <select
            value={filters.subjectType}
            onChange={(event) =>
              setFilters({
                ...filters,
                subjectType: event.target.value as AccessSubjectType | "",
              })
            }
          >
            <option value="">All subject types</option>

            {SUBJECT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <input
            placeholder="Subject ID"
            value={filters.subjectId}
            onChange={(event) =>
              setFilters({
                ...filters,
                subjectId: event.target.value,
              })
            }
          />

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters({
                ...filters,
                status: event.target.value as AccessGrantStatus | "",
              })
            }
          >
            <option value="">All statuses</option>

            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <button onClick={() => void load()} type="button">
            Refresh
          </button>
        </div>
      </section>

      {error ? <div className="error-state">{error}</div> : null}

      {loading ? (
        <div className="loading-state">Loading grants…</div>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Access Point</th>
                  <th>Subject</th>
                  <th>Direction</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {grants.map((grant) => (
                  <tr key={grant.id}>
                    <td>{grant.accessPointId}</td>
                    <td>
                      {grant.subjectType}
                      <div className="muted-text">{grant.subjectId}</div>
                    </td>
                    <td>{grant.direction}</td>
                    <td>
                      {formatDate(grant.validFrom)}
                      <div className="muted-text">
                        to {formatDate(grant.validUntil)}
                      </div>
                    </td>
                    <td>{grant.status}</td>
                    <td>
                      {grant.status === "ACTIVE" ? (
                        <button
                          disabled={busyGrantId === grant.id}
                          onClick={() => void revoke(grant)}
                          type="button"
                        >
                          Revoke
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}

                {grants.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No access grants found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
