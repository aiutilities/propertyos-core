import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderRuntimeConfiguration,
  AiProviderRuntimeConfigurationReport,
  AiProviderRuntimeConfigurationValidationError,
} from '../types/ai-provider-runtime-configuration.types';

@Injectable()
export class AiProviderRuntimeConfigurationService {
  validate(
    configurations:
      readonly AiProviderRuntimeConfiguration[],
  ): AiProviderRuntimeConfigurationReport {
    const normalized =
      configurations
        .map(
          (configuration) =>
            this.normalize(
              configuration,
            ),
        )
        .sort(
          (left, right) =>
            left.priority -
              right.priority ||
            left.providerName.localeCompare(
              right.providerName,
            ),
        );

    const errors:
      AiProviderRuntimeConfigurationValidationError[] =
        [];

    const providerNames =
      new Set<string>();

    for (
      const configuration
      of normalized
    ) {
      this.validateConfiguration(
        configuration,
        errors,
      );

      if (
        configuration.providerName &&
        providerNames.has(
          configuration.providerName,
        )
      ) {
        errors.push({
          providerName:
            configuration.providerName,
          code:
            'DUPLICATE_PROVIDER_NAME',
          message:
            `Duplicate AI provider runtime configuration: ` +
            `${configuration.providerName}`,
        });
      }

      if (
        configuration.providerName
      ) {
        providerNames.add(
          configuration.providerName,
        );
      }
    }

    return {
      valid:
        errors.length === 0,
      configurations:
        normalized.map(
          (configuration) =>
            this.copyConfiguration(
              configuration,
            ),
        ),
      errors:
        errors.map(
          (error) => ({
            ...error,
          }),
        ),
    };
  }

  assertValid(
    configurations:
      readonly AiProviderRuntimeConfiguration[],
  ): AiProviderRuntimeConfiguration[] {
    const report =
      this.validate(
        configurations,
      );

    if (!report.valid) {
      throw new Error(
        report.errors
          .map(
            (error) =>
              `${error.code}: ${error.message}`,
          )
          .join('; '),
      );
    }

    return report.configurations;
  }

  private normalize(
    configuration:
      AiProviderRuntimeConfiguration,
  ): AiProviderRuntimeConfiguration {
    return {
      ...configuration,
      providerName:
        configuration
          .providerName
          .trim()
          .toLowerCase(),
      defaultModel:
        configuration
          .defaultModel
          ?.trim() ||
        undefined,
      baseUrl:
        configuration
          .baseUrl
          ?.trim() ||
        undefined,
      credential: {
        source:
          configuration
            .credential
            .source,
        variableName:
          configuration
            .credential
            .variableName
            .trim(),
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

  private validateConfiguration(
    configuration:
      AiProviderRuntimeConfiguration,
    errors:
      AiProviderRuntimeConfigurationValidationError[],
  ): void {
    const providerName =
      configuration.providerName ||
      undefined;

    if (!providerName) {
      errors.push({
        code:
          'EMPTY_PROVIDER_NAME',
        message:
          'AI provider runtime configuration requires a provider name',
      });
    }

    if (
      !Number.isInteger(
        configuration.priority,
      ) ||
      configuration.priority < 0
    ) {
      errors.push({
        providerName,
        code:
          'INVALID_PRIORITY',
        message:
          'AI provider priority must be a non-negative integer',
      });
    }

    if (
      !Number.isInteger(
        configuration.timeoutMs,
      ) ||
      configuration.timeoutMs <= 0
    ) {
      errors.push({
        providerName,
        code:
          'INVALID_TIMEOUT',
        message:
          'AI provider timeout must be a positive integer',
      });
    }

    if (
      !Number.isInteger(
        configuration.maxRetries,
      ) ||
      configuration.maxRetries < 0
    ) {
      errors.push({
        providerName,
        code:
          'INVALID_MAX_RETRIES',
        message:
          'AI provider maxRetries must be a non-negative integer',
      });
    }

    const variableName =
      configuration
        .credential
        .variableName;

    if (!variableName) {
      errors.push({
        providerName,
        code:
          'EMPTY_CREDENTIAL_VARIABLE',
        message:
          'AI provider configuration requires a credential variable name',
      });
    } else if (
      !/^[A-Z][A-Z0-9_]*$/
        .test(
          variableName,
        )
    ) {
      errors.push({
        providerName,
        code:
          'INVALID_CREDENTIAL_VARIABLE',
        message:
          `Invalid AI credential environment variable name: ` +
          `${variableName}`,
      });
    }

    if (
      configuration.baseUrl &&
      !this.isValidHttpUrl(
        configuration.baseUrl,
      )
    ) {
      errors.push({
        providerName,
        code:
          'INVALID_BASE_URL',
        message:
          `Invalid AI provider base URL: ` +
          `${configuration.baseUrl}`,
      });
    }

    if (
      configuration
        .liveExecutionAuthorized
    ) {
      errors.push({
        providerName,
        code:
          'LIVE_EXECUTION_NOT_AUTHORIZED',
        message:
          'Live AI provider execution remains blocked pending explicit Phase 16B6 authorization',
      });
    }
  }

  private isValidHttpUrl(
    value: string,
  ): boolean {
    try {
      const parsed =
        new URL(value);

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
