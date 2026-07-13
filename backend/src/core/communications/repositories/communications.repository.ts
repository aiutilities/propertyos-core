import {
  Communication,
  CommunicationCategory,
  CommunicationDetails,
  CommunicationFilters,
  CommunicationMetrics,
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

  listCategories():
    Promise<CommunicationCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<CommunicationCategory | null>;

  getMetrics(
    propertyId?: string,
  ): Promise<CommunicationMetrics>;
}
