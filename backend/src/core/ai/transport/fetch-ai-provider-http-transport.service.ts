import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderHttpTransport,
} from '../contracts/ai-provider-http-transport.contract';
import {
  AiProviderHttpTransportError,
} from '../errors/ai-provider-http-transport.error';
import {
  AiProviderHttpRequest,
  AiProviderHttpResponse,
} from '../types/ai-provider-http-transport.types';

@Injectable()
export class FetchAiProviderHttpTransportService
  implements AiProviderHttpTransport
{
  async execute<T = unknown>(
    request: AiProviderHttpRequest,
  ): Promise<AiProviderHttpResponse<T>> {
    const normalized =
      this.validateAndNormalize(
        request,
      );

    const controller =
      new AbortController();

    const startedAt =
      Date.now();

    let timer:
      ReturnType<typeof setTimeout> |
      undefined;

    try {
      timer =
        setTimeout(
          () =>
            controller.abort(),
          normalized.timeoutMs,
        );

      const response =
        await fetch(
          normalized.url,
          {
            method:
              normalized.method,
            headers:
              normalized.headers,
            body:
              normalized.body ===
              undefined
                ? undefined
                : JSON.stringify(
                    normalized.body,
                  ),
            signal:
              controller.signal,
          },
        );

      const headers =
        this.readHeaders(
          response.headers,
        );

      const rawBody =
        await response.text();

      if (!response.ok) {
        throw new AiProviderHttpTransportError({
          message:
            `AI provider HTTP request failed: ` +
            `${normalized.providerName}: ` +
            `${response.status}`,
          details: {
            providerName:
              normalized.providerName,
            code:
              'HTTP_STATUS_ERROR',
            retriable:
              this.isRetriableStatus(
                response.status,
              ),
            status:
              response.status,
          },
        });
      }

      const data =
        this.parseResponseBody<T>({
          providerName:
            normalized.providerName,
          contentType:
            headers[
              'content-type'
            ],
          rawBody,
        });

      return {
        providerName:
          normalized.providerName,
        status:
          response.status,
        ok:
          response.ok,
        headers,
        data,
        durationMs:
          Math.max(
            0,
            Date.now() -
              startedAt,
          ),
      };
    } catch (error) {
      if (
        error instanceof
        AiProviderHttpTransportError
      ) {
        throw error;
      }

      if (
        controller.signal
          .aborted ||
        this.isAbortError(
          error,
        )
      ) {
        throw new AiProviderHttpTransportError({
          message:
            `AI provider HTTP request timed out: ` +
            `${normalized.providerName}`,
          details: {
            providerName:
              normalized.providerName,
            code:
              'TIMEOUT',
            retriable:
              true,
            timeoutMs:
              normalized.timeoutMs,
          },
        });
      }

      throw new AiProviderHttpTransportError({
        message:
          `AI provider HTTP network request failed: ` +
          `${normalized.providerName}`,
        details: {
          providerName:
            normalized.providerName,
          code:
            'NETWORK_ERROR',
          retriable:
            true,
        },
      });
    } finally {
      if (timer) {
        clearTimeout(
          timer,
        );
      }
    }
  }

  private validateAndNormalize(
    request: AiProviderHttpRequest,
  ): AiProviderHttpRequest {
    const providerName =
      request.providerName
        ?.trim()
        .toLowerCase();

    if (!providerName) {
      this.throwInvalidRequest(
        'AI provider HTTP request requires a provider name',
        'unknown',
      );
    }

    const url =
      request.url
        ?.trim();

    if (
      !url ||
      !this.isValidHttpUrl(
        url,
      )
    ) {
      this.throwInvalidRequest(
        'AI provider HTTP request requires a valid HTTP or HTTPS URL',
        providerName,
      );
    }

    if (
      !Number.isInteger(
        request.timeoutMs,
      ) ||
      request.timeoutMs <= 0
    ) {
      this.throwInvalidRequest(
        'AI provider HTTP timeout must be a positive integer',
        providerName,
      );
    }

    const headers:
      Record<string, string> =
        {};

    for (
      const [
        name,
        value,
      ]
      of Object.entries(
        request.headers ??
          {},
      )
    ) {
      const normalizedName =
        name
          .trim()
          .toLowerCase();

      if (
        !normalizedName
      ) {
        this.throwInvalidRequest(
          'AI provider HTTP header name cannot be empty',
          providerName,
        );
      }

      headers[
        normalizedName
      ] =
        value;
    }

    if (
      request.body !==
        undefined &&
      !headers[
        'content-type'
      ]
    ) {
      headers[
        'content-type'
      ] =
        'application/json';
    }

    return {
      providerName,
      url,
      method:
        request.method,
      headers,
      body:
        request.body,
      timeoutMs:
        request.timeoutMs,
    };
  }

  private parseResponseBody<T>(
    options: {
      providerName: string;
      contentType?: string;
      rawBody: string;
    },
  ): T {
    if (
      !options.rawBody
    ) {
      return undefined as T;
    }

    if (
      !this.isJsonContentType(
        options.contentType,
      )
    ) {
      return options
        .rawBody as T;
    }

    try {
      return JSON.parse(
        options.rawBody,
      ) as T;
    } catch {
      throw new AiProviderHttpTransportError({
        message:
          `AI provider returned invalid JSON: ` +
          `${options.providerName}`,
        details: {
          providerName:
            options.providerName,
          code:
            'INVALID_JSON_RESPONSE',
          retriable:
            false,
        },
      });
    }
  }

  private readHeaders(
    source: Headers,
  ): Record<string, string> {
    const headers:
      Record<string, string> =
        {};

    source.forEach(
      (
        value,
        name,
      ) => {
        headers[
          name.toLowerCase()
        ] =
          value;
      },
    );

    return headers;
  }

  private isJsonContentType(
    contentType?: string,
  ): boolean {
    return Boolean(
      contentType &&
      (
        contentType.includes(
          'application/json',
        ) ||
        contentType.includes(
          '+json',
        )
      ),
    );
  }

  private isValidHttpUrl(
    value: string,
  ): boolean {
    try {
      const parsed =
        new URL(
          value,
        );

      return (
        parsed.protocol ===
          'https:' ||
        parsed.protocol ===
          'http:'
      );
    } catch {
      return false;
    }
  }

  private isRetriableStatus(
    status: number,
  ): boolean {
    return (
      status === 408 ||
      status === 409 ||
      status === 425 ||
      status === 429 ||
      status >= 500
    );
  }

  private isAbortError(
    error: unknown,
  ): boolean {
    return (
      error instanceof
        Error &&
      error.name ===
        'AbortError'
    );
  }

  private throwInvalidRequest(
    message: string,
    providerName: string,
  ): never {
    throw new AiProviderHttpTransportError({
      message,
      details: {
        providerName,
        code:
          'INVALID_REQUEST',
        retriable:
          false,
      },
    });
  }
}
