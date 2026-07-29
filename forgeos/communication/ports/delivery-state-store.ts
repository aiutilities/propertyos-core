export type StoredDeliveryStatus =
  | 'SENT'
  | 'FAILED';

export interface UpdateDeliveryStateInput {
  communicationId: string;
  status: StoredDeliveryStatus;
  metadata?: Record<string, unknown>;
}

export interface StoredCommunicationDelivery {
  id: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryStateStore {
  updateDeliveryState(
    input: UpdateDeliveryStateInput,
  ): Promise<StoredCommunicationDelivery | null>;
}
