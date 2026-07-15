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
  usePurchaseOrders,
} from "@/hooks/usePurchaseOrders";

import type {
  SelectedQuotation,
} from "@/types/purchaseOrder";

export function PurchaseOrderForm() {
  const router =
    useRouter();

  const {
    loading,
    error,
    listSelectedQuotations,
    createPurchaseOrder,
  } = usePurchaseOrders();

  const [
    quotations,
    setQuotations,
  ] = useState<
    SelectedQuotation[]
  >([]);

  const [
    form,
    setForm,
  ] = useState({
    quotationId: "",
    title: "",
    description: "",
    orderDate: "",
    expectedDeliveryDate: "",
    shippingAddress: "",
    billingAddress: "",
    paymentTerms: "",
    deliveryTerms: "",
    vendorContractId: "",
    createdByPersonId: "",
  });

  useEffect(
    () => {
      void listSelectedQuotations()
        .then(
          setQuotations,
        );
    },
    [
      listSelectedQuotations,
    ],
  );

  function setField(
    field:
      keyof typeof form,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function chooseQuotation(
    quotationId: string,
  ) {
    setField(
      "quotationId",
      quotationId,
    );

    const quotation =
      quotations.find(
        (row) =>
          row.id ===
          quotationId,
      );

    if (!quotation) {
      return;
    }

    setForm(
      (current) => ({
        ...current,
        quotationId,
        paymentTerms:
          quotation.paymentTerms ||
          current.paymentTerms,
        deliveryTerms:
          quotation.deliveryTerms ||
          current.deliveryTerms,
        description:
          quotation.notes ||
          current.description,
      }),
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const created =
      await createPurchaseOrder({
        quotationId:
          form.quotationId,
        title:
          form.title.trim(),
        description:
          form.description.trim() ||
          undefined,
        orderDate:
          form.orderDate ||
          undefined,
        expectedDeliveryDate:
          form.expectedDeliveryDate ||
          undefined,
        shippingAddress:
          form.shippingAddress.trim() ||
          undefined,
        billingAddress:
          form.billingAddress.trim() ||
          undefined,
        paymentTerms:
          form.paymentTerms.trim() ||
          undefined,
        deliveryTerms:
          form.deliveryTerms.trim() ||
          undefined,
        vendorContractId:
          form.vendorContractId.trim() ||
          undefined,
        createdByPersonId:
          form.createdByPersonId.trim(),
      });

    router.push(
      `/procurement/purchase-orders/${created.id}`,
    );
  }

  const selected =
    quotations.find(
      (quotation) =>
        quotation.id ===
        form.quotationId,
    );

  return (
    <form
      className="stack"
      onSubmit={submit}
    >
      <section className="panel stack">
        <h2>
          Purchase Order information
        </h2>

        <div className="form-grid">
          <label>
            Selected quotation

            <select
              required
              value={
                form.quotationId
              }
              onChange={(event) =>
                chooseQuotation(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select awarded quotation
              </option>

              {quotations.map(
                (quotation) => (
                  <option
                    key={
                      quotation.id
                    }
                    value={
                      quotation.id
                    }
                  >
                    {
                      quotation.quotationNumber
                    }{" "}
                    —{" "}
                    {
                      quotation.vendorId
                    }{" "}
                    —{" "}
                    {
                      quotation.currency
                    }{" "}
                    {Number(
                      quotation.totalAmount,
                    ).toLocaleString()}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Created by person ID

            <input
              required
              value={
                form.createdByPersonId
              }
              onChange={(event) =>
                setField(
                  "createdByPersonId",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Title

            <input
              required
              value={form.title}
              onChange={(event) =>
                setField(
                  "title",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Order date

            <input
              type="date"
              value={
                form.orderDate
              }
              onChange={(event) =>
                setField(
                  "orderDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Expected delivery date

            <input
              type="date"
              min={
                form.orderDate ||
                undefined
              }
              value={
                form.expectedDeliveryDate
              }
              onChange={(event) =>
                setField(
                  "expectedDeliveryDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Vendor contract ID

            <input
              value={
                form.vendorContractId
              }
              onChange={(event) =>
                setField(
                  "vendorContractId",
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        {selected ? (
          <div className="details-grid">
            <div>
              <span className="muted">
                Vendor
              </span>

              <strong>
                {selected.vendorId}
              </strong>
            </div>

            <div>
              <span className="muted">
                RFQ
              </span>

              <strong>
                {selected.rfqId}
              </strong>
            </div>

            <div>
              <span className="muted">
                Quotation total
              </span>

              <strong>
                {selected.currency}{" "}
                {Number(
                  selected.totalAmount,
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="muted">
                Delivery
              </span>

              <strong>
                {selected.deliveryDays !==
                undefined
                  ? `${selected.deliveryDays} days`
                  : "—"}
              </strong>
            </div>
          </div>
        ) : null}

        <label>
          Description

          <textarea
            value={
              form.description
            }
            onChange={(event) =>
              setField(
                "description",
                event.target.value,
              )
            }
          />
        </label>

        <div className="form-grid">
          <label>
            Shipping address

            <textarea
              value={
                form.shippingAddress
              }
              onChange={(event) =>
                setField(
                  "shippingAddress",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Billing address

            <textarea
              value={
                form.billingAddress
              }
              onChange={(event) =>
                setField(
                  "billingAddress",
                  event.target.value,
                )
              }
            />
          </label>

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
        </div>
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <button
        className="button"
        disabled={loading}
        type="submit"
      >
        {loading
          ? "Creating…"
          : "Create Purchase Order"}
      </button>
    </form>
  );
}
