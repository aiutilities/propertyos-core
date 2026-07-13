"use client";

import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import PropertyLookup from "@/components/common/PropertyLookup";
import {
  createReservationResource,
} from "@/hooks/useReservations";
import {
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

export default function ReservationResourceForm() {
  const router = useRouter();

  const [
    form,
    setForm,
  ] = useState({
    propertyId: "",
    zoneId: "",
    spaceId: "",

    code: "",
    name: "",
    description: "",

    resourceType:
      "FACILITY" as ReservationResourceType,

    capacity: 1,

    requiresApproval: false,

    minimumDurationMinutes: 30,
    maximumDurationMinutes: "",
    bookingIntervalMinutes: 30,

    advanceBookingDays: 30,
    minimumNoticeMinutes: 0,

    openingTime: "",
    closingTime: "",
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const resource =
        await createReservationResource({
          propertyId:
            form.propertyId,
          zoneId:
            form.zoneId ||
            undefined,
          spaceId:
            form.spaceId ||
            undefined,

          code:
            form.code,
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
        });

      router.push(
        `/reservations/resources/${resource.id}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create booking resource.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-card"
      onSubmit={submit}
    >
      <div className="form-grid">
        <label>
          Property
          <PropertyLookup
            required
            value={form.propertyId}
            onChange={(propertyId) =>
              setForm({
                ...form,
                propertyId,
              })
            }
          />
        </label>

        <label>
          Resource Code
          <input
            required
            value={form.code}
            onChange={(event) =>
              setForm({
                ...form,
                code:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Resource Name
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
            value={form.resourceType}
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
            value={form.openingTime}
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
            value={form.closingTime}
            onChange={(event) =>
              setForm({
                ...form,
                closingTime:
                  event.target.value,
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
      </div>

      <label>
        Description
        <textarea
          rows={5}
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

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          disabled={saving}
          type="submit"
        >
          {saving
            ? "Creating…"
            : "Create Resource"}
        </button>
      </div>
    </form>
  );
}
