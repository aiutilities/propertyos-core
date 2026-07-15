"use client";
import { useCallback, useEffect, useState } from "react";
import { useProcurement } from "@/hooks/useProcurement";
import { PurchaseRequestStatusBadge } from "./PurchaseRequestStatusBadge";
import type { PurchaseRequestDetails as Details } from "@/types/procurement";

export function PurchaseRequestDetails({ id }: { id: string }) {
  const { loading, error, getRequest, transitionRequest, rejectRequest } = useProcurement();
  const [request, setRequest] = useState<Details | null>(null);
  const [actor, setActor] = useState("");
  const [remarks, setRemarks] = useState("");
  const load = useCallback(async () => setRequest(await getRequest(id)), [getRequest, id]);
  useEffect(() => { void load(); }, [load]);
  async function act(action: "submit" | "approve" | "cancel" | "close" | "reject") {
    if (!actor.trim()) return;
    const updated = action === "reject" ? await rejectRequest(id, actor.trim(), remarks.trim()) : await transitionRequest(id, action, actor.trim(), remarks.trim());
    setRequest(updated); setRemarks("");
  }
  if (!request) return <div className="panel">{loading ? "Loading purchase request…" : error || "Purchase request not found."}</div>;
  return <div className="stack"><div className="page-header"><div><p className="eyebrow">{request.requestNumber}</p><h1>{request.title}</h1><PurchaseRequestStatusBadge status={request.status} /></div></div>
    <section className="panel"><div className="details-grid"><div><span className="muted">Priority</span><strong>{request.priority}</strong></div><div><span className="muted">Category</span><strong>{request.category?.name || request.categoryId}</strong></div><div><span className="muted">Estimate</span><strong>{request.currency} {(request.estimatedAmount ?? 0).toLocaleString()}</strong></div><div><span className="muted">Required by</span><strong>{request.requiredByDate ? new Date(request.requiredByDate).toLocaleDateString() : "—"}</strong></div></div></section>
    <section className="panel table-scroll"><h2>Items</h2><table><thead><tr><th>#</th><th>Description</th><th>Type</th><th>Quantity</th><th>Estimate</th></tr></thead><tbody>{request.items.map((item) => <tr key={item.id}><td>{item.lineNumber}</td><td>{item.description}</td><td>{item.itemType}</td><td>{item.quantity} {item.unit}</td><td>{item.estimatedAmount !== undefined ? `${request.currency} ${item.estimatedAmount.toLocaleString()}` : "—"}</td></tr>)}</tbody></table></section>
    <section className="panel stack"><h2>Workflow action</h2><div className="form-grid"><label>Changed by person ID<input value={actor} onChange={(e) => setActor(e.target.value)} /></label><label>Remarks<input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label></div><div className="button-row">
      {request.status === "DRAFT" ? <button className="button" onClick={() => void act("submit")}>Submit</button> : null}
      {["SUBMITTED","UNDER_REVIEW"].includes(request.status) ? <><button className="button" onClick={() => void act("approve")}>Approve</button><button className="button button-danger" onClick={() => void act("reject")}>Reject</button></> : null}
      {!['CANCELLED','CLOSED','REJECTED'].includes(request.status) ? <button className="button button-secondary" onClick={() => void act("cancel")}>Cancel</button> : null}
      {["APPROVED","CONVERTED_TO_RFQ","CONVERTED_TO_PO"].includes(request.status) ? <button className="button button-secondary" onClick={() => void act("close")}>Close</button> : null}
    </div>{error ? <div className="alert alert-danger">{error}</div> : null}</section>
    <section className="panel"><h2>History</h2>{request.history.length ? <ul>{request.history.map((entry) => <li key={entry.id}>{entry.toStatus.replaceAll("_", " ")} — {new Date(entry.createdAt).toLocaleString()}{entry.remarks ? ` — ${entry.remarks}` : ""}</li>)}</ul> : <p className="muted">No history available.</p>}</section>
  </div>;
}
