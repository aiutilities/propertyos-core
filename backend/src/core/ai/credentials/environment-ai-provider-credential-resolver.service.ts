import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderCredentialResolver,
} from '../contracts/ai-provider-credential-resolver.contract';
import {
  AiProviderCredentialResolutionResult,
} from '../types/ai-provider-credential.types';
import {
  AiProviderCredentialReference,
} from '../types/ai-provider-runtime-configuration.types';

@Injectable()
export class EnvironmentAiProviderCredentialResolverService
  implements AiProviderCredentialResolver
{
  resolve(options: {
    providerName: string;
    reference: AiProviderCredentialReference;
  }): AiProviderCredentialResolutionResult {
    const providerName =
      options.providerName
        .trim()
        .toLowerCase();

    const variableName =
      options.reference
        .variableName
        .trim();

    const rawValue =
      process.env[
        variableName
      ];

    if (
      rawValue ===
      undefined
    ) {
      return {
        report: {
          providerName,
          source:
            options
              .reference
              .source,
          variableName,
          status:
            'MISSING',
          present:
            false,
        },
      };
    }

    const value =
      rawValue.trim();

    if (!value) {
      return {
        report: {
          providerName,
          source:
            options
              .reference
              .source,
          variableName,
          status:
            'BLANK',
          present:
            false,
        },
      };
    }

    return {
      credential: {
        providerName,
        value,
        source:
          options
            .reference
            .source,
        variableName,
      },
      report: {
        providerName,
        source:
          options
            .reference
            .source,
        variableName,
        status:
          'RESOLVED',
        present:
          true,
        maskedValue:
          this.mask(
            value,
          ),
      },
    };
  }

  assertResolved(options: {
    providerName: string;
    reference: AiProviderCredentialReference;
  }): AiProviderCredentialResolutionResult {
    const result =
      this.resolve(
        options,
      );

    if (
      !result
        .credential
    ) {
      throw new Error(
        `AI provider credential resolution failed: ` +
        `${result.report.providerName}: ` +
        `${result.report.variableName}: ` +
        `${result.report.status}`,
      );
    }

    return result;
  }

  private mask(
    value: string,
  ): string {
    if (
      value.length <= 4
    ) {
      return '*'.repeat(
        value.length,
      );
    }

    return (
      '*'.repeat(
        Math.max(
          4,
          value.length - 4,
        ),
      ) +
      value.slice(-4)
    );
  }
}
