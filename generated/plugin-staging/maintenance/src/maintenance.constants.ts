export const MAINTENANCE_REGISTRY_ID = 'propertyos.core.maintenance';

export const MAINTENANCE_PERMISSIONS = {
  READ: 'maintenance.read',
  CREATE: 'maintenance.create',
  MANAGE: 'maintenance.manage',
} as const;

export const MAINTENANCE_EVENTS = {
  CREATED: 'maintenance.ticket.created',
  ASSIGNED: 'maintenance.ticket.assigned',
  IN_PROGRESS: 'maintenance.ticket.in_progress',
  RESOLVED: 'maintenance.ticket.resolved',
  CLOSED: 'maintenance.ticket.closed',
  CANCELLED: 'maintenance.ticket.cancelled',
  REJECTED: 'maintenance.ticket.rejected',
  SLA_WARNING: 'maintenance.ticket.sla_warning',
  SLA_OVERDUE: 'maintenance.ticket.sla_overdue',
} as const;

export const MAINTENANCE_WORKFLOW_CODE = 'maintenance.ticket.lifecycle';


export const MAINTENANCE_SLA_WARNING_JOB_TYPE =
  'maintenance.sla.warning';

export const MAINTENANCE_SLA_OVERDUE_JOB_TYPE =
  'maintenance.sla.overdue';
