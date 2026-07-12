export const VEHICLE_REGISTRY_ID = 'propertyos.core.vehicle';

export const VEHICLE_PERMISSIONS = {
  READ: 'vehicle.read',
  CREATE: 'vehicle.create',
  MANAGE: 'vehicle.manage',
  SECURITY: 'vehicle.security',
} as const;

export const VEHICLE_EVENTS = {
  CREATED: 'vehicle.created',
  UPDATED: 'vehicle.updated',
  VERIFIED: 'vehicle.verified',
  REJECTED: 'vehicle.rejected',
  SUSPENDED: 'vehicle.suspended',
  ARCHIVED: 'vehicle.archived',
  MOVEMENT_RECORDED: 'vehicle.movement.recorded',
} as const;
