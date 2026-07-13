"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import PersonLookup from "@/components/common/PersonLookup";
import PropertyLookup from "@/components/common/PropertyLookup";
import {
  checkAvailability,
  createReservation,
  useReservationResources,
} from "@/hooks/useReservations";

function toIso(
  value: string,
) {
  return value
    ? new Date(value).toISOString()
    : "";
}

export default function ReservationForm({
  residentMode = false,
}: {
  residentMode?: boolean;
}) {
  const router = useRouter();

  const [
    form,
    setForm,
  ] = useState({
    propertyId: "",
    resourceId: "",
    requesterPersonId: "",
    beneficiaryPersonId: "",
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
          startAt: toIso(
            form.startAt,
          ),
          endAt: toIso(
            form.endAt,
          ),
          attendeeCount:
            form.attendeeCount,
        });

      setAvailabilityMessage(
        result.available
          ? "The selected time is available."
          : "The selected time is not available.",
      );

      return result.available;
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

      const reservation =
        await createReservation({
          resourceId:
            form.resourceId,
          propertyId:
            form.propertyId,
          requesterPersonId:
            form.requesterPersonId,
          beneficiaryPersonId:
            form.beneficiaryPersonId ||
            undefined,
          title: form.title,
          description:
            form.description ||
            undefined,
          startAt: toIso(
            form.startAt,
          ),
          endAt: toIso(
            form.endAt,
          ),
          attendeeCount:
            Number(
              form.attendeeCount,
            ),
          notes:
            form.notes ||
            undefined,
        });

      router.push(
        residentMode
          ? "/resident/reservations"
          : `/reservations/${reservation.id}`,
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
          Booking Resource
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
                  {resource.name} ·{" "}
                  {resource.capacity} people
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Requester
          <PersonLookup
            required
            value={
              form.requesterPersonId
            }
            onChange={(
              requesterPersonId,
            ) =>
              setForm({
                ...form,
                requesterPersonId,
              })
            }
          />
        </label>

        <label>
          Beneficiary
          <PersonLookup
            value={
              form.beneficiaryPersonId
            }
            onChange={(
              beneficiaryPersonId,
            ) =>
              setForm({
                ...form,
                beneficiaryPersonId,
              })
            }
          />
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
            max={
              selectedResource
                ?.capacity
            }
            min={1}
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
          Title
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
            Hours:{" "}
            {selectedResource.openingTime ??
              "—"}
            {"–"}
            {selectedResource.closingTime ??
              "—"}
          </p>
        </section>
      ) : null}

      {availabilityMessage ? (
        <p>
          {availabilityMessage}
        </p>
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
            : "Create Reservation"}
        </button>
      </div>
    </form>
  );
}
