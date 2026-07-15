"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurement } from "@/hooks/useProcurement";
import type { CreatePurchaseRequestItemInput, ProcurementCategory, ProcurementItemType, ProcurementPriority } from "@/types/procurement";

const blankItem = (): CreatePurchaseRequestItemInput => ({ itemType: "GOODS", description: "", quantity: 1, unit: "nos" });

export function PurchaseRequestForm() {
  const router = useRouter();
  const { loading, error, createRequest, categories } = useProcurement();
  const [categoryRows, setCategoryRows] = useState<ProcurementCategory[]>([]);
  const [form, setForm] = useState({ propertyId: "", categoryId: "", requestedByPersonId: "", title: "", description: "", businessJustification: "", priority: "MEDIUM" as ProcurementPriority, requiredByDate: "", currency: "INR" });
  const [items, setItems] = useState<CreatePurchaseRequestItemInput[]>([blankItem()]);
  useEffect(() => { void categories().then(setCategoryRows); }, [categories]);
  const setField = (field: keyof typeof form, value: string) => setForm((c) => ({ ...c, [field]: value }));
  const updateItem = (index: number, patch: Partial<CreatePurchaseRequestItemInput>) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await createRequest({
      propertyId: form.propertyId.trim(), categoryId: form.categoryId, requestedByPersonId: form.requestedByPersonId.trim(), title: form.title.trim(),
      description: form.description.trim() || undefined, businessJustification: form.businessJustification.trim() || undefined, priority: form.priority,
      requiredByDate: form.requiredByDate || undefined, currency: form.currency.trim().toUpperCase(), items,
    });
    router.push(`/procurement/requests/${created.id}`);
  }
  return <form className="stack" onSubmit={submit}>
    <section className="panel stack"><h2>Request information</h2><div className="form-grid">
      <label>Property ID<input required value={form.propertyId} onChange={(e) => setField("propertyId", e.target.value)} /></label>
      <label>Requested by person ID<input required value={form.requestedByPersonId} onChange={(e) => setField("requestedByPersonId", e.target.value)} /></label>
      <label>Category<select required value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)}><option value="">Select category</option>{categoryRows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Priority<select value={form.priority} onChange={(e) => setField("priority", e.target.value)}>{["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p}>{p}</option>)}</select></label>
      <label>Required by<input type="date" value={form.requiredByDate} onChange={(e) => setField("requiredByDate", e.target.value)} /></label>
      <label>Currency<input required value={form.currency} onChange={(e) => setField("currency", e.target.value)} /></label>
    </div><label>Title<input required value={form.title} onChange={(e) => setField("title", e.target.value)} /></label>
    <label>Description<textarea value={form.description} onChange={(e) => setField("description", e.target.value)} /></label>
    <label>Business justification<textarea value={form.businessJustification} onChange={(e) => setField("businessJustification", e.target.value)} /></label></section>
    <section className="panel stack"><div className="page-header"><h2>Items</h2><button type="button" className="button button-secondary" onClick={() => setItems((r) => [...r, blankItem()])}>Add item</button></div>
      {items.map((item, index) => <div className="form-grid" key={index}>
        <label>Type<select value={item.itemType} onChange={(e) => updateItem(index, { itemType: e.target.value as ProcurementItemType })}>{["GOODS","SERVICE","ASSET","CONSUMABLE","OTHER"].map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>Description<input required value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} /></label>
        <label>Quantity<input required min="0.01" step="0.01" type="number" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} /></label>
        <label>Unit<input required value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })} /></label>
        <label>Estimated unit price<input min="0" step="0.01" type="number" value={item.estimatedUnitPrice ?? ""} onChange={(e) => updateItem(index, { estimatedUnitPrice: e.target.value ? Number(e.target.value) : undefined })} /></label>
        {items.length > 1 ? <button type="button" className="button button-danger" onClick={() => setItems((r) => r.filter((_, i) => i !== index))}>Remove</button> : null}
      </div>)}</section>
    {error ? <div className="alert alert-danger">{error}</div> : null}<button className="button" disabled={loading} type="submit">{loading ? "Creating…" : "Create purchase request"}</button>
  </form>;
}
