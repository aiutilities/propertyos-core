"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import PersonLookup from "@/components/common/PersonLookup";
import {
  createReservationResourceBlock,
  getReservationResource,
  listReservationResourceBlocks,
  updateReservationResource,
} from "@/hooks/useReservations";
import {
  ReservationResource,
  ReservationResourceBlock,
  ReservationResourceType,
} from "@/types/reservation";

const resourceTypes:
  ReservationResourceType[] = [
    "FACILITY",
    "ROOM",
    "DESK",
    "PARKING",
    "EQUIPMENT",
    "AMENITY",
    "SERVICE",
    "OTHER",
  ];

function formatDate(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function toIso(
  value: string,
) {
  return value
    ? new Date(value).toISOString()
    : "";
}

export default function ReservationResourceDetails({
  resourceId,
}: {
  resourceId: string;
}) {
  const [
    resource,
    setResource,
  ] = useState<ReservationResource | null>(
    null,
  );

  const [
    blocks,
    setBlocks,
  ] = useState<
    ReservationResourceBlock[]
  >([]);

  const [
    form,
    setForm,
  ] = useState({
    zoneId: "",
    spaceId: "",
    name: "",
    description: "",
    resourceType:
      "FACILITY" as ReservationResourceType,
    capacity: 1,
    requiresApproval: false,
    isActive: true,
    minimumDurationMinutes: 30,
    maximumDurationMinutes: "",
    bookingIntervalMinutes: 30,
    advanceBookingDays: 30,
    minimumNoticeMinutes: 0,
    openingTime: "",
    closingTime: "",
  });

  const [
    block,
    setBlock,
  ] = useState({
    startAt: "",
    endAt: "",
    reason: "",
    createdByPersonId: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        resourceResult,
        blockResults,
      ] = await Promise.all([
        getReservationResource(
          resourceId,
        ),
        listReservationResourceBlocks(
          resourceId,
        ),
      ]);

      setResource(
        resourceResult,
      );

      setBlocks(
        blockResults,
      );

      setForm({
        zoneId:
          resourceResult.zoneId ??
          "",
        spaceId:
          resourceResult.spaceId ??
          "",
        name:
          resourceResult.name,
        description:
          resourceResult.description ??
          "",
        resourceType:
          resourceResult.resourceType,
        capacity:
          resourceResult.capacity,
        requiresApproval:
          resourceResult.requiresApproval,
        isActive:
          resourceResult.isActive,
        minimumDurationMinutes:
          resourceResult.minimumDurationMinutes,
        maximumDurationMinutes:
          resourceResult.maximumDurationMinutes !==
          undefined
            ? String(
                resourceResult.maximumDurationMinutes,
              )
            : "",
        bookingIntervalMinutes:
          resourceResult.bookingIntervalMinutes,
        advanceBookingDays:
          resourceResult.advanceBookingDays,
        minimumNoticeMinutes:
          resourceResult.minimumNoticeMinutes,
        openingTime:
          resourceResult.openingTime ??
          "",
        closingTime:
          resourceResult.closingTime ??
          "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load booking resource.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [resourceId]);

  async function save(
    event: FormEvent,
  ) {
    event.preventDefault();

    setBusy("save");
    setError("");

    try {
      await updateReservationResource(
        resourceId,
        {
          zoneId:
            form.zoneId ||
            undefined,
          spaceId:
            form.spaceId ||
            undefined,
          name:
            form.name,
          description:
            form.description ||
            undefined,
          resourceType:
            form.resourceType,
          capacity:
            Number(
              form.capacity,
            ),
          requiresApproval:
            form.requiresApproval,
          isActive:
            form.isActive,
          minimumDurationMinutes:
            Number(
              form.minimumDurationMinutes,
            ),
          maximumDurationMinutes:
            form.maximumDurationMinutes
              ? Number(
                  form.maximumDurationMinutes,
                )
              : undefined,
          bookingIntervalMinutes:
            Number(
              form.bookingIntervalMinutes,
            ),
          advanceBookingDays:
            Number(
              form.advanceBookingDays,
            ),
          minimumNoticeMinutes:
            Number(
              form.minimumNoticeMinutes,
            ),
          openingTime:
            form.openingTime ||
            undefined,
          closingTime:
            form.closingTime ||
            undefined,
        },
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update booking resource.",
      );
    } finally {
      setBusy("");
    }
  }

  async function toggleActive() {
    if (!resource) {
      return;
    }

    setBusy("status");
    setError("");

    try {
      await updateReservationResource(
        resourceId,
        {
          isActive:
            !resource.isActive,
        },
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update resource status.",
      );
    } finally {
      setBusy("");
    }
  }

  async function addBlock(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !block.createdByPersonId
    ) {
      setError(
        "Created-by person is required.",
      );
      return;
    }

    setBusy("block");
    setError("");

    try {
      await createReservationResourceBlock(
        resourceId,
        {
          startAt:
            toIso(
              block.startAt,
            ),
          endAt:
            toIso(
              block.endAt,
            ),
          reason:
            block.reason,
          createdByPersonId:
            block.createdByPersonId,
        },
      );

      setBlock({
        startAt: "",
        endAt: "",
        reason: "",
        createdByPersonId: "",
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to block the resource.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading booking resource…
      </div>
    );
  }

  if (
    error &&
    !resource
  ) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!resource) {
    return null;
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Reservation Resources
          </p>
          <h1>
            {resource.name}
          </h1>
          <p>
            {resource.code}
          </p>
        </div>

        <div className="button-row">
          <button
            className="secondary-button"
            disabled={
              busy === "status"
            }
            onClick={toggleActive}
          >
            {resource.isActive
              ? "Deactivate"
              : "Activate"}
          </button>

          <Link
            className="secondary-button"
            href="/reservations/resources"
          >
            Back to Resources
          </Link>
        </div>
      </div>

      <form
        className="form-card"
        onSubmit={save}
      >
        <h2>
          Resource Configuration
        </h2>

        <div className="form-grid">
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Resource Type
            <select
              value={
                form.resourceType
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  resourceType:
                    event.target
                      .value as ReservationResourceType,
                })
              }
            >
              {resourceTypes.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value.replaceAll(
                      "_",
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Zone ID
            <input
              value={form.zoneId}
              onChange={(event) =>
                setForm({
                  ...form,
                  zoneId:
                    event.target.value,
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
                  spaceId:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Capacity
            <input
              min={1}
              required
              type="number"
              value={form.capacity}
              onChange={(event) =>
                setForm({
                  ...form,
                  capacity:
                    Number(
                      event.target.value,
                    ),
                })
              }
            />
          </label>

          <label>
            Approval Mode
            <select
              value={
                form.requiresApproval
                  ? "required"
                  : "automatic"
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  requiresApproval:
                    event.target.value ===
                    "required",
                })
              }
            >
              <option value="automatic">
                Automatic Approval
              </option>
              <option value="required">
                Approval Required
              </option>
            </select>
          </label>

          <label>
            Minimum Duration
            <input
              min={1}
              required
              type="number"
              value={
                form.minimumDurationMinutes
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  minimumDurationMinutes:
                    Number(
                      event.target.value,
                    ),
                })
              }
            />
          </label>

          <label>
            Maximum Duration
            <input
              min={1}
              type="number"
              value={
                form.maximumDurationMinutes
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  maximumDurationMinutes:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Booking Interval
            <input
              min={1}
              required
              type="number"
              value={
                form.bookingIntervalMinutes
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  bookingIntervalMinutes:
                    Number(
                      event.target.value,
                    ),
                })
              }
            />
          </label>

          <label>
            Advance Booking Days
            <input
              min={0}
              required
              type="number"
              value={
                form.advanceBookingDays
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  advanceBookingDays:
                    Number(
                      event.target.value,
                    ),
                })
              }
            />
          </label>

          <label>
            Minimum Notice Minutes
            <input
              min={0}
              required
              type="number"
              value={
                form.minimumNoticeMinutes
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  minimumNoticeMinutes:
                    Number(
                      event.target.value,
                    ),
                })
              }
            />
          </label>

          <label>
            Opening Time
            <input
              type="time"
              value={
                form.openingTime
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  openingTime:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Closing Time
            <input
              type="time"
              value={
                form.closingTime
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  closingTime:
                    event.target.value,
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
                description:
                  event.target.value,
              })
            }
          />
        </label>

        <div className="form-actions">
          <button
            disabled={
              busy === "save"
            }
            type="submit"
          >
            {busy === "save"
              ? "Saving…"
              : "Save Resource"}
          </button>
        </div>
      </form>

      <section className="panel">
        <h2>
          Resource Closure Block
        </h2>

        <form
          className="stack"
          onSubmit={addBlock}
        >
          <div className="form-grid">
            <label>
              Block From
              <input
                required
                type="datetime-local"
                value={
                  block.startAt
                }
                onChange={(event) =>
                  setBlock({
                    ...block,
                    startAt:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Block Until
              <input
                required
                type="datetime-local"
                value={
                  block.endAt
                }
                onChange={(event) =>
                  setBlock({
                    ...block,
                    endAt:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Created By
              <PersonLookup
                required
                value={
                  block.createdByPersonId
                }
                onChange={(
                  createdByPersonId,
                ) =>
                  setBlock({
                    ...block,
                    createdByPersonId,
                  })
                }
              />
            </label>
          </div>

          <label>
            Reason
            <textarea
              required
              rows={3}
              value={
                block.reason
              }
              onChange={(event) =>
                setBlock({
                  ...block,
                  reason:
                    event.target.value,
                })
              }
            />
          </label>

          <button
            disabled={
              busy === "block"
            }
            type="submit"
          >
            {busy === "block"
              ? "Blocking…"
              : "Create Closure Block"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>
          Existing Closure Blocks
        </h2>

        {blocks.length > 0 ? (
          <div className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Until</th>
                    <th>Reason</th>
                    <th>Created By</th>
                  </tr>
                </thead>

                <tbody>
                  {blocks.map(
                    (item) => (
                      <tr key={item.id}>
                        <td>
                          {formatDate(
                            item.startAt,
                          )}
                        </td>
                        <td>
                          {formatDate(
                            item.endAt,
                          )}
                        </td>
                        <td>
                          {item.reason}
                        </td>
                        <td>
                          {
                            item.createdByPersonId
                          }
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p>
            No resource closure blocks found.
          </p>
        )}
      </section>

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
