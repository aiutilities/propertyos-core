import {
  MailerSendProvider,
} from '@forgeos/communication';

export interface PropertyOSMailerSendEnvironment {
  apiToken?: string;

  fromEmail?: string;
  fromName?: string;

  replyToEmail?: string;
  replyToName?: string;

  timeoutMilliseconds?: string;

  trackClicks?: string;
  trackOpens?: string;
  trackContent?: string;
}

function parseTimeout(
  value?: string,
): number | undefined {
  if (
    value === undefined ||
    value.trim() === ''
  ) {
    return undefined;
  }

  return Number(
    value.trim(),
  );
}

function parseBoolean(
  value?: string,
): boolean | undefined {
  const normalized =
    value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes'
  ) {
    return true;
  }

  if (
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'no'
  ) {
    return false;
  }

  return undefined;
}

export function createPropertyOSMailerSendProvider(
  environment:
    PropertyOSMailerSendEnvironment,
): MailerSendProvider {
  return new MailerSendProvider({
    apiToken:
      environment.apiToken ?? '',

    fromEmail:
      environment.fromEmail ?? '',

    fromName:
      environment.fromName,

    replyToEmail:
      environment.replyToEmail,

    replyToName:
      environment.replyToName,

    timeoutMilliseconds:
      parseTimeout(
        environment.timeoutMilliseconds,
      ),

    trackClicks:
      parseBoolean(
        environment.trackClicks,
      ),

    trackOpens:
      parseBoolean(
        environment.trackOpens,
      ),

    trackContent:
      parseBoolean(
        environment.trackContent,
      ),
  });
}
