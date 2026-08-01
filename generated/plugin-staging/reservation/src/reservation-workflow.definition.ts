import {
  RESERVATION_PERMISSIONS,
  RESERVATION_WORKFLOW_CODE,
} from './reservation.constants';

export const RESERVATION_WORKFLOW_DEFINITION = {
  code: RESERVATION_WORKFLOW_CODE,
  name: 'Reservation Lifecycle',
  description:
    'Controls approval, arrival, completion, cancellation, rejection, and no-show processing for reservations',
  entityType: 'reservation',
  initialState: 'PENDING',
  states: [
    {
      code: 'PENDING',
      name: 'Pending Approval',
      isInitial: true,
      sortOrder: 0,
    },
    {
      code: 'APPROVED',
      name: 'Approved',
      sortOrder: 1,
    },
    {
      code: 'CHECKED_IN',
      name: 'Checked In',
      sortOrder: 2,
    },
    {
      code: 'COMPLETED',
      name: 'Completed',
      isFinal: true,
      sortOrder: 3,
    },
    {
      code: 'REJECTED',
      name: 'Rejected',
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
      code: 'NO_SHOW',
      name: 'No Show',
      isFinal: true,
      sortOrder: 6,
    },
  ],
  transitions: [
    {
      fromState: 'PENDING',
      toState: 'APPROVED',
      actionCode: 'approve',
      actionName: 'Approve',
      requiredPermission:
        RESERVATION_PERMISSIONS.APPROVE,
    },
    {
      fromState: 'PENDING',
      toState: 'REJECTED',
      actionCode: 'reject',
      actionName: 'Reject',
      requiredPermission:
        RESERVATION_PERMISSIONS.APPROVE,
    },
    {
      fromState: 'PENDING',
      toState: 'CANCELLED',
      actionCode: 'cancel',
      actionName: 'Cancel',
      requiredPermission:
        RESERVATION_PERMISSIONS.CANCEL,
    },
    {
      fromState: 'APPROVED',
      toState: 'CANCELLED',
      actionCode: 'cancel',
      actionName: 'Cancel',
      requiredPermission:
        RESERVATION_PERMISSIONS.CANCEL,
    },
    {
      fromState: 'APPROVED',
      toState: 'CHECKED_IN',
      actionCode: 'check-in',
      actionName: 'Check In',
      requiredPermission:
        RESERVATION_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'APPROVED',
      toState: 'COMPLETED',
      actionCode: 'complete',
      actionName: 'Complete',
      requiredPermission:
        RESERVATION_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'CHECKED_IN',
      toState: 'COMPLETED',
      actionCode: 'complete',
      actionName: 'Complete',
      requiredPermission:
        RESERVATION_PERMISSIONS.MANAGE,
    },
    {
      fromState: 'APPROVED',
      toState: 'NO_SHOW',
      actionCode: 'no-show',
      actionName: 'Mark No Show',
      requiredPermission:
        RESERVATION_PERMISSIONS.MANAGE,
    },
  ],
  metadata: {
    module: 'reservation',
    version: 1,
  },
};
