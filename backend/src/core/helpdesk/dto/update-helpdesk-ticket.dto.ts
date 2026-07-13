import {
  HelpdeskChannel,
  HelpdeskPriority,
} from '../types/helpdesk.types';

export class UpdateHelpdeskTicketDto {
  title?: string;
  description?: string;
  categoryId?: string;
  spaceId?: string;
  priority?: HelpdeskPriority;
  channel?: HelpdeskChannel;
  changedByPersonId!: string;
  remarks?: string;
}
