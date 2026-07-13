export const VENDOR_REGISTRY_ID =
  'propertyos.core.vendor';

export const VENDOR_PERMISSIONS = {
  READ: 'vendor.read',
  CREATE: 'vendor.create',
  UPDATE: 'vendor.update',
  MANAGE: 'vendor.manage',
  CONTRACTS: 'vendor.contracts',
  WORK_ORDERS: 'vendor.work_orders',
  COMPLIANCE: 'vendor.compliance',
  RATINGS: 'vendor.ratings',
  CONFIGURE: 'vendor.configure',
} as const;

export const VENDOR_EVENTS = {
  CREATED:
    'vendor.created',
  UPDATED:
    'vendor.updated',
  ACTIVATED:
    'vendor.activated',
  SUSPENDED:
    'vendor.suspended',
  BLOCKED:
    'vendor.blocked',
  ARCHIVED:
    'vendor.archived',

  CONTRACT_CREATED:
    'vendor.contract.created',
  CONTRACT_ACTIVATED:
    'vendor.contract.activated',
  CONTRACT_RENEWED:
    'vendor.contract.renewed',
  CONTRACT_EXPIRED:
    'vendor.contract.expired',
  CONTRACT_TERMINATED:
    'vendor.contract.terminated',

  COMPLIANCE_ADDED:
    'vendor.compliance.added',
  COMPLIANCE_VERIFIED:
    'vendor.compliance.verified',
  COMPLIANCE_EXPIRING:
    'vendor.compliance.expiring',
  COMPLIANCE_EXPIRED:
    'vendor.compliance.expired',

  WORK_ORDER_CREATED:
    'vendor.work_order.created',
  WORK_ORDER_ASSIGNED:
    'vendor.work_order.assigned',
  WORK_ORDER_ACCEPTED:
    'vendor.work_order.accepted',
  WORK_ORDER_STARTED:
    'vendor.work_order.started',
  WORK_ORDER_COMPLETED:
    'vendor.work_order.completed',
  WORK_ORDER_CANCELLED:
    'vendor.work_order.cancelled',

  RATED:
    'vendor.rated',
} as const;

export const VENDOR_SEARCH_PROVIDER =
  'vendors';

export const VENDOR_CONTRACT_EXPIRY_JOB_TYPE =
  'vendor.contract.expiry';

export const VENDOR_COMPLIANCE_EXPIRY_JOB_TYPE =
  'vendor.compliance.expiry';
