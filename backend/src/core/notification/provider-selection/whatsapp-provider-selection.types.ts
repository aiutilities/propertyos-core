import {
  CommunicationProviderSelection,
} from './communication-provider-selection.types';

export type WhatsAppProviderMode =
  | 'MOCK'
  | 'WEBHOOK'
  | 'META_CLOUD'
  | 'DISABLED';

export interface WhatsAppProviderSelection
  extends CommunicationProviderSelection {
  channel: 'WHATSAPP';

  provider:
    WhatsAppProviderMode;

  mockAllowed:
    boolean;
}
