import {
  validateMailerSendEmail,
} from './mailersend-email';

import {
  MailerSendConfiguration,
  MailerSendConfigurationResult,
} from './mailersend.types';

export const DEFAULT_MAILERSEND_ENDPOINT =
  'https://api.mailersend.com/v1/email';

export const DEFAULT_MAILERSEND_TIMEOUT_MILLISECONDS =
  10_000;

export const MAX_MAILERSEND_TIMEOUT_MILLISECONDS =
  60_000;

function normalizeOptional(
  value: string | undefined,
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

function resolveTimeout(
  value: number | undefined,
  errors: string[],
): number {
  if (value === undefined) {
    return DEFAULT_MAILERSEND_TIMEOUT_MILLISECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value >
      MAX_MAILERSEND_TIMEOUT_MILLISECONDS
  ) {
    errors.push(
      'MailerSend timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_MAILERSEND_TIMEOUT_MILLISECONDS;
  }

  return value;
}

export function resolveMailerSendConfiguration(
  input: MailerSendConfiguration,
): MailerSendConfigurationResult {
  const errors: string[] = [];

  const apiToken =
    normalizeOptional(
      input.apiToken,
    );

  if (!apiToken) {
    errors.push(
      'MailerSend API token is required',
    );
  } else if (
    apiToken.length < 20
  ) {
    errors.push(
      'MailerSend API token must contain at least 20 characters',
    );
  }

  const fromEmailResult =
    validateMailerSendEmail(
      input.fromEmail,
    );

  if (
    fromEmailResult.status ===
    'BLOCKED'
  ) {
    errors.push(
      'MailerSend sender email is invalid',
    );
  }

  const replyToEmailValue =
    normalizeOptional(
      input.replyToEmail,
    );

  let replyToEmail:
    string | undefined;

  if (replyToEmailValue) {
    const result =
      validateMailerSendEmail(
        replyToEmailValue,
      );

    if (
      result.status ===
      'BLOCKED'
    ) {
      errors.push(
        'MailerSend reply-to email is invalid',
      );
    } else {
      replyToEmail =
        result.email;
    }
  }

  const endpointValue =
    normalizeOptional(
      input.endpoint,
    ) ??
    DEFAULT_MAILERSEND_ENDPOINT;

  let endpoint =
    DEFAULT_MAILERSEND_ENDPOINT;

  try {
    const parsed =
      new URL(endpointValue);

    if (
      parsed.protocol !==
      'https:'
    ) {
      errors.push(
        'MailerSend endpoint must use HTTPS',
      );
    }

    if (
      parsed.username ||
      parsed.password
    ) {
      errors.push(
        'MailerSend endpoint must not contain credentials',
      );
    }

    if (parsed.hash) {
      errors.push(
        'MailerSend endpoint must not contain a fragment',
      );
    }

    endpoint =
      parsed.toString();
  } catch {
    errors.push(
      'MailerSend endpoint must be a valid absolute URL',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    apiToken,

    fromEmail:
      fromEmailResult.email,

    fromName:
      normalizeOptional(
        input.fromName,
      ),

    replyToEmail,

    replyToName:
      normalizeOptional(
        input.replyToName,
      ),

    endpoint,

    timeoutMilliseconds:
      resolveTimeout(
        input.timeoutMilliseconds,
        errors,
      ),

    trackClicks:
      input.trackClicks,

    trackOpens:
      input.trackOpens,

    trackContent:
      input.trackContent,

    errors,
  };
}
