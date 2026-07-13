export const STAFF_REGISTRY_ID = "propertyos.core.staff";

export const STAFF_PERMISSIONS = {
  READ: "staff.read",
  CREATE: "staff.create",
  MANAGE: "staff.manage",
  SECURITY: "staff.security",
} as const;

export const STAFF_EVENTS = {
  CREATED: "staff.created",
  UPDATED: "staff.updated",
  ACTIVATED: "staff.activated",
  DEACTIVATED: "staff.deactivated",
  SUSPENDED: "staff.suspended",
  ARCHIVED: "staff.archived",
  ATTENDANCE_RECORDED: "staff.attendance.recorded",
  CHECKED_IN: "staff.checked_in",
  CHECKED_OUT: "staff.checked_out",
} as const;

export const STAFF_SEARCH_PROVIDER = "staff";

export const STAFF_MODULE = "staff";
