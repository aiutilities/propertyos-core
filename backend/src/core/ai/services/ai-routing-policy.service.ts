import { Injectable } from '@nestjs/common';
import { AiProviderPort } from '../contracts/ai-provider.contract';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import {
  AiProviderSelectionCandidate,
} from '../types/ai-provider-selection.types';
import {
  AiOrchestrationRequest,
  AiRoutingDecision,
} from '../types/ai-orchestration.types';
import {
  AiProviderSelectionService,
} from '../routing/ai-provider-selection.service';

@Injectable()
export class AiRoutingPolicyService {
  constructor(
    private readonly registry: AiProviderRegistry,
    private readonly providerSelection:
      AiProviderSelectionService =
        new AiProviderSelectionService(),
  ) {}

  decide(request: AiOrchestrationRequest): AiRoutingDecision {
    this.validateRequest(request);

    if (request.executionMode === 'LIVE') {
      throw new Error(
        'Live AI provider execution is blocked pending explicit Phase 16 authorization',
      );
    }

    const provider = request.providerName
      ? this.getNamedProvider(request.providerName)
      : this.getSelectedProvider(request);

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

  private getSelectedProvider(
    request: AiOrchestrationRequest,
  ): AiProviderPort {
    const eligibleProviders = this.registry
      .list()
      .filter((candidate) => {
        const descriptor = candidate.getProvider();

        return (
          descriptor.status === 'ACTIVE' &&
          candidate.capabilities.includes(request.capability)
        );
      });

    if (eligibleProviders.length === 0) {
      throw new Error(
        `No active AI provider supports capability: ${request.capability}`,
      );
    }

    /*
     * Phase 16C2 establishes AiProviderSelectionService as the
     * canonical automatic-selection boundary.
     *
     * Runtime latency and pricing observations are not yet part of
     * the provider contract, so this adapter intentionally supplies
     * neutral values instead of inventing operational measurements.
     *
     * With equal neutral scores, AiProviderSelectionService applies
     * its deterministic provider-name/model tie-breaking contract,
     * preserving the previous routing behaviour.
     */
    const candidates: AiProviderSelectionCandidate[] =
      eligibleProviders.map((provider) => ({
        providerName: provider.name,
        model:
          provider.getProvider().defaultModel ??
          `${provider.name}-default`,
        enabled: true,
        availability: 'AVAILABLE',
        capabilities: [],
        estimatedLatencyMs: 0,
        estimatedCostPerMillionTokensUsd: 0,
        priority: 0,
      }));

    const selection = this.providerSelection.select({
      requiredCapabilities: [],
      candidates,
    });

    const provider = this.registry.get(
      selection.selectedProviderName,
    );

    if (!provider) {
      throw new Error(
        `AI provider selection resolved an unregistered provider: ${selection.selectedProviderName}`,
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
      if (
        name === selectedProviderName ||
        values.indexOf(name) !== index
      ) {
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
