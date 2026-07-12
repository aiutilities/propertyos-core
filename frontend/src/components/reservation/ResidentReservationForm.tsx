"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import PropertyLookup from "@/components/common/PropertyLookup";
import {
  checkAvailability,
  createReservation,
  useReservationResources,
} from "@/hooks/useReservations";
import {
  getSessionUser,
} from "@/lib/session";

function toIso(
  value: string,
) {
  return value
    ? new Date(value).toISOString()
    : "";
}

export default function ResidentReservationForm() {
  const router = useRouter();
  const user = getSessionUser();
  const userId = user?.id ?? "";

  const [
    form,
    setForm,
  ] = useState({
    propertyId: "",
    resourceId: "",
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    attendeeCount: 1,
    notes: "",
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    checking,
    setChecking,
  ] = useState(false);

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const {
    resources,
    loading: resourcesLoading,
  } = useReservationResources({
    propertyId: form.propertyId,
    isActive: true,
  });

  const selectedResource =
    useMemo(
      () =>
        resources.find(
          (resource) =>
            resource.id ===
            form.resourceId,
        ),
      [
        resources,
        form.resourceId,
      ],
    );

  if (!user) {
    return (
      <div className="error-state">
        Resident session is unavailable.
      </div>
    );
  }

  async function verifyAvailability() {
    if (
      !form.resourceId ||
      !form.startAt ||
      !form.endAt
    ) {
      setError(
        "Resource, start time and end time are required.",
      );
      return false;
    }

    setChecking(true);
    setError("");
    setAvailabilityMessage("");

    try {
      const result =
        await checkAvailability({
          resourceId:
            form.resourceId,
          startAt:
            toIso(form.startAt),
          endAt:
            toIso(form.endAt),
          attendeeCount:
            form.attendeeCount,
        });

      if (result.available) {
        setAvailabilityMessage(
          "The selected resource is available.",
        );
        return true;
      }

      const reservationConflicts =
        result.conflictingReservations
          .length;

      const blockConflicts =
        result.conflictingBlocks.length;

      setAvailabilityMessage(
        `Unavailable: ${reservationConflicts} reservation conflict(s) and ${blockConflicts} closure block(s).`,
      );

      return false;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check availability.",
      );

      return false;
    } finally {
      setChecking(false);
    }
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const available =
        await verifyAvailability();

      if (!available) {
        return;
      }

      await createReservation({
        propertyId:
          form.propertyId,
        resourceId:
          form.resourceId,
        requesterPersonId:
          userId,
        beneficiaryPersonId:
          userId,
        title:
          form.title,
        description:
          form.description ||
          undefined,
        startAt:
          toIso(form.startAt),
        endAt:
          toIso(form.endAt),
        attendeeCount:
          Number(
            form.attendeeCount,
          ),
        notes:
          form.notes ||
          undefined,
      });

      router.push(
        "/resident/reservations",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create reservation.",
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
      <section className="panel muted-panel">
        <strong>
          Booking as {user.name}
        </strong>
        <p>{user.email}</p>
      </section>

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
                resourceId: "",
              })
            }
          />
        </label>

        <label>
          Resource
          <select
            required
            disabled={
              !form.propertyId ||
              resourcesLoading
            }
            value={form.resourceId}
            onChange={(event) =>
              setForm({
                ...form,
                resourceId:
                  event.target.value,
              })
            }
          >
            <option value="">
              Select resource
            </option>

            {resources.map(
              (resource) => (
                <option
                  key={resource.id}
                  value={resource.id}
                >
                  {resource.name}
                  {" · "}
                  {resource.capacity}
                  {" people"}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Start Time
          <input
            required
            type="datetime-local"
            value={form.startAt}
            onChange={(event) =>
              setForm({
                ...form,
                startAt:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          End Time
          <input
            required
            type="datetime-local"
            value={form.endAt}
            onChange={(event) =>
              setForm({
                ...form,
                endAt:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Attendee Count
          <input
            min={1}
            max={
              selectedResource
                ?.capacity
            }
            required
            type="number"
            value={
              form.attendeeCount
            }
            onChange={(event) =>
              setForm({
                ...form,
                attendeeCount:
                  Number(
                    event.target.value,
                  ),
              })
            }
          />
        </label>

        <label>
          Booking Title
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title:
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

      <label>
        Notes
        <textarea
          rows={3}
          value={form.notes}
          onChange={(event) =>
            setForm({
              ...form,
              notes:
                event.target.value,
            })
          }
        />
      </label>

      {selectedResource ? (
        <section className="panel muted-panel">
          <strong>
            {selectedResource.name}
          </strong>

          <p>
            Capacity:{" "}
            {selectedResource.capacity}
            {" · "}
            Approval:{" "}
            {selectedResource.requiresApproval
              ? "Required"
              : "Automatic"}
            {" · "}
            Booking window:{" "}
            {selectedResource.advanceBookingDays}
            {" days"}
          </p>

          <p>
            Operating hours:{" "}
            {selectedResource.openingTime ??
              "Not restricted"}
            {" – "}
            {selectedResource.closingTime ??
              "Not restricted"}
          </p>
        </section>
      ) : null}

      {availabilityMessage ? (
        <p>{availabilityMessage}</p>
      ) : null}

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          className="secondary-button"
          disabled={checking}
          type="button"
          onClick={
            verifyAvailability
          }
        >
          {checking
            ? "Checking…"
            : "Check Availability"}
        </button>

        <button
          disabled={
            saving || checking
          }
          type="submit"
        >
          {saving
            ? "Booking…"
            : "Submit Booking"}
        </button>
      </div>
    </form>
  );
}
