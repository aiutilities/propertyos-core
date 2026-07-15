import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { PurchaseRequestDetails } from "@/components/procurement/PurchaseRequestDetails";
export default async function PurchaseRequestPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ProtectedRoute><AdminShell><PurchaseRequestDetails id={id} /></AdminShell></ProtectedRoute>; }
