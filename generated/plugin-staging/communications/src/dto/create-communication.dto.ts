import {
  CommunicationAudienceType,
  CommunicationPriority,
  CommunicationType,
} from '../types/communications.types';

export class CommunicationTargetDto {
  audienceType!: CommunicationAudienceType;
  zoneId?: string;
  spaceId?: string;
  personId?: string;
  roleId?: string;
}

export class CreateCommunicationDto {
  propertyId!: string;
  categoryId!: string;
  type: CommunicationType =
    CommunicationType.ANNOUNCEMENT;
  title!: string;
  content!: string;
  summary?: string;
  priority: CommunicationPriority =
    CommunicationPriority.NORMAL;
  isPinned = false;
  requiresAcknowledgement = false;
  publishAt?: string;
  expiresAt?: string;
  createdByPersonId!: string;
  targets!: CommunicationTargetDto[];
}
