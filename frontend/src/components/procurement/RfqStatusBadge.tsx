import type { RfqStatus } from "@/types/procurement";
export function RfqStatusBadge({ status }: { status: RfqStatus }) { return <span className={`status status-${status.toLowerCase().replaceAll("_", "-")}`}>{status.replaceAll("_", " ")}</span>; }
