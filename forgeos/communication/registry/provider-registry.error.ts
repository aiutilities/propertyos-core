import {
  CommunicationChannel,
  COMMUNICATION_ERROR_CODES,
  CommunicationError,
} from '../contracts';

export class CommunicationProviderNotFoundError
  extends CommunicationError {
  constructor(channel: CommunicationChannel) {
    super(
      COMMUNICATION_ERROR_CODES.PROVIDER_NOT_REGISTERED,
      `No communication provider is registered for channel ${channel}`,
      false,
      { channel },
    );

    this.name = 'CommunicationProviderNotFoundError';
  }
}
