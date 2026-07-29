export interface CommunicationRecipient {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  locale?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}
