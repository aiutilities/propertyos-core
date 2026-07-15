import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { PurchaseRequestForm } from "@/components/procurement/PurchaseRequestForm";
export default function NewPurchaseRequestPage() { return <ProtectedRoute><AdminShell><div className="stack"><div><p className="eyebrow">Procurement</p><h1>New Purchase Request</h1><p className="muted">Describe the requirement and its estimated items.</p></div><PurchaseRequestForm /></div></AdminShell></ProtectedRoute>; }
