import {
  HelpdeskChannel,
  HelpdeskPriority,
} from '../types/helpdesk.types';

export class CreateHelpdeskTicketDto {
  title!: string;
  description!: string;
  categoryId!: string;
  propertyId!: string;
  spaceId?: string;
  requesterPersonId!: string;
  priority?: HelpdeskPriority;
  channel: HelpdeskChannel = HelpdeskChannel.WEB;
}
