"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useQuotationComparison,
} from "@/hooks/useQuotationComparison";

import type {
  ComparisonRfq,
} from "@/types/quotationComparison";

export function QuotationComparisonSelector() {
  const router = useRouter();

  const {
    loading,
    error,
    listComparableRfqs,
  } = useQuotationComparison();

  const [
    rfqs,
    setRfqs,
  ] = useState<ComparisonRfq[]>([]);

  const [
    rfqId,
    setRfqId,
  ] = useState("");

  useEffect(
    () => {
      void listComparableRfqs().then(
        setRfqs,
      );
    },
    [listComparableRfqs],
  );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Quotation Comparison
          </h1>

          <p className="muted">
            Review commercial ranking and
            line-level L1/L2 offers.
          </p>
        </div>
      </div>

      <section className="panel stack">
        <label>
          Request for quotation

          <select
            value={rfqId}
            onChange={(event) =>
              setRfqId(
                event.target.value,
              )
            }
          >
            <option value="">
              Select an RFQ
            </option>

            {rfqs.map(
              (rfq) => (
                <option
                  key={rfq.id}
                  value={rfq.id}
                >
                  {rfq.rfqNumber} —{" "}
                  {rfq.title} —{" "}
                  {rfq.status}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          className="button"
          disabled={
            loading ||
            !rfqId
          }
          onClick={() =>
            router.push(
              `/procurement/rfqs/${rfqId}/comparison`,
            )
          }
        >
          Open comparison
        </button>

        {error ? (
          <div className="alert alert-danger">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  );
}
