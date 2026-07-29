import {
  NotificationChannel,
} from '../types/notification.types';

export type CommunicationEnvironmentClass =
  | 'DEVELOPMENT'
  | 'TEST'
  | 'PRODUCTION';

export type CommunicationProviderSelectionStatus =
  | 'READY'
  | 'BLOCKED';

export interface CommunicationProviderSelection {
  status:
    CommunicationProviderSelectionStatus;

  channel:
    NotificationChannel;

  provider:
    string;

  enabled:
    boolean;

  realDeliveryConfigured:
    boolean;

  errors:
    readonly string[];
}

export interface CommunicationProviderSelectionInput {
  environmentClass:
    CommunicationEnvironmentClass;

  configuredProvider?:
    string;
}
