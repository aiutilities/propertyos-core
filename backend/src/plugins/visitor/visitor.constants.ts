export const VISITOR_EVENTS = {
  INVITED: 'visitor.invited',
  APPROVED: 'visitor.approved',
  REJECTED: 'visitor.rejected',
  CANCELLED: 'visitor.cancelled',
  EXPIRED: 'visitor.expired',
  ARRIVED: 'visitor.arrived',
  QR_GENERATED: 'visitor.qr_generated',
  QR_SCANNED: 'visitor.qr_scanned',
  QR_INVALID: 'visitor.qr_invalid',
  CHECKED_IN: 'visitor.checked_in',
  CHECKED_OUT: 'visitor.checked_out',
  COMPLETED: 'visitor.completed',
} as const;

export const VISITOR_STATUSES = {
  DRAFT: 'draft',
  INVITED: 'invited',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ARRIVED: 'arrived',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const QR_STATUSES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  USED: 'used',
  CANCELLED: 'cancelled',
  INVALID: 'invalid',
} as const;

export const VISITOR_PERMISSIONS = {
  CREATE: 'visitor.create',
  READ: 'visitor.read',
  UPDATE: 'visitor.update',
  DELETE: 'visitor.delete',
  APPROVE: 'visitor.approve',
  REJECT: 'visitor.reject',
  CHECK_IN: 'visitor.check_in',
  CHECK_OUT: 'visitor.check_out',
  HISTORY_READ: 'visitor.history.read',
  SETTINGS_MANAGE: 'visitor.settings.manage',
} as const;

export const VISITOR_DEFAULT_SETTINGS = {
  allowQrInvite: true,
  hostApprovalRequired: false,
  defaultVisitDurationHours: 4,
  notifyHostOnCheckIn: true,
  notifyHostOnCheckOut: true,
} as const;
