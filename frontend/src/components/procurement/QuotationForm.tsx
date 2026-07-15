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
  useQuotations,
} from "@/hooks/useQuotations";

import type {
  CreateQuotationItemInput,
  QuotationRfq,
  QuotationRfqDetails,
} from "@/types/quotation";

export function QuotationForm() {
  const router = useRouter();

  const {
    loading,
    error,
    listRfqs,
    getRfq,
    createQuotation,
  } = useQuotations();

  const [
    rfqs,
    setRfqs,
  ] = useState<QuotationRfq[]>([]);

  const [
    selectedRfq,
    setSelectedRfq,
  ] =
    useState<QuotationRfqDetails | null>(
      null,
    );

  const [
    form,
    setForm,
  ] = useState({
    rfqId: "",
    vendorId: "",
    vendorReference: "",
    quotationDate: "",
    validUntil: "",
    deliveryDays: "",
    discountAmount: "0",
    freightAmount: "0",
    currency: "INR",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    submittedByPersonId: "",
  });

  const [
    items,
    setItems,
  ] = useState<
    CreateQuotationItemInput[]
  >([]);

  useEffect(
    () => {
      void Promise.all([
        listRfqs("ISSUED"),
        listRfqs("OPEN"),
      ]).then(
        ([
          issued,
          open,
        ]) => {
          const unique = new Map<
            string,
            QuotationRfq
          >();

          [
            ...issued,
            ...open,
          ].forEach(
            (rfq) =>
              unique.set(
                rfq.id,
                rfq,
              ),
          );

          setRfqs(
            Array.from(
              unique.values(),
            ),
          );
        },
      );
    },
    [listRfqs],
  );

  function setField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function chooseRfq(
    rfqId: string,
  ) {
    setField(
      "rfqId",
      rfqId,
    );

    setField(
      "vendorId",
      "",
    );

    if (!rfqId) {
      setSelectedRfq(null);
      setItems([]);
      return;
    }

    const details =
      await getRfq(rfqId);

    setSelectedRfq(details);

    setField(
      "currency",
      details.currency,
    );

    setItems(
      details.items.map(
        (item) => ({
          rfqItemId: item.id,
          description:
            item.description,
          quantity:
            Number(
              item.quantity,
            ),
          unit: item.unit,
          unitPrice: 0,
          discountAmount: 0,
          taxRate: 0,
        }),
      ),
    );
  }

  function updateItem(
    index: number,
    patch: Partial<
      CreateQuotationItemInput
    >,
  ) {
    setItems(
      (rows) =>
        rows.map(
          (
            row,
            rowIndex,
          ) =>
            rowIndex === index
              ? {
                  ...row,
                  ...patch,
                }
              : row,
        ),
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const quotation =
      await createQuotation({
        rfqId: form.rfqId,
        vendorId:
          form.vendorId,
        vendorReference:
          form.vendorReference.trim() ||
          undefined,
        quotationDate:
          form.quotationDate ||
          undefined,
        validUntil:
          form.validUntil,
        deliveryDays:
          form.deliveryDays
            ? Number(
                form.deliveryDays,
              )
            : undefined,
        discountAmount:
          Number(
            form.discountAmount ||
              0,
          ),
        freightAmount:
          Number(
            form.freightAmount ||
              0,
          ),
        currency:
          form.currency
            .trim()
            .toUpperCase(),
        paymentTerms:
          form.paymentTerms.trim() ||
          undefined,
        deliveryTerms:
          form.deliveryTerms.trim() ||
          undefined,
        notes:
          form.notes.trim() ||
          undefined,
        submittedByPersonId:
          form.submittedByPersonId.trim(),
        items,
      });

    router.push(
      `/procurement/quotations/${quotation.id}`,
    );
  }

  return (
    <form
      className="stack"
      onSubmit={submit}
    >
      <section className="panel stack">
        <h2>
          Quotation information
        </h2>

        <div className="form-grid">
          <label>
            RFQ

            <select
              required
              value={form.rfqId}
              onChange={(event) =>
                void chooseRfq(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select issued RFQ
              </option>

              {rfqs.map(
                (rfq) => (
                  <option
                    key={rfq.id}
                    value={rfq.id}
                  >
                    {rfq.rfqNumber} —{" "}
                    {rfq.title}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Vendor

            <select
              required
              disabled={!selectedRfq}
              value={
                form.vendorId
              }
              onChange={(event) =>
                setField(
                  "vendorId",
                  event.target.value,
                )
              }
            >
              <option value="">
                Select invited vendor
              </option>

              {selectedRfq?.vendors.map(
                (vendor) => (
                  <option
                    key={vendor.id}
                    value={
                      vendor.vendorId
                    }
                  >
                    {vendor.vendorId} —{" "}
                    {vendor.status}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Submitted by person ID

            <input
              required
              value={
                form.submittedByPersonId
              }
              onChange={(event) =>
                setField(
                  "submittedByPersonId",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Vendor reference

            <input
              value={
                form.vendorReference
              }
              onChange={(event) =>
                setField(
                  "vendorReference",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Quotation date

            <input
              type="date"
              value={
                form.quotationDate
              }
              onChange={(event) =>
                setField(
                  "quotationDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Valid until

            <input
              required
              type="date"
              value={
                form.validUntil
              }
              onChange={(event) =>
                setField(
                  "validUntil",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Delivery days

            <input
              min="0"
              type="number"
              value={
                form.deliveryDays
              }
              onChange={(event) =>
                setField(
                  "deliveryDays",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Currency

            <input
              required
              value={
                form.currency
              }
              onChange={(event) =>
                setField(
                  "currency",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Overall discount

            <input
              min="0"
              step="0.01"
              type="number"
              value={
                form.discountAmount
              }
              onChange={(event) =>
                setField(
                  "discountAmount",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Freight

            <input
              min="0"
              step="0.01"
              type="number"
              value={
                form.freightAmount
              }
              onChange={(event) =>
                setField(
                  "freightAmount",
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <label>
          Payment terms

          <textarea
            value={
              form.paymentTerms
            }
            onChange={(event) =>
              setField(
                "paymentTerms",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Delivery terms

          <textarea
            value={
              form.deliveryTerms
            }
            onChange={(event) =>
              setField(
                "deliveryTerms",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Notes

          <textarea
            value={form.notes}
            onChange={(event) =>
              setField(
                "notes",
                event.target.value,
              )
            }
          />
        </label>
      </section>

      <section className="panel table-scroll">
        <h2>
          Quotation items
        </h2>

        {!items.length ? (
          <p className="muted">
            Select an RFQ to load
            its items.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Description
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Unit price
                </th>

                <th>
                  Line discount
                </th>

                <th>
                  Tax %
                </th>

                <th>
                  Delivery days
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map(
                (
                  item,
                  index,
                ) => (
                  <tr
                    key={
                      item.rfqItemId
                    }
                  >
                    <td>
                      {item.description}
                    </td>

                    <td>
                      {item.quantity}{" "}
                      {item.unit}
                    </td>

                    <td>
                      <input
                        required
                        min="0"
                        step="0.01"
                        type="number"
                        value={
                          item.unitPrice
                        }
                        onChange={(
                          event,
                        ) =>
                          updateItem(
                            index,
                            {
                              unitPrice:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            },
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        value={
                          item.discountAmount
                        }
                        onChange={(
                          event,
                        ) =>
                          updateItem(
                            index,
                            {
                              discountAmount:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            },
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        value={
                          item.taxRate
                        }
                        onChange={(
                          event,
                        ) =>
                          updateItem(
                            index,
                            {
                              taxRate:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            },
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        min="0"
                        type="number"
                        value={
                          item.deliveryDays ??
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          updateItem(
                            index,
                            {
                              deliveryDays:
                                event
                                  .target
                                  .value
                                  ? Number(
                                      event
                                        .target
                                        .value,
                                    )
                                  : undefined,
                            },
                          )
                        }
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <button
        className="button"
        disabled={
          loading ||
          !items.length
        }
        type="submit"
      >
        {loading
          ? "Creating…"
          : "Create quotation"}
      </button>
    </form>
  );
}
