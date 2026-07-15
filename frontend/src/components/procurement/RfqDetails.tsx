"use client";
import { useCallback, useEffect, useState } from "react";
import { useProcurement } from "@/hooks/useProcurement";
import { RfqStatusBadge } from "./RfqStatusBadge";
import type { ProcurementRfqDetails as Details } from "@/types/procurement";
export function RfqDetails({ id }: { id: string }) {
  const { loading, error, getRfq, transitionRfq } = useProcurement(); const [rfq,setRfq]=useState<Details|null>(null); const [actor,setActor]=useState(""); const [remarks,setRemarks]=useState("");
  const load=useCallback(async()=>setRfq(await getRfq(id)),[getRfq,id]); useEffect(()=>{void load();},[load]);
  async function act(action:"issue"|"close"|"cancel"|"expire"){if(!actor.trim())return;setRfq(await transitionRfq(id,action,actor.trim(),remarks.trim()));setRemarks("");}
  if(!rfq)return <div className="panel">{loading?"Loading RFQ…":error||"RFQ not found."}</div>;
  return <div className="stack"><div className="page-header"><div><p className="eyebrow">{rfq.rfqNumber}</p><h1>{rfq.title}</h1><RfqStatusBadge status={rfq.status}/></div></div>
    <section className="panel"><div className="details-grid"><div><span className="muted">Deadline</span><strong>{new Date(rfq.quotationDeadline).toLocaleString()}</strong></div><div><span className="muted">Delivery required</span><strong>{rfq.deliveryRequiredBy?new Date(rfq.deliveryRequiredBy).toLocaleDateString():"—"}</strong></div><div><span className="muted">Vendors</span><strong>{rfq.vendors.length}</strong></div><div><span className="muted">Currency</span><strong>{rfq.currency}</strong></div></div></section>
    <section className="panel table-scroll"><h2>Items</h2><table><thead><tr><th>#</th><th>Description</th><th>Type</th><th>Quantity</th></tr></thead><tbody>{rfq.items.map((i)=><tr key={i.id}><td>{i.lineNumber}</td><td>{i.description}</td><td>{i.itemType}</td><td>{i.quantity} {i.unit}</td></tr>)}</tbody></table></section>
    <section className="panel table-scroll"><h2>Invited vendors</h2><table><thead><tr><th>Vendor ID</th><th>Status</th><th>Invited</th><th>Responded</th></tr></thead><tbody>{rfq.vendors.map((v)=><tr key={v.id}><td>{v.vendorId}</td><td>{v.status}</td><td>{new Date(v.invitedAt).toLocaleString()}</td><td>{v.respondedAt?new Date(v.respondedAt).toLocaleString():"—"}</td></tr>)}</tbody></table></section>
    <section className="panel stack"><h2>Workflow action</h2><div className="form-grid"><label>Changed by person ID<input value={actor} onChange={(e)=>setActor(e.target.value)}/></label><label>Remarks<input value={remarks} onChange={(e)=>setRemarks(e.target.value)}/></label></div><div className="button-row">{rfq.status==="DRAFT"?<button className="button" onClick={()=>void act("issue")}>Issue RFQ</button>:null}{["ISSUED","OPEN"].includes(rfq.status)?<button className="button" onClick={()=>void act("close")}>Close</button>:null}{!["CLOSED","AWARDED","CANCELLED","EXPIRED"].includes(rfq.status)?<button className="button button-secondary" onClick={()=>void act("cancel")}>Cancel</button>:null}</div>{error?<div className="alert alert-danger">{error}</div>:null}</section>
    <section className="panel"><h2>History</h2>{rfq.history.length?<ul>{rfq.history.map((h)=><li key={h.id}>{h.toStatus.replaceAll("_"," ")} — {new Date(h.createdAt).toLocaleString()}{h.remarks?` — ${h.remarks}`:""}</li>)}</ul>:<p className="muted">No history available.</p>}</section>
  </div>;
}
