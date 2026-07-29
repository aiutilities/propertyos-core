import {
  CommunicationProviderSelection,
} from './communication-provider-selection.types';

export type SmsProviderMode =
  | 'FAST2SMS'
  | 'DISABLED';

export interface SmsProviderSelection
  extends CommunicationProviderSelection {
  channel: 'SMS';

  provider:
    SmsProviderMode;
}
