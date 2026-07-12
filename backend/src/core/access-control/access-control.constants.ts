export const ACCESS_CONTROL_REGISTRY_ID = "propertyos.core.access-control";

export const ACCESS_CONTROL_PERMISSIONS = {
  READ: "access-control.read",
  CREATE: "access-control.create",
  MANAGE: "access-control.manage",
  OPERATE: "access-control.operate",
  OVERRIDE: "access-control.override",
} as const;

export const ACCESS_CONTROL_EVENTS = {
  ACCESS_POINT_CREATED: "access-control.point.created",
  ACCESS_POINT_UPDATED: "access-control.point.updated",
  ACCESS_POINT_ACTIVATED: "access-control.point.activated",
  ACCESS_POINT_DEACTIVATED: "access-control.point.deactivated",
  ACCESS_POINT_EMERGENCY_OPENED: "access-control.point.emergency_opened",

  GRANT_CREATED: "access-control.grant.created",
  GRANT_SUSPENDED: "access-control.grant.suspended",
  GRANT_REVOKED: "access-control.grant.revoked",
  GRANT_EXPIRED: "access-control.grant.expired",

  ACCESS_GRANTED: "access-control.access.granted",
  ACCESS_DENIED: "access-control.access.denied",
  ENTRY_RECORDED: "access-control.entry.recorded",
  EXIT_RECORDED: "access-control.exit.recorded",
} as const;

export const ACCESS_CONTROL_SEARCH_PROVIDER = "access-control";

export const ACCESS_CONTROL_MODULE = "access-control";
