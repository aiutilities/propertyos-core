export interface Fast2SmsConfiguration {
  apiKey: string;
  senderId: string;

  endpoint?: string;
  timeoutMilliseconds?: number;

  includeSmsDetails?: boolean;
}

export interface Fast2SmsConfigurationResult {
  status: 'READY' | 'BLOCKED';

  apiKey?: string;
  senderId?: string;

  endpoint: string;
  timeoutMilliseconds: number;
  includeSmsDetails: boolean;

  errors: readonly string[];
}

export interface Fast2SmsSuccessResponse {
  return: true;
  request_id?: string;
  message?: readonly string[] | string;
}

export interface Fast2SmsFailureResponse {
  return?: false;
  status_code?: number;
  message?: readonly string[] | string;
}
