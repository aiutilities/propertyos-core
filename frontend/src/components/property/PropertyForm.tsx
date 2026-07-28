"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import type { Property } from "@/types/property";

type PropertyFormProps = {
  propertyId?: string;
};

type PropertyPayload = {
  name: string;
  code?: string;
  propertyType?: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

type PropertyResponse = {
  success: boolean;
  data: Property;
};

const initialForm: PropertyPayload = {
  name: "",
  code: "",
  propertyType: "PG",
  description: "",
  addressLine1: "",
  addressLine2: "",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  postalCode: "",
};

const propertyTypeOptions = [
  "PG",
  "GATED_COMMUNITY",
  "APARTMENT",
  "HOSTEL",
  "COMMERCIAL",
  "COWORKING",
];

export default function PropertyForm({
  propertyId,
}: PropertyFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(propertyId);

  const [
    form,
    setForm,
  ] = useState<PropertyPayload>(
    initialForm,
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(isEditMode);

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) {
        return;
      }

      try {
        const response =
          await apiRequest<PropertyResponse>(
            `/properties/${propertyId}`,
          );

        const property =
          response.data;

        setForm({
          name:
            property.name ?? "",
          code:
            property.code ?? "",
          propertyType:
            property.propertyType ??
            "",
          description:
            property.description ??
            "",
          addressLine1:
            property.addressLine1 ??
            "",
          addressLine2:
            property.addressLine2 ??
            "",
          city:
            property.city ?? "",
          state:
            property.state ?? "",
          country:
            property.country ?? "",
          postalCode:
            property.postalCode ??
            "",
        });
      } catch (caughtError) {
        console.error(
          "Property load failed",
          caughtError,
        );

        setError(
          "Unable to load this property. "
          + "Please refresh the page and try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProperty();
  }, [propertyId]);

  function updateField(
    field: keyof PropertyPayload,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function onSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError(
        "Property name is required.",
      );

      return;
    }

    setSaving(true);

    try {
      const response =
        await apiRequest<PropertyResponse>(
          propertyId
            ? `/properties/${propertyId}`
            : "/properties",
          {
            method:
              propertyId
                ? "PATCH"
                : "POST",
            body: JSON.stringify(
              cleanPayload(form),
            ),
          },
        );

      router.replace(
        `/properties/${response.data.id}`,
      );
    } catch (caughtError) {
      console.error(
        "Property save failed",
        caughtError,
      );

      setError(
        getPropertySaveError(
          caughtError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading property"
        className="property-form-loading"
      >
        <div className="property-form-skeleton" />
        <div className="property-form-skeleton" />
        <div className="property-form-skeleton property-form-skeleton-large" />
      </div>
    );
  }

  return (
    <form
      className="property-form"
      onSubmit={onSubmit}
    >
      <div className="property-form-guidance">
        <div>
          <strong>
            Property setup
          </strong>

          <p>
            Add the identity, address and
            operating classification for
            this property.
          </p>
        </div>

        <p className="required-guidance">
          <span aria-hidden="true">
            *
          </span>{" "}
          Required field
        </p>
      </div>

      <section
        aria-labelledby="property-basic-information"
        className="property-form-section"
      >
        <div className="property-form-section-heading">
          <p className="eyebrow">
            Step 1
          </p>

          <h2 id="property-basic-information">
            Basic information
          </h2>

          <p>
            Give the property a clear
            operational identity.
          </p>
        </div>

        <div className="property-form-grid">
          <label className="property-field property-field-wide">
            <span>
              Property name
              <span
                aria-hidden="true"
                className="required-marker"
              >
                *
              </span>
            </span>

            <input
              autoComplete="organization"
              autoFocus
              name="name"
              onChange={
                (event) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
              }
              placeholder="Example: Advaith's Nest"
              required
              value={form.name}
            />

            <small>
              Use the name residents,
              staff and reports should
              display.
            </small>
          </label>

          <label className="property-field">
            <span>
              Property type
            </span>

            <input
              list="property-type-options"
              name="propertyType"
              onChange={
                (event) =>
                  updateField(
                    "propertyType",
                    event.target.value,
                  )
              }
              placeholder="Select or enter a type"
              value={
                form.propertyType
              }
            />

            <datalist id="property-type-options">
              {propertyTypeOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  />
                ),
              )}
            </datalist>

            <small>
              Used to adapt workflows and
              reporting.
            </small>
          </label>

          <label className="property-field">
            <span>
              Property code
              <span className="optional-marker">
                Optional
              </span>
            </span>

            <input
              autoCapitalize="characters"
              name="code"
              onChange={
                (event) =>
                  updateField(
                    "code",
                    event.target.value,
                  )
              }
              placeholder="Example: ADN-CHN"
              value={form.code}
            />

            <small>
              A short internal reference
              used in operations.
            </small>
          </label>

          <label className="property-field property-field-wide">
            <span>
              Description
              <span className="optional-marker">
                Optional
              </span>
            </span>

            <textarea
              name="description"
              onChange={
                (event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
              }
              placeholder="Describe the property, its purpose and any important operating context."
              rows={4}
              value={form.description}
            />
          </label>
        </div>
      </section>

      <section
        aria-labelledby="property-address"
        className="property-form-section"
      >
        <div className="property-form-section-heading">
          <p className="eyebrow">
            Step 2
          </p>

          <h2 id="property-address">
            Address
          </h2>

          <p>
            Record the physical location
            used in notices, documents
            and reports.
          </p>
        </div>

        <div className="property-form-grid">
          <label className="property-field property-field-wide">
            <span>
              Address line 1
              <span className="optional-marker">
                Optional
              </span>
            </span>

            <input
              autoComplete="address-line1"
              name="addressLine1"
              onChange={
                (event) =>
                  updateField(
                    "addressLine1",
                    event.target.value,
                  )
              }
              placeholder="Street address"
              value={
                form.addressLine1
              }
            />
          </label>

          <label className="property-field property-field-wide">
            <span>
              Address line 2
              <span className="optional-marker">
                Optional
              </span>
            </span>

            <input
              autoComplete="address-line2"
              name="addressLine2"
              onChange={
                (event) =>
                  updateField(
                    "addressLine2",
                    event.target.value,
                  )
              }
              placeholder="Area, landmark or additional address"
              value={
                form.addressLine2
              }
            />
          </label>

          <label className="property-field">
            <span>
              City
            </span>

            <input
              autoComplete="address-level2"
              name="city"
              onChange={
                (event) =>
                  updateField(
                    "city",
                    event.target.value,
                  )
              }
              value={form.city}
            />
          </label>

          <label className="property-field">
            <span>
              State
            </span>

            <input
              autoComplete="address-level1"
              name="state"
              onChange={
                (event) =>
                  updateField(
                    "state",
                    event.target.value,
                  )
              }
              value={form.state}
            />
          </label>

          <label className="property-field">
            <span>
              Country
            </span>

            <input
              autoComplete="country-name"
              name="country"
              onChange={
                (event) =>
                  updateField(
                    "country",
                    event.target.value,
                  )
              }
              value={form.country}
            />
          </label>

          <label className="property-field">
            <span>
              Postal code
              <span className="optional-marker">
                Optional
              </span>
            </span>

            <input
              autoComplete="postal-code"
              inputMode="numeric"
              name="postalCode"
              onChange={
                (event) =>
                  updateField(
                    "postalCode",
                    event.target.value,
                  )
              }
              placeholder="Example: 600001"
              value={
                form.postalCode
              }
            />
          </label>
        </div>
      </section>

      <section
        aria-labelledby="property-configuration"
        className="property-form-section property-configuration-section"
      >
        <div className="property-form-section-heading">
          <p className="eyebrow">
            Step 3
          </p>

          <h2 id="property-configuration">
            Configuration
          </h2>

          <p>
            Zones, spaces, tenants and
            operational workflows can be
            configured after saving the
            property.
          </p>
        </div>

        <div className="configuration-preview">
          <div>
            <strong>
              Next after saving
            </strong>

            <p>
              Add zones and spaces, then
              begin tenant and lease
              setup from the property
              details page.
            </p>
          </div>

          <span>
            No additional information
            required now
          </span>
        </div>
      </section>

      {error ? (
        <div
          aria-live="polite"
          className="property-form-error"
          role="alert"
        >
          <strong>
            Property could not be saved
          </strong>

          <p>
            {error}
          </p>
        </div>
      ) : null}

      <div className="property-form-actions">
        <Link
          aria-disabled={saving}
          className="property-form-cancel"
          href="/properties"
        >
          Cancel
        </Link>

        <button
          className="property-form-submit"
          disabled={saving}
          type="submit"
        >
          {saving
            ? isEditMode
              ? "Updating property…"
              : "Creating property…"
            : isEditMode
              ? "Update property"
              : "Create property"}
        </button>
      </div>
    </form>
  );
}

function getPropertySaveError(
  caughtError: unknown,
): string {
  const fallback =
    "Unable to save the property. "
    + "Please review the form and try again.";

  if (!(caughtError instanceof Error)) {
    return fallback;
  }

  const message =
    extractApiMessage(
      caughtError.message,
    );

  if (!message) {
    return fallback;
  }

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "name should not be empty",
    )
    || normalized.includes(
      "name must be longer",
    )
  ) {
    return (
      "Property name is required. "
      + "Enter a property name and try again."
    );
  }

  if (
    normalized.includes(
      "name should not exist",
    )
    || normalized.includes(
      "propertytype should not exist",
    )
    || normalized.includes(
      "addressline1 should not exist",
    )
  ) {
    return (
      "The property form could not be accepted "
      + "by the server. Refresh the page and "
      + "try again."
    );
  }

  if (
    normalized.includes(
      "already exists",
    )
    || normalized.includes(
      "duplicate",
    )
  ) {
    return (
      "A property with the same name or code "
      + "already exists."
    );
  }

  if (
    normalized.includes(
      "unauthorized",
    )
    || normalized.includes(
      "forbidden",
    )
  ) {
    return (
      "You do not have permission to save "
      + "this property."
    );
  }

  return fallback;
}

function extractApiMessage(
  rawMessage: string,
): string {
  const trimmed =
    rawMessage.trim();

  if (!trimmed.startsWith("{")) {
    return trimmed;
  }

  try {
    const payload =
      JSON.parse(trimmed) as {
        message?: unknown;
        error?: {
          message?: unknown;
          details?: {
            message?: unknown;
          };
        };
      };

    const candidates = [
      payload.message,
      payload.error?.message,
      payload.error
        ?.details
        ?.message,
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        typeof candidate
          === "string"
      ) {
        return candidate;
      }

      if (
        Array.isArray(candidate)
      ) {
        return candidate
          .filter(
            (value):
              value is string =>
                typeof value
                  === "string",
          )
          .join(" ");
      }
    }
  } catch {
    return "";
  }

  return "";
}

function cleanPayload(
  payload: PropertyPayload,
): PropertyPayload {
  return Object.fromEntries(
    Object.entries(payload)
      .map(
        ([key, value]) => [
          key,
          value?.trim(),
        ],
      )
      .filter(
        ([, value]) =>
          Boolean(value),
      ),
  ) as PropertyPayload;
}
