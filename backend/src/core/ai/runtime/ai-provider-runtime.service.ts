import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  AiProviderRuntimeConfigurationService,
} from '../configuration/ai-provider-runtime-configuration.service';
import {
  AI_PROVIDER_CREDENTIAL_RESOLVER,
  AiProviderCredentialResolver,
} from '../contracts/ai-provider-credential-resolver.contract';
import {
  AI_PROVIDER_HTTP_TRANSPORT,
  AiProviderHttpTransport,
} from '../contracts/ai-provider-http-transport.contract';
import {
  AiProviderRuntimeError,
} from '../errors/ai-provider-runtime.error';
import {
  AiProviderRuntimeConfiguration,
} from '../types/ai-provider-runtime-configuration.types';
import {
  AiProviderPreparedRuntime,
  AiProviderRuntimeExecutionRequest,
  AiProviderRuntimeExecutionResult,
} from '../types/ai-provider-runtime.types';

@Injectable()
export class AiProviderRuntimeService {
  constructor(
    private readonly configurationService:
      AiProviderRuntimeConfigurationService,

    @Inject(
      AI_PROVIDER_CREDENTIAL_RESOLVER,
    )
    private readonly credentialResolver:
      AiProviderCredentialResolver,

    @Inject(
      AI_PROVIDER_HTTP_TRANSPORT,
    )
    private readonly httpTransport:
      AiProviderHttpTransport,
  ) {}

  prepare(
    configuration:
      AiProviderRuntimeConfiguration,
  ): AiProviderPreparedRuntime {
    const report =
      this.configurationService
        .validate([
          configuration,
        ]);

    const normalized =
      report.configurations[0];

    const providerName =
      normalized
        ?.providerName ||
      configuration
        .providerName
        .trim()
        .toLowerCase() ||
      'unknown';

    if (
      !report.valid ||
      !normalized
    ) {
      throw new AiProviderRuntimeError({
        providerName,
        code:
          'CONFIGURATION_INVALID',
        message:
          `AI provider runtime configuration is invalid: ` +
          `${providerName}`,
      });
    }

    if (
      !normalized.enabled
    ) {
      throw new AiProviderRuntimeError({
        providerName,
        code:
          'PROVIDER_DISABLED',
        message:
          `AI provider runtime is disabled: ` +
          `${providerName}`,
      });
    }

    if (
      normalized
        .liveExecutionAuthorized
    ) {
      throw new AiProviderRuntimeError({
        providerName,
        code:
          'LIVE_EXECUTION_BLOCKED',
        message:
          `Live AI provider execution remains blocked: ` +
          `${providerName}`,
      });
    }

    if (
      !normalized.baseUrl
    ) {
      throw new AiProviderRuntimeError({
        providerName,
        code:
          'BASE_URL_MISSING',
        message:
          `AI provider runtime requires a base URL: ` +
          `${providerName}`,
      });
    }

    let resolution:
      ReturnType<
        AiProviderCredentialResolver[
          'assertResolved'
        ]
      >;

    try {
      resolution =
        this.credentialResolver
          .assertResolved({
            providerName,
            reference:
              normalized.credential,
          });
    } catch {
      throw new AiProviderRuntimeError({
        providerName,
        code:
          'CREDENTIAL_UNAVAILABLE',
        message:
          `AI provider credential is unavailable: ` +
          `${providerName}`,
      });
    }

    if (
      !resolution.credential
    ) {
      throw new AiProviderRuntimeError({
        providerName,
        code:
          'CREDENTIAL_UNAVAILABLE',
        message:
          `AI provider credential is unavailable: ` +
          `${providerName}`,
      });
    }

    return {
      providerName,
      configuration:
        this.copyConfiguration(
          normalized,
        ),
      credential: {
        value:
          resolution
            .credential
            .value,
        source:
          resolution
            .credential
            .source,
        variableName:
          resolution
            .credential
            .variableName,
      },
    };
  }

  async execute<T = unknown>(
    request:
      AiProviderRuntimeExecutionRequest,
  ): Promise<
    AiProviderRuntimeExecutionResult<T>
  > {
    const runtime =
      this.prepare(
        request.configuration,
      );

    const path =
      request.path.trim();

    if (
      !path ||
      this.isAbsoluteUrl(
        path,
      )
    ) {
      throw new AiProviderRuntimeError({
        providerName:
          runtime.providerName,
        code:
          'INVALID_PATH',
        message:
          `AI provider runtime requires a relative request path: ` +
          `${runtime.providerName}`,
      });
    }

    let credentialHeaders:
      Record<string, string>;

    try {
      credentialHeaders =
        request
          .createCredentialHeaders(
            runtime
              .credential
              .value,
          );
    } catch {
      throw new AiProviderRuntimeError({
        providerName:
          runtime.providerName,
        code:
          'INVALID_CREDENTIAL_HEADERS',
        message:
          `AI provider credential headers could not be created: ` +
          `${runtime.providerName}`,
      });
    }

    if (
      !credentialHeaders ||
      typeof credentialHeaders !==
        'object' ||
      Array.isArray(
        credentialHeaders,
      )
    ) {
      throw new AiProviderRuntimeError({
        providerName:
          runtime.providerName,
        code:
          'INVALID_CREDENTIAL_HEADERS',
        message:
          `AI provider credential headers are invalid: ` +
          `${runtime.providerName}`,
      });
    }

    const response =
      await this.httpTransport
        .execute<T>({
          providerName:
            runtime.providerName,
          url:
            this.joinUrl(
              runtime
                .configuration
                .baseUrl as string,
              path,
            ),
          method:
            request.method,
          headers: {
            ...request.headers,
            ...credentialHeaders,
          },
          body:
            request.body,
          timeoutMs:
            runtime
              .configuration
              .timeoutMs,
        });

    return {
      providerName:
        runtime.providerName,
      model:
        runtime
          .configuration
          .defaultModel,
      attempt:
        1,
      response,
    };
  }

  private joinUrl(
    baseUrl: string,
    path: string,
  ): string {
    return (
      baseUrl.replace(
        /\/+$/,
        '',
      ) +
      '/' +
      path.replace(
        /^\/+/,
        '',
      )
    );
  }

  private isAbsoluteUrl(
    value: string,
  ): boolean {
    try {
      const parsed =
        new URL(value);

      return (
        parsed.protocol ===
          'http:' ||
        parsed.protocol ===
          'https:'
      );
    } catch {
      return false;
    }
  }

  private copyConfiguration(
    configuration:
      AiProviderRuntimeConfiguration,
  ): AiProviderRuntimeConfiguration {
    return {
      ...configuration,
      credential: {
        ...configuration
          .credential,
      },
      metadata:
        configuration.metadata
          ? {
              ...configuration
                .metadata,
            }
          : undefined,
    };
  }
}
