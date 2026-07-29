import {
  CommunicationProviderSelection,
} from './communication-provider-selection.types';

export type EmailProviderMode =
  | 'MAILERSEND'
  | 'DISABLED';

export interface EmailProviderSelection
  extends CommunicationProviderSelection {
  channel: 'EMAIL';

  provider:
    EmailProviderMode;
}
