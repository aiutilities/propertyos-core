export const COMMUNICATIONS_REGISTRY_ID =
  'propertyos.core.communications';

export const COMMUNICATIONS_PERMISSIONS = {
  READ: 'communications.read',
  CREATE: 'communications.create',
  MANAGE: 'communications.manage',
  PUBLISH: 'communications.publish',
  ARCHIVE: 'communications.archive',
  READ_RECEIPTS:
    'communications.read_receipts',
  CONFIGURE:
    'communications.configure',
} as const;

export const COMMUNICATIONS_EVENTS = {
  CREATED:
    'communications.communication.created',
  UPDATED:
    'communications.communication.updated',
  SCHEDULED:
    'communications.communication.scheduled',
  PUBLISHED:
    'communications.communication.published',
  EXPIRED:
    'communications.communication.expired',
  ARCHIVED:
    'communications.communication.archived',
  CANCELLED:
    'communications.communication.cancelled',
  READ:
    'communications.communication.read',
  DELIVERY_QUEUED:
    'communications.delivery.queued',
  DELIVERY_COMPLETED:
    'communications.delivery.completed',
  DELIVERY_FAILED:
    'communications.delivery.failed',
} as const;

export const COMMUNICATIONS_PUBLISH_JOB_TYPE =
  'communications.publish';

export const COMMUNICATIONS_EXPIRE_JOB_TYPE =
  'communications.expire';

export const COMMUNICATIONS_SEARCH_PROVIDER =
  'communications';
