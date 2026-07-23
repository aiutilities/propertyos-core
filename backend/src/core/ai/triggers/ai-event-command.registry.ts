import {
  PropertyAiTriggerCommand,
} from '../types/property-ai-trigger.types';


export const AI_EVENT_COMMAND_REGISTRY:
  Record<string, PropertyAiTriggerCommand> =
{

  'maintenance.ticket.created':
    'ANALYZE_PROPERTY_HEALTH',

  'maintenance.ticket.sla_warning':
    'REVIEW_OPERATIONAL_RISK',

  'maintenance.ticket.sla_overdue':
    'ANALYZE_PROPERTY_HEALTH',

  // Backward compatible AI trigger event
  'maintenance.ticket.overdue':
    'ANALYZE_PROPERTY_HEALTH',


  'helpdesk.ticket.created':
    'REVIEW_OPERATIONAL_RISK',

  'helpdesk.ticket.escalated':
    'REVIEW_OPERATIONAL_RISK',

  'helpdesk.ticket.sla_breached':
    'REVIEW_OPERATIONAL_RISK',


  'inventory.stock.low':
    'REVIEW_OPERATIONAL_RISK',

  'inventory.stock.out':
    'REVIEW_OPERATIONAL_RISK',

};
