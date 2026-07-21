import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderActivationError,
} from '../errors/ai-provider-activation.error';
import {
  AiProviderActivationDenialCode,
  AiProviderActivationEvaluation,
  AiProviderActivationInput,
} from '../types/ai-provider-activation.types';

@Injectable()
export class AiProviderActivationBoundaryService {
  evaluate(
    input:
      AiProviderActivationInput,
  ): AiProviderActivationEvaluation {
    const providerName =
      input.configuration
        .providerName;

    const denialCodes:
      AiProviderActivationDenialCode[] = [];

    if (
      input.policy
        .globalEnabled !== true
    ) {
      denialCodes.push(
        'GLOBAL_AI_DISABLED',
      );
    }

    if (
      !input.policy
        .allowedEnvironments
        .includes(
          input.policy
            .environment,
        )
    ) {
      denialCodes.push(
        'ENVIRONMENT_NOT_ALLOWED',
      );
    }

    if (
      !input.policy
        .allowedProviders
        .includes(
          providerName,
        )
    ) {
      denialCodes.push(
        'PROVIDER_NOT_ALLOWED',
      );
    }

    if (
      input.configuration
        .enabled !== true
    ) {
      denialCodes.push(
        'PROVIDER_RUNTIME_DISABLED',
      );
    }

    if (
      input.configuration
        .liveExecutionAuthorized !==
      true
    ) {
      denialCodes.push(
        'LIVE_EXECUTION_NOT_AUTHORIZED',
      );
    }

    return {
      providerName,
      environment:
        input.policy
          .environment,
      authorized:
        denialCodes.length === 0,
      denialCodes,
      evaluatedAt:
        new Date()
          .toISOString(),
    };
  }

  assertAuthorized(
    input:
      AiProviderActivationInput,
  ): AiProviderActivationEvaluation {
    const evaluation =
      this.evaluate(
        input,
      );

    if (
      !evaluation.authorized
    ) {
      throw new AiProviderActivationError(
        evaluation,
      );
    }

    return evaluation;
  }
}
