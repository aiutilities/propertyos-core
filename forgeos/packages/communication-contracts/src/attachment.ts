export const COMMUNICATION_ATTACHMENT_TYPES = [
  'FILE',
  'IMAGE',
  'DOCUMENT',
  'QR_CODE',
  'LINK',
] as const;

export type CommunicationAttachmentType =
  (typeof COMMUNICATION_ATTACHMENT_TYPES)[number];

export interface CommunicationAttachment {
  type: CommunicationAttachmentType;
  name?: string;
  mimeType?: string;
  url?: string;
  storageKey?: string;
  contentBase64?: string;
  metadata?: Record<string, unknown>;
}
