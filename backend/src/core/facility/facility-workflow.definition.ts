import {
  FACILITY_ASSET_WORKFLOW_CODE,
  FACILITY_PERMISSIONS,
} from './facility.constants';

export const FACILITY_ASSET_WORKFLOW_DEFINITION = {
  code: FACILITY_ASSET_WORKFLOW_CODE,
  name: 'Facility Asset Lifecycle',
  description:
    'Controls activation, maintenance, retirement, and disposal of facility assets',
  entityType: 'facility.asset',
  initialState: 'DRAFT',
  states: [
    {
      code: 'DRAFT',
      name: 'Draft',
      isInitial: true,
      sortOrder: 0,
    },
    {
      code: 'ACTIVE',
      name: 'Active',
      sortOrder: 1,
    },
    {
      code: 'IN_MAINTENANCE',
      name: 'In Maintenance',
      sortOrder: 2,
    },
    {
      code: 'OUT_OF_SERVICE',
      name: 'Out of Service',
      sortOrder: 3,
    },
    {
      code: 'RETIRED',
      name: 'Retired',
      sortOrder: 4,
    },
    {
      code: 'DISPOSED',
      name: 'Disposed',
      isFinal: true,
      sortOrder: 5,
    },
  ],
  transitions: [
    {
      fromState: 'DRAFT',
      toState: 'ACTIVE',
      actionCode: 'activate',
      actionName: 'Activate',
      requiredPermission: FACILITY_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'ACTIVE',
      toState: 'IN_MAINTENANCE',
      actionCode: 'start-maintenance',
      actionName: 'Start Maintenance',
      requiredPermission: FACILITY_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'IN_MAINTENANCE',
      toState: 'ACTIVE',
      actionCode: 'return-to-service',
      actionName: 'Return to Service',
      requiredPermission: FACILITY_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'ACTIVE',
      toState: 'RETIRED',
      actionCode: 'retire',
      actionName: 'Retire',
      requiredPermission: FACILITY_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'RETIRED',
      toState: 'DISPOSED',
      actionCode: 'dispose',
      actionName: 'Dispose',
      requiredPermission: FACILITY_PERMISSIONS.MANAGE,
    },
  ],
  metadata: {
    module: 'facility',
    version: 1,
  },
};
