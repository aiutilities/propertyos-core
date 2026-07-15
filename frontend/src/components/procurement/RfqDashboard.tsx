"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useProcurement } from "@/hooks/useProcurement";
import { RfqStatusBadge } from "./RfqStatusBadge";
import type { ProcurementRfq, ProcurementRfqFilters } from "@/types/procurement";
const STATUSES = ["DRAFT","ISSUED","OPEN","CLOSED","AWARDED","CANCELLED","EXPIRED"] as const;
export function RfqDashboard() {
  const { loading, error, listRfqs } = useProcurement();
  const [rows, setRows] = useState<ProcurementRfq[]>([]);
  const [filters, setFilters] = useState<ProcurementRfqFilters>({ search: "", status: "" });
  const load = useCallback(async () => setRows(await listRfqs(filters)), [filters, listRfqs]);
  useEffect(() => { void load(); }, [load]);
  return <div className="stack"><div className="page-header"><div><p className="eyebrow">Procurement</p><h1>Requests for Quotation</h1><p className="muted">Invite vendors, issue RFQs, and monitor responses.</p></div><Link className="button" href="/procurement/rfqs/new">New RFQ</Link></div>
    <section className="panel"><div className="form-grid"><label>Search<input value={filters.search || ""} onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))} placeholder="RFQ number or title" /></label><label>Status<select value={filters.status || ""} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value as ProcurementRfqFilters["status"] }))}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label></div></section>
    {error ? <div className="alert alert-danger">{error}</div> : null}
    <section className="panel table-scroll">{loading ? <p>Loading RFQs…</p> : <table><thead><tr><th>RFQ</th><th>Title</th><th>Status</th><th>Deadline</th><th>Currency</th></tr></thead><tbody>{rows.map((rfq) => <tr key={rfq.id}><td><Link href={`/procurement/rfqs/${rfq.id}`}>{rfq.rfqNumber}</Link></td><td>{rfq.title}</td><td><RfqStatusBadge status={rfq.status} /></td><td>{new Date(rfq.quotationDeadline).toLocaleDateString()}</td><td>{rfq.currency}</td></tr>)}{!rows.length ? <tr><td colSpan={5} className="muted">No RFQs found.</td></tr> : null}</tbody></table>}</section>
  </div>;
}
