import Link from "next/link";
import { PurchaseRequestStatusBadge } from "./PurchaseRequestStatusBadge";
import type { PurchaseRequest } from "@/types/procurement";

export function PurchaseRequestTable({ requests }: { requests: PurchaseRequest[] }) {
  if (!requests.length) return <div className="panel"><p className="muted">No purchase requests found.</p></div>;
  return <div className="panel table-scroll"><table><thead><tr>
    <th>Request</th><th>Priority</th><th>Required by</th><th>Estimate</th><th>Status</th><th />
  </tr></thead><tbody>{requests.map((request) => <tr key={request.id}>
    <td><strong>{request.title}</strong><div className="muted">{request.requestNumber}</div></td>
    <td>{request.priority}</td>
    <td>{request.requiredByDate ? new Date(request.requiredByDate).toLocaleDateString() : "—"}</td>
    <td>{request.estimatedAmount !== undefined ? `${request.currency} ${request.estimatedAmount.toLocaleString()}` : "—"}</td>
    <td><PurchaseRequestStatusBadge status={request.status} /></td>
    <td><Link className="button button-secondary" href={`/procurement/requests/${request.id}`}>View</Link></td>
  </tr>)}</tbody></table></div>;
}
