import {
  MAINTENANCE_PERMISSIONS,
  MAINTENANCE_WORKFLOW_CODE,
} from './maintenance.constants';

export const MAINTENANCE_WORKFLOW_DEFINITION = {
  code: MAINTENANCE_WORKFLOW_CODE,
  name: 'Maintenance Ticket Lifecycle',
  description:
    'Controls assignment, progress, resolution, and closure of maintenance tickets',
  entityType: 'maintenance.ticket',
  initialState: 'OPEN',
  states: [
    {
      code: 'OPEN',
      name: 'Open',
      isInitial: true,
      sortOrder: 0,
    },
    {
      code: 'ASSIGNED',
      name: 'Assigned',
      sortOrder: 1,
    },
    {
      code: 'IN_PROGRESS',
      name: 'In Progress',
      sortOrder: 2,
    },
    {
      code: 'RESOLVED',
      name: 'Resolved',
      sortOrder: 3,
    },
    {
      code: 'CLOSED',
      name: 'Closed',
      isFinal: true,
      sortOrder: 4,
    },
    {
      code: 'CANCELLED',
      name: 'Cancelled',
      isFinal: true,
      sortOrder: 5,
    },
    {
      code: 'REJECTED',
      name: 'Rejected',
      isFinal: true,
      sortOrder: 6,
    },
  ],
  transitions: [
    {
      fromState: 'OPEN',
      toState: 'ASSIGNED',
      actionCode: 'assign',
      actionName: 'Assign',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'ASSIGNED',
      toState: 'IN_PROGRESS',
      actionCode: 'start',
      actionName: 'Start Work',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'IN_PROGRESS',
      toState: 'RESOLVED',
      actionCode: 'resolve',
      actionName: 'Resolve',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'RESOLVED',
      toState: 'CLOSED',
      actionCode: 'close',
      actionName: 'Close',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'RESOLVED',
      toState: 'IN_PROGRESS',
      actionCode: 'reopen',
      actionName: 'Reopen',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'OPEN',
      toState: 'CANCELLED',
      actionCode: 'cancel',
      actionName: 'Cancel',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'ASSIGNED',
      toState: 'CANCELLED',
      actionCode: 'cancel',
      actionName: 'Cancel',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'OPEN',
      toState: 'REJECTED',
      actionCode: 'reject',
      actionName: 'Reject',
      requiredPermission:
        MAINTENANCE_PERMISSIONS.MANAGE,
    },
  ],
  metadata: {
    module: 'maintenance',
    version: 1,
  },
};
