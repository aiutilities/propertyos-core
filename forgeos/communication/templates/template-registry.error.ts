import {
  CommunicationChannel,
  COMMUNICATION_ERROR_CODES,
  CommunicationError,
} from '../contracts';

export class CommunicationTemplateNotFoundError
  extends CommunicationError {
  constructor(
    key: string,
    channel: CommunicationChannel,
    version?: string,
    locale?: string,
  ) {
    super(
      COMMUNICATION_ERROR_CODES.TEMPLATE_NOT_FOUND,
      `Communication template not found: ${key}`,
      false,
      {
        key,
        channel,
        version,
        locale,
      },
    );

    this.name = 'CommunicationTemplateNotFoundError';
  }
}

export class CommunicationTemplateValidationError
  extends CommunicationError {
  constructor(
    key: string,
    missingVariables: readonly string[],
  ) {
    super(
      COMMUNICATION_ERROR_CODES.TEMPLATE_RENDER_FAILED,
      `Communication template ${key} is missing required variables: ${missingVariables.join(', ')}`,
      false,
      {
        key,
        missingVariables,
      },
    );

    this.name = 'CommunicationTemplateValidationError';
  }
}
