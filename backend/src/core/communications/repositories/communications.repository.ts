import {
  Communication,
  CommunicationCategory,
  CommunicationDetails,
  CommunicationEngagementMetrics,
  CommunicationFilters,
  CommunicationMetrics,
  CommunicationRead,
  CommunicationStatusHistory,
  CommunicationTarget,
} from '../types/communications.types';

export const COMMUNICATIONS_REPOSITORY =
  Symbol('COMMUNICATIONS_REPOSITORY');

export interface CommunicationsRepository {
  create(
    communication: Communication,
  ): Promise<Communication>;

  findById(
    id: string,
  ): Promise<Communication | null>;

  findDetailsById(
    id: string,
  ): Promise<CommunicationDetails | null>;

  findAll(
    filters?: CommunicationFilters,
  ): Promise<Communication[]>;

  update(
    id: string,
    input: Partial<Communication>,
  ): Promise<Communication | null>;

  replaceTargets(
    communicationId: string,
    targets: CommunicationTarget[],
  ): Promise<CommunicationTarget[]>;

  listTargets(
    communicationId: string,
  ): Promise<CommunicationTarget[]>;

  addHistory(
    history: CommunicationStatusHistory,
  ): Promise<CommunicationStatusHistory>;

  listHistory(
    communicationId: string,
  ): Promise<CommunicationStatusHistory[]>;

  markRead(
    communicationId: string,
    personId: string,
    readAt: Date,
  ): Promise<CommunicationRead>;

  acknowledge(
    communicationId: string,
    personId: string,
    acknowledgedAt: Date,
  ): Promise<CommunicationRead>;

  listReads(
    communicationId: string,
  ): Promise<CommunicationRead[]>;

  getEngagementMetrics(
    communicationId: string,
  ): Promise<CommunicationEngagementMetrics>;

  listCategories():
    Promise<CommunicationCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<CommunicationCategory | null>;

  getMetrics(
    propertyId?: string,
  ): Promise<CommunicationMetrics>;
}
