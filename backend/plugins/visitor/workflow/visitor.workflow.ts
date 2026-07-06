import { defineWorkflows } from '../../src/core/plugin/sdk';

export const visitorWorkflows = defineWorkflows([
  {
    code: 'visitor.visit.lifecycle',
    name: 'Visitor Visit Lifecycle',
    entityType: 'visitor.visit',
    initialState: 'INVITED',
    states: [
      'INVITED',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'QR_GENERATED',
      'ARRIVED',
      'CHECKED_IN',
      'CHECKED_OUT',
      'CLOSED',
      'EXPIRED',
      'NO_SHOW',
      'OVERSTAYED',
    ],
    transitions: [
      { from: 'INVITED', to: 'APPROVED', action: 'APPROVE' },
      { from: 'INVITED', to: 'REJECTED', action: 'REJECT' },
      { from: 'INVITED', to: 'CANCELLED', action: 'CANCEL' },
      { from: 'APPROVED', to: 'QR_GENERATED', action: 'GENERATE_QR' },
      { from: 'QR_GENERATED', to: 'ARRIVED', action: 'ARRIVE' },
      { from: 'ARRIVED', to: 'CHECKED_IN', action: 'CHECK_IN' },
      { from: 'CHECKED_IN', to: 'CHECKED_OUT', action: 'CHECK_OUT' },
      { from: 'CHECKED_OUT', to: 'CLOSED', action: 'CLOSE' },
      { from: 'INVITED', to: 'NO_SHOW', action: 'MARK_NO_SHOW' },
      { from: 'QR_GENERATED', to: 'EXPIRED', action: 'EXPIRE_QR' },
      { from: 'CHECKED_IN', to: 'OVERSTAYED', action: 'MARK_OVERSTAYED' },
    ],
  },
]);
