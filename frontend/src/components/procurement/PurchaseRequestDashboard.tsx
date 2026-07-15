"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useProcurement } from "@/hooks/useProcurement";
import { PurchaseRequestMetrics } from "./PurchaseRequestMetrics";
import { PurchaseRequestTable } from "./PurchaseRequestTable";
import type { ProcurementMetrics, PurchaseRequest, PurchaseRequestFilters } from "@/types/procurement";

const EMPTY: ProcurementMetrics = {
  purchaseRequests: { total: 0, pendingApproval: 0, approved: 0, rejected: 0 },
  rfqs: { open: 0, expiring: 0, awarded: 0 }, purchaseOrders: { total: 0, pendingApproval: 0, open: 0, partiallyReceived: 0 },
  goodsReceipts: { draft: 0, posted: 0 }, invoiceMatches: { pending: 0, matched: 0, mismatched: 0 }, paymentRequests: { pending: 0, approved: 0, overdue: 0 },
};

export function PurchaseRequestDashboard() {
  const { loading, error, listRequests, metrics } = useProcurement();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [metricData, setMetricData] = useState(EMPTY);
  const [filters, setFilters] = useState<PurchaseRequestFilters>({ search: "", status: "" });
  const load = useCallback(async () => {
    const [rows, values] = await Promise.all([listRequests(filters), metrics()]);
    setRequests(rows); setMetricData(values);
  }, [filters, listRequests, metrics]);
  useEffect(() => { void load(); }, [load]);

  return <div className="stack">
    <div className="page-header"><div><p className="eyebrow">Procurement</p><h1>Purchase Requests</h1><p className="muted">Raise, review, approve, and track purchasing needs.</p></div>
      <Link className="button" href="/procurement/requests/new">New request</Link></div>
    <PurchaseRequestMetrics metrics={metricData} />
    <section className="panel"><div className="form-grid"><label>Search<input value={filters.search || ""} onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))} placeholder="Number or title" /></label>
      <label>Status<select value={filters.status || ""} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value as PurchaseRequestFilters["status"] }))}>
        <option value="">All statuses</option>{["DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","REJECTED","CANCELLED","CONVERTED_TO_RFQ","CONVERTED_TO_PO","CLOSED"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label></div></section>
    {error ? <div className="alert alert-danger">{error}</div> : null}
    {loading ? <div className="panel">Loading purchase requests…</div> : <PurchaseRequestTable requests={requests} />}
  </div>;
}
