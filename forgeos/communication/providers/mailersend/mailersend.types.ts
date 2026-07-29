export interface MailerSendConfiguration {
  apiToken: string;

  fromEmail: string;
  fromName?: string;

  replyToEmail?: string;
  replyToName?: string;

  endpoint?: string;
  timeoutMilliseconds?: number;

  trackClicks?: boolean;
  trackOpens?: boolean;
  trackContent?: boolean;
}

export interface MailerSendConfigurationResult {
  status: 'READY' | 'BLOCKED';

  apiToken?: string;

  fromEmail?: string;
  fromName?: string;

  replyToEmail?: string;
  replyToName?: string;

  endpoint: string;
  timeoutMilliseconds: number;

  trackClicks?: boolean;
  trackOpens?: boolean;
  trackContent?: boolean;

  errors: readonly string[];
}

export interface MailerSendWarningResponse {
  message?: string;

  warnings?: readonly {
    type?: string;
    message?: string;
  }[];
}

export interface MailerSendErrorResponse {
  message?: string;

  errors?: Record<
    string,
    readonly string[]
  >;
}
