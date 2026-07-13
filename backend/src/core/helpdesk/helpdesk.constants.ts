export const HELPDESK_REGISTRY_ID = 'propertyos.core.helpdesk';

export const HELPDESK_PERMISSIONS = {
  READ: 'helpdesk.read',
  CREATE: 'helpdesk.create',
  MANAGE: 'helpdesk.manage',
  COMMENT: 'helpdesk.comment',
  ASSIGN: 'helpdesk.assign',
  RESOLVE: 'helpdesk.resolve',
  CONFIGURE: 'helpdesk.configure',
} as const;

export const HELPDESK_EVENTS = {
  CREATED: 'helpdesk.ticket.created',
  UPDATED: 'helpdesk.ticket.updated',
  ASSIGNED: 'helpdesk.ticket.assigned',
  IN_PROGRESS: 'helpdesk.ticket.in_progress',
  ESCALATED: 'helpdesk.ticket.escalated',
  RESOLVED: 'helpdesk.ticket.resolved',
  REOPENED: 'helpdesk.ticket.reopened',
  CLOSED: 'helpdesk.ticket.closed',
  CANCELLED: 'helpdesk.ticket.cancelled',
  COMMENT_ADDED: 'helpdesk.ticket.comment_added',
  WORKLOG_ADDED: 'helpdesk.ticket.worklog_added',
  FEEDBACK_SUBMITTED: 'helpdesk.ticket.feedback_submitted',
  SLA_WARNING: 'helpdesk.ticket.sla_warning',
  SLA_BREACHED: 'helpdesk.ticket.sla_breached',
} as const;

export const HELPDESK_WORKFLOW_CODE = 'helpdesk.ticket.lifecycle';

export const HELPDESK_SLA_WARNING_JOB_TYPE =
  'helpdesk.sla.warning';

export const HELPDESK_SLA_BREACH_JOB_TYPE =
  'helpdesk.sla.breach';

export const HELPDESK_DAILY_SUMMARY_JOB_TYPE =
  'helpdesk.daily.summary';
