import { Injectable } from '@nestjs/common';
import { AiProviderPort } from '../contracts/ai-provider.contract';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import {
  AiOrchestrationRequest,
  AiRoutingDecision,
} from '../types/ai-orchestration.types';

@Injectable()
export class AiRoutingPolicyService {
  constructor(private readonly registry: AiProviderRegistry) {}

  decide(request: AiOrchestrationRequest): AiRoutingDecision {
    this.validateRequest(request);

    if (request.executionMode === 'LIVE') {
      throw new Error(
        'Live AI provider execution is blocked pending explicit Phase 16 authorization',
      );
    }

    const provider = request.providerName
      ? this.getNamedProvider(request.providerName)
      : this.getDeterministicProvider(request);

    this.assertProviderEligible(provider, request);

    const fallbackProviderNames = this.resolveFallbackProviders(
      request,
      provider.name,
    );

    return {
      providerName: provider.name,
      model: request.model ?? provider.getProvider().defaultModel,
      capability: request.capability,
      executionMode: request.executionMode,
      tenantId: request.tenantId,
      fallbackProviderNames,
      liveExecutionAuthorized: false,
    };
  }

  private validateRequest(request: AiOrchestrationRequest): void {
    if (!request.tenantId?.trim()) {
      throw new Error('AI orchestration requires a tenantId');
    }

    if (!request.messages?.length) {
      throw new Error('AI orchestration requires at least one message');
    }

    if (
      request.tokenBudget?.maxTotalTokens !== undefined &&
      request.tokenBudget.maxTotalTokens <= 0
    ) {
      throw new Error('AI total-token budget must be greater than zero');
    }

    if (
      request.costBudget?.maxEstimatedCostMinor !== undefined &&
      request.costBudget.maxEstimatedCostMinor < 0
    ) {
      throw new Error('AI cost budget cannot be negative');
    }

    if (
      request.dataClassification === 'RESTRICTED' &&
      request.executionMode !== 'SIMULATED'
    ) {
      throw new Error(
        'Restricted data is limited to simulated AI execution during Phase 16A',
      );
    }
  }

  private getNamedProvider(name: string): AiProviderPort {
    const provider = this.registry.get(name);

    if (!provider) {
      throw new Error(`AI provider not found: ${name}`);
    }

    return provider;
  }

  private getDeterministicProvider(
    request: AiOrchestrationRequest,
  ): AiProviderPort {
    const provider = this.registry
      .list()
      .filter((candidate) => {
        const descriptor = candidate.getProvider();

        return (
          descriptor.status === 'ACTIVE' &&
          candidate.capabilities.includes(request.capability)
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name))[0];

    if (!provider) {
      throw new Error(
        `No active AI provider supports capability: ${request.capability}`,
      );
    }

    return provider;
  }

  private assertProviderEligible(
    provider: AiProviderPort,
    request: AiOrchestrationRequest,
  ): void {
    const descriptor = provider.getProvider();

    if (descriptor.status !== 'ACTIVE') {
      throw new Error(`AI provider is not active: ${provider.name}`);
    }

    if (!provider.capabilities.includes(request.capability)) {
      throw new Error(
        `AI provider ${provider.name} does not support capability ${request.capability}`,
      );
    }
  }

  private resolveFallbackProviders(
    request: AiOrchestrationRequest,
    selectedProviderName: string,
  ): string[] {
    const requestedFallbacks = request.fallbackProviderNames ?? [];

    return requestedFallbacks.filter((name, index, values) => {
      if (name === selectedProviderName || values.indexOf(name) !== index) {
        return false;
      }

      const provider = this.registry.get(name);

      return Boolean(
        provider &&
          provider.getProvider().status === 'ACTIVE' &&
          provider.capabilities.includes(request.capability),
      );
    });
  }
}
