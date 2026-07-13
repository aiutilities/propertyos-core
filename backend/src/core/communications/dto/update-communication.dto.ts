import {
  CommunicationPriority,
  CommunicationType,
} from '../types/communications.types';
import {
  CommunicationTargetDto,
} from './create-communication.dto';

export class UpdateCommunicationDto {
  categoryId?: string;
  type?: CommunicationType;
  title?: string;
  content?: string;
  summary?: string;
  priority?: CommunicationPriority;
  isPinned?: boolean;
  requiresAcknowledgement?: boolean;
  publishAt?: string;
  expiresAt?: string;
  updatedByPersonId!: string;
  targets?: CommunicationTargetDto[];
}
