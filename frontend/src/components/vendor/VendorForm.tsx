"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useVendors,
} from "@/hooks/useVendors";

import type {
  CreateVendorInput,
  VendorCategory,
  VendorType,
} from "@/types/vendor";

const VENDOR_TYPES:
  VendorType[] = [
    "COMPANY",
    "INDIVIDUAL",
    "AGENCY",
    "CONTRACTOR",
    "CONSULTANT",
  ];

export function VendorForm() {
  const router =
    useRouter();

  const {
    loading,
    error,
    create,
    categories,
  } = useVendors();

  const [
    categoryRows,
    setCategoryRows,
  ] = useState<
    VendorCategory[]
  >([]);

  const [
    form,
    setForm,
  ] = useState({
    legalName: "",
    displayName: "",
    vendorType:
      "COMPANY" as
      VendorType,
    email: "",
    phone: "",
    website: "",
    taxIdentifier: "",
    panNumber: "",
    registrationNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    notes: "",
    createdByPersonId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    categoryId: "",
  });

  useEffect(() => {
    void categories().then(
      setCategoryRows,
    );
  }, [categories]);

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const payload:
      CreateVendorInput = {
        legalName:
          form.legalName.trim(),

        displayName:
          form.displayName.trim(),

        vendorType:
          form.vendorType,

        email:
          form.email.trim() ||
          undefined,

        phone:
          form.phone.trim() ||
          undefined,

        website:
          form.website.trim() ||
          undefined,

        taxIdentifier:
          form.taxIdentifier
            .trim() ||
          undefined,

        panNumber:
          form.panNumber.trim() ||
          undefined,

        registrationNumber:
          form.registrationNumber
            .trim() ||
          undefined,

        addressLine1:
          form.addressLine1
            .trim() ||
          undefined,

        addressLine2:
          form.addressLine2
            .trim() ||
          undefined,

        city:
          form.city.trim() ||
          undefined,

        state:
          form.state.trim() ||
          undefined,

        country:
          form.country.trim() ||
          undefined,

        postalCode:
          form.postalCode.trim() ||
          undefined,

        notes:
          form.notes.trim() ||
          undefined,

        createdByPersonId:
          form.createdByPersonId
            .trim(),

        contacts:
          form.contactName.trim()
            ? [
                {
                  contactType:
                    "PRIMARY",

                  name:
                    form.contactName
                      .trim(),

                  email:
                    form.contactEmail
                      .trim() ||
                    undefined,

                  phone:
                    form.contactPhone
                      .trim() ||
                    undefined,

                  isPrimary:
                    true,
                },
              ]
            : undefined,

        serviceCategories:
          form.categoryId
            ? [
                {
                  categoryId:
                    form.categoryId,
                },
              ]
            : undefined,
      };

    const vendor =
      await create(payload);

    router.push(
      `/vendors/${vendor.id}`,
    );
  }

  function setField(
    field:
      keyof typeof form,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      }),
    );
  }

  return (
    <form
      className="stack"
      onSubmit={submit}
    >
      <section className="panel stack">
        <h2>
          Vendor information
        </h2>

        <div className="form-grid">
          <label>
            Legal name
            <input
              required
              value={form.legalName}
              onChange={
                (event) =>
                  setField(
                    "legalName",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Display name
            <input
              required
              value={form.displayName}
              onChange={
                (event) =>
                  setField(
                    "displayName",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Vendor type
            <select
              value={form.vendorType}
              onChange={
                (event) =>
                  setField(
                    "vendorType",
                    event.target.value,
                  )
              }
            >
              {VENDOR_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Service category
            <select
              value={form.categoryId}
              onChange={
                (event) =>
                  setField(
                    "categoryId",
                    event.target.value,
                  )
              }
            >
              <option value="">
                Select category
              </option>

              {categoryRows.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={
                (event) =>
                  setField(
                    "email",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={
                (event) =>
                  setField(
                    "phone",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Website
            <input
              value={form.website}
              onChange={
                (event) =>
                  setField(
                    "website",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Tax identifier
            <input
              value={
                form.taxIdentifier
              }
              onChange={
                (event) =>
                  setField(
                    "taxIdentifier",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            PAN number
            <input
              value={form.panNumber}
              onChange={
                (event) =>
                  setField(
                    "panNumber",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Registration number
            <input
              value={
                form.registrationNumber
              }
              onChange={
                (event) =>
                  setField(
                    "registrationNumber",
                    event.target.value,
                  )
              }
            />
          </label>
        </div>
      </section>

      <section className="panel stack">
        <h2>
          Address
        </h2>

        <div className="form-grid">
          <label>
            Address line 1
            <input
              value={
                form.addressLine1
              }
              onChange={
                (event) =>
                  setField(
                    "addressLine1",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Address line 2
            <input
              value={
                form.addressLine2
              }
              onChange={
                (event) =>
                  setField(
                    "addressLine2",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            City
            <input
              value={form.city}
              onChange={
                (event) =>
                  setField(
                    "city",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            State
            <input
              value={form.state}
              onChange={
                (event) =>
                  setField(
                    "state",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Country
            <input
              value={form.country}
              onChange={
                (event) =>
                  setField(
                    "country",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Postal code
            <input
              value={form.postalCode}
              onChange={
                (event) =>
                  setField(
                    "postalCode",
                    event.target.value,
                  )
              }
            />
          </label>
        </div>
      </section>

      <section className="panel stack">
        <h2>
          Primary contact
        </h2>

        <div className="form-grid">
          <label>
            Contact name
            <input
              value={
                form.contactName
              }
              onChange={
                (event) =>
                  setField(
                    "contactName",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Contact email
            <input
              type="email"
              value={
                form.contactEmail
              }
              onChange={
                (event) =>
                  setField(
                    "contactEmail",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Contact phone
            <input
              value={
                form.contactPhone
              }
              onChange={
                (event) =>
                  setField(
                    "contactPhone",
                    event.target.value,
                  )
              }
            />
          </label>

          <label>
            Created by person ID
            <input
              required
              value={
                form.createdByPersonId
              }
              onChange={
                (event) =>
                  setField(
                    "createdByPersonId",
                    event.target.value,
                  )
              }
              placeholder="Person UUID"
            />
          </label>
        </div>

        <label>
          Notes
          <textarea
            value={form.notes}
            onChange={
              (event) =>
                setField(
                  "notes",
                  event.target.value,
                )
            }
          />
        </label>
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <div className="button-row">
        <button
          className="button"
          disabled={loading}
          type="submit"
        >
          {loading
            ? "Creating…"
            : "Create vendor"}
        </button>
      </div>
    </form>
  );
}
