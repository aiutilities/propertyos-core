import {
  Injectable,
} from '@nestjs/common';
import {
  createHash,
} from 'crypto';
import {
  AiProviderSimulationError,
} from '../errors/ai-provider-simulation.error';
import {
  AiProviderSimulationEvidence,
  AiProviderSimulationFailureCode,
  AiProviderSimulationRequest,
  AiProviderSimulationSuccess,
} from '../types/ai-provider-simulation.types';

@Injectable()
export class AiProviderSimulationService {
  async simulate(
    request:
      AiProviderSimulationRequest,
  ): Promise<AiProviderSimulationSuccess> {
    const normalized =
      this.normalizeRequest(
        request,
      );

    const simulationId =
      this.createSimulationId(
        normalized,
      );

    const startedAt =
      new Date()
        .toISOString();

    await this.applyLatency(
      normalized.latencyMs,
    );

    const completedAt =
      new Date()
        .toISOString();

    const failureCode =
      this.resolveFailureCode(
        normalized.scenario,
      );

    if (
      failureCode
    ) {
      const evidence =
        this.createEvidence({
          ...normalized,
          simulationId,
          startedAt,
          completedAt,
          outcome:
            'FAILED',
          failureCode,
        });

      throw new AiProviderSimulationError(
        failureCode,
        this.createFailureMessage(
          normalized.providerName,
          failureCode,
        ),
        evidence,
      );
    }

    const evidence =
      this.createEvidence({
        ...normalized,
        simulationId,
        startedAt,
        completedAt,
        outcome:
          'SUCCEEDED',
      });

    return {
      simulationId,
      providerName:
        normalized.providerName,
      model:
        normalized.model,
      text:
        normalized.responseText,
      simulated:
        true,
      evidence,
    };
  }

  private normalizeRequest(
    request:
      AiProviderSimulationRequest,
  ): Required<
    AiProviderSimulationRequest
  > {
    const providerName =
      request.providerName
        .trim();

    const model =
      request.model
        .trim();

    const prompt =
      request.prompt;

    if (
      providerName.length === 0
    ) {
      throw new Error(
        'Simulation provider name is required',
      );
    }

    if (
      model.length === 0
    ) {
      throw new Error(
        'Simulation model is required',
      );
    }

    if (
      prompt.trim().length === 0
    ) {
      throw new Error(
        'Simulation prompt is required',
      );
    }

    const latencyMs =
      request.latencyMs ?? 0;

    if (
      !Number.isInteger(
        latencyMs,
      ) ||
      latencyMs < 0 ||
      latencyMs > 5_000
    ) {
      throw new Error(
        'Simulation latency must be an integer between 0 and 5000 milliseconds',
      );
    }

    return {
      providerName,
      model,
      prompt,
      scenario:
        request.scenario,
      latencyMs,
      responseText:
        request.responseText ??
        `Simulated response from ${providerName}`,
    };
  }

  private createSimulationId(
    request:
      Required<
        AiProviderSimulationRequest
      >,
  ): string {
    const digest =
      createHash(
        'sha256',
      )
        .update(
          JSON.stringify({
            providerName:
              request.providerName,
            model:
              request.model,
            prompt:
              request.prompt,
            scenario:
              request.scenario,
            latencyMs:
              request.latencyMs,
            responseText:
              request.responseText,
          }),
        )
        .digest(
          'hex',
        )
        .slice(
          0,
          24,
        );

    return `sim_${digest}`;
  }

  private resolveFailureCode(
    scenario:
      AiProviderSimulationRequest[
        'scenario'
      ],
  ):
    | AiProviderSimulationFailureCode
    | undefined {
    switch (
      scenario
    ) {
      case 'SUCCESS':
        return undefined;

      case 'TIMEOUT':
        return 'AI_PROVIDER_SIMULATED_TIMEOUT';

      case 'RATE_LIMIT':
        return 'AI_PROVIDER_SIMULATED_RATE_LIMIT';

      case 'MALFORMED_RESPONSE':
        return 'AI_PROVIDER_SIMULATED_MALFORMED_RESPONSE';

      case 'PROVIDER_OUTAGE':
        return 'AI_PROVIDER_SIMULATED_OUTAGE';
    }
  }

  private createFailureMessage(
    providerName:
      string,
    failureCode:
      AiProviderSimulationFailureCode,
  ): string {
    return [
      `Simulated AI provider failure for ${providerName}`,
      failureCode,
    ].join(
      ': ',
    );
  }

  private createEvidence(
    input:
      Required<
        AiProviderSimulationRequest
      > & {
        simulationId:
          string;
        startedAt:
          string;
        completedAt:
          string;
        outcome:
          'SUCCEEDED' | 'FAILED';
        failureCode?:
          AiProviderSimulationFailureCode;
      },
  ): AiProviderSimulationEvidence {
    return {
      simulationId:
        input.simulationId,
      providerName:
        input.providerName,
      model:
        input.model,
      scenario:
        input.scenario,
      promptLength:
        input.prompt.length,
      latencyMs:
        input.latencyMs,
      startedAt:
        input.startedAt,
      completedAt:
        input.completedAt,
      outcome:
        input.outcome,
      ...(input.failureCode
        ? {
            failureCode:
              input.failureCode,
          }
        : {}),
    };
  }

  private async applyLatency(
    latencyMs:
      number,
  ): Promise<void> {
    if (
      latencyMs === 0
    ) {
      return;
    }

    await new Promise<void>(
      (
        resolve,
      ) => {
        setTimeout(
          resolve,
          latencyMs,
        );
      },
    );
  }
}
