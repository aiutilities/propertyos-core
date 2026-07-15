"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurement } from "@/hooks/useProcurement";
import { useVendors } from "@/hooks/useVendors";
import type { PurchaseRequest } from "@/types/procurement";
import type { Vendor } from "@/types/vendor";
export function RfqForm() {
  const router = useRouter();
  const procurement = useProcurement(); const vendorsApi = useVendors();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]); const [vendors, setVendors] = useState<Vendor[]>([]); const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [form, setForm] = useState({ purchaseRequestId: "", title: "", description: "", quotationDeadline: "", deliveryRequiredBy: "", currency: "INR", termsAndConditions: "", createdByPersonId: "" });
  useEffect(() => { void Promise.all([procurement.listRequests({ status: "APPROVED" }), vendorsApi.list({ status: "ACTIVE" })]).then(([r, v]) => { setRequests(r); setVendors(v); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(e: FormEvent) { e.preventDefault(); if (!vendorIds.length) return; const created = await procurement.createRfq({ ...form, description: form.description || undefined, deliveryRequiredBy: form.deliveryRequiredBy || undefined, termsAndConditions: form.termsAndConditions || undefined, vendorIds }); router.push(`/procurement/rfqs/${created.id}`); }
  return <form className="stack" onSubmit={submit}><div className="page-header"><div><p className="eyebrow">Procurement</p><h1>Create RFQ</h1></div><button className="button" disabled={procurement.loading}>Create draft</button></div>
    <section className="panel form-grid"><label>Approved purchase request<select required value={form.purchaseRequestId} onChange={(e) => { const id=e.target.value; const pr=requests.find((r)=>r.id===id); setForm((c)=>({...c,purchaseRequestId:id,title:pr?.title || c.title})); }}><option value="">Select request</option>{requests.map((r)=><option key={r.id} value={r.id}>{r.requestNumber} — {r.title}</option>)}</select></label><label>Title<input required value={form.title} onChange={(e)=>setForm((c)=>({...c,title:e.target.value}))}/></label><label>Quotation deadline<input required type="datetime-local" value={form.quotationDeadline} onChange={(e)=>setForm((c)=>({...c,quotationDeadline:e.target.value}))}/></label><label>Delivery required by<input type="date" value={form.deliveryRequiredBy} onChange={(e)=>setForm((c)=>({...c,deliveryRequiredBy:e.target.value}))}/></label><label>Currency<input required value={form.currency} onChange={(e)=>setForm((c)=>({...c,currency:e.target.value}))}/></label><label>Created by person ID<input required value={form.createdByPersonId} onChange={(e)=>setForm((c)=>({...c,createdByPersonId:e.target.value}))}/></label><label className="full-width">Description<textarea value={form.description} onChange={(e)=>setForm((c)=>({...c,description:e.target.value}))}/></label><label className="full-width">Terms and conditions<textarea value={form.termsAndConditions} onChange={(e)=>setForm((c)=>({...c,termsAndConditions:e.target.value}))}/></label></section>
    <section className="panel"><h2>Invite vendors</h2><div className="stack">{vendors.map((v)=><label key={v.id}><input type="checkbox" checked={vendorIds.includes(v.id)} onChange={(e)=>setVendorIds((c)=>e.target.checked?[...c,v.id]:c.filter((id)=>id!==v.id))}/> {v.vendorNumber} — {v.legalName}</label>)}</div>{!vendors.length ? <p className="muted">No active vendors available.</p> : null}</section>
    {procurement.error || vendorsApi.error ? <div className="alert alert-danger">{procurement.error || vendorsApi.error}</div> : null}</form>;
}
