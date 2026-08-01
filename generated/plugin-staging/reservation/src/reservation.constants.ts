export const RESERVATION_REGISTRY_ID =
  'propertyos.core.reservation';

export const RESERVATION_SEARCH_PROVIDER =
  'reservation';

export const RESERVATION_MODULE =
  'reservation';

export const RESERVATION_PERMISSIONS = {
  READ: 'reservation.read',
  CREATE: 'reservation.create',
  UPDATE: 'reservation.update',
  CANCEL: 'reservation.cancel',
  APPROVE: 'reservation.approve',
  MANAGE: 'reservation.manage',
} as const;

export const RESERVATION_EVENTS = {
  RESOURCE_CREATED: 'reservation.resource.created',
  RESOURCE_UPDATED: 'reservation.resource.updated',
  RESOURCE_ACTIVATED: 'reservation.resource.activated',
  RESOURCE_DEACTIVATED: 'reservation.resource.deactivated',
  RESOURCE_BLOCKED: 'reservation.resource.blocked',

  CREATED: 'reservation.created',
  UPDATED: 'reservation.updated',
  REMINDER: 'reservation.reminder',
  SUBMITTED: 'reservation.submitted',
  APPROVED: 'reservation.approved',
  REJECTED: 'reservation.rejected',
  CANCELLED: 'reservation.cancelled',
  CHECKED_IN: 'reservation.checked_in',
  COMPLETED: 'reservation.completed',
  NO_SHOW: 'reservation.no_show',
} as const;

export const RESERVATION_WORKFLOW_CODE =
  'reservation.lifecycle';

export const RESERVATION_REMINDER_JOB_TYPE =
  'reservation.reminder';

export const RESERVATION_END_JOB_TYPE =
  'reservation.end';
