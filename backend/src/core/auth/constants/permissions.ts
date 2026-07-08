export const Permissions = {
  PERSON_READ: 'person.read',
  PERSON_CREATE: 'person.create',

  ORGANIZATION_READ: 'organization.read',
  ORGANIZATION_CREATE: 'organization.create',

  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',

  PERMISSION_READ: 'permission.read',
  PERMISSION_CREATE: 'permission.create',

  PROPERTY_READ: 'property.read',
  PROPERTY_CREATE: 'property.create',

  TENANT_READ: 'tenant.read',
  TENANT_CREATE: 'tenant.create',

  VISITOR_READ: 'visitor.read',
  VISITOR_CREATE: 'visitor.create',

  AGREEMENT_READ: 'agreement.read',
  AGREEMENT_CREATE: 'agreement.create',

  RENT_READ: 'rent.read',
  RENT_CREATE: 'rent.create',

  RECEIPT_READ: 'receipt.read',
  RECEIPT_CREATE: 'receipt.create',

  INVOICE_READ: 'invoice.read',
  INVOICE_CREATE: 'invoice.create',

  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_CREATE: 'notification.create',

  DOCUMENT_READ: 'document.read',
  DOCUMENT_CREATE: 'document.create',

  WORKFLOW_READ: 'workflow.read',
  WORKFLOW_CREATE: 'workflow.create',

  SEARCH_READ: 'search.read',

  PLUGIN_READ: 'plugin.read',
  PLUGIN_CREATE: 'plugin.create',
  PLUGIN_MANAGE: 'plugin.manage',

  CONFIGURATION_READ: 'configuration.read',
  CONFIGURATION_MANAGE: 'configuration.manage',

  FORM_READ: 'form.read',
  FORM_CREATE: 'form.create',

  SCHEDULER_READ: 'scheduler.read',
  SCHEDULER_MANAGE: 'scheduler.manage',

  STORAGE_READ: 'storage.read',
  STORAGE_CREATE: 'storage.create',

  UPLOAD_CREATE: 'upload.create',

  METRICS_READ: 'metrics.read',

  ADMIN_READ: 'admin.read',
  ADMIN_MANAGE: 'admin.manage',
} as const;
