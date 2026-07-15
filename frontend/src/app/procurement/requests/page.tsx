import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { PurchaseRequestDashboard } from "@/components/procurement/PurchaseRequestDashboard";
export default function PurchaseRequestsPage() { return <ProtectedRoute><AdminShell><PurchaseRequestDashboard /></AdminShell></ProtectedRoute>; }
