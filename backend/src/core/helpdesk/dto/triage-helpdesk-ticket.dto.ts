import {
  HelpdeskChannel,
  HelpdeskPriority,
} from '../types/helpdesk.types';

export class TriageHelpdeskTicketDto {
  tenantId!: string;
  title!: string;
  description!: string;
  categoryId?: string;
  categoryName?: string;
  priority?: HelpdeskPriority;
  channel: HelpdeskChannel =
    HelpdeskChannel.WEB;
}
