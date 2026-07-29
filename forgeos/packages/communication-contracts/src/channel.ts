export const COMMUNICATION_CHANNELS = [
  'WHATSAPP',
  'EMAIL',
  'SMS',
  'PUSH',
  'IN_APP',
] as const;

export type CommunicationChannel =
  (typeof COMMUNICATION_CHANNELS)[number];
