import {
  AiProviderHttpRequest,
  AiProviderHttpResponse,
} from '../types/ai-provider-http-transport.types';

export const AI_PROVIDER_HTTP_TRANSPORT =
  Symbol(
    'AI_PROVIDER_HTTP_TRANSPORT',
  );

export interface AiProviderHttpTransport {
  execute<T = unknown>(
    request: AiProviderHttpRequest,
  ): Promise<AiProviderHttpResponse<T>>;
}
