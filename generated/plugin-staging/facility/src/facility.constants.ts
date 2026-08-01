export const FACILITY_REGISTRY_ID = 'propertyos.core.facility';

export const FACILITY_PERMISSIONS = {
  READ: 'facility.read',
  CREATE: 'facility.create',
  MANAGE: 'facility.manage',
} as const;

export const FACILITY_EVENTS = {
  ASSET_CREATED: 'facility.asset.created',
  ASSET_UPDATED: 'facility.asset.updated',
  ASSET_ACTIVATED: 'facility.asset.activated',
  ASSET_IN_MAINTENANCE: 'facility.asset.in_maintenance',
  ASSET_RETIRED: 'facility.asset.retired',
  ASSET_DISPOSED: 'facility.asset.disposed',
  PLAN_CREATED: 'facility.preventive_plan.created',
} as const;

export const FACILITY_ASSET_WORKFLOW_CODE =
  'facility.asset.lifecycle';
