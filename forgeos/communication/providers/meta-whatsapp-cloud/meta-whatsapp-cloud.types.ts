export interface MetaWhatsAppCloudConfiguration {
  graphApiVersion: string;
  phoneNumberId: string;
  accessToken: string;
  timeoutMilliseconds?: number;
  previewUrl?: boolean;
}

export interface MetaWhatsAppCloudConfigurationResult {
  status: 'READY' | 'BLOCKED';
  graphApiVersion?: string;
  phoneNumberId?: string;
  accessToken?: string;
  timeoutMilliseconds: number;
  previewUrl: boolean;
  endpoint?: string;
  errors: readonly string[];
}

export interface MetaWhatsAppCloudSuccessResponse {
  messaging_product?: string;
  contacts?: readonly {
    input?: string;
    wa_id?: string;
  }[];
  messages: readonly {
    id: string;
  }[];
}

export interface MetaWhatsAppCloudErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}
