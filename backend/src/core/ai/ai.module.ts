import { Module } from "@nestjs/common";
import { AiContextAssemblyService } from "./context/ai-context-assembly.service";
import { AiTokenBudgetService } from "./tokenization/ai-token-budget.service";
import { AiConversationSessionService } from "./conversations/ai-conversation-session.service";
import { AiProviderFailoverService } from "./resilience/ai-provider-failover.service";
import { AiProviderSelectionService } from "./routing/ai-provider-selection.service";
import { AiProviderSimulationService } from "./simulation/ai-provider-simulation.service";
import { AiProviderActivationBoundaryService } from "./activation/ai-provider-activation-boundary.service";
import { AiProviderRuntimeService } from "./runtime/ai-provider-runtime.service";
import { OpenAiCompatibleProtocolService } from "./protocols/openai-compatible/openai-compatible-protocol.service";
import { AnthropicMessagesProtocolService } from "./protocols/anthropic-messages/anthropic-messages-protocol.service";
import { OpenAiProvider } from "./providers/openai/openai-ai.provider";
import { DeepSeekAiProvider } from "./providers/deepseek/deepseek-ai.provider";
import { QwenAiProvider } from "./providers/qwen/qwen-ai.provider";
import { ClaudeAiProvider } from "./providers/claude/claude-ai.provider";
import { FetchAiProviderHttpTransportService } from "./transport/fetch-ai-provider-http-transport.service";
import { AI_PROVIDER_HTTP_TRANSPORT } from "./contracts/ai-provider-http-transport.contract";
import { EnvironmentAiProviderCredentialResolverService } from "./credentials/environment-ai-provider-credential-resolver.service";
import { AI_PROVIDER_CREDENTIAL_RESOLVER } from "./contracts/ai-provider-credential-resolver.contract";
import { AiProviderRuntimeConfigurationService } from "./configuration/ai-provider-runtime-configuration.service";
import { DiscoveryModule } from "@nestjs/core";
import { EventBusModule } from "../eventbus/eventbus.module";
import { AuthModule } from "../auth/auth.module";
import { AiController } from "./controllers/ai.controller";
import { AiProviderDiscoveryService } from "./discovery/ai-provider-discovery.service";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { AiProviderRegistry } from "./registry/ai-provider.registry";
import { AiProviderRegistrationBootstrapService } from "./registration/ai-provider-registration-bootstrap.service";
import { AiProviderRegistrationService } from "./registration/ai-provider-registration.service";
import { AiService } from "./services/ai.service";
import { AiOrchestrationEvidenceService } from "./services/ai-orchestration-evidence.service";
import { AiOrchestratorService } from "./services/ai-orchestrator.service";
import { AiRoutingPolicyService } from "./services/ai-routing-policy.service";
import { AiRequestPreparationService } from "./request/ai-request-preparation.service";
import { AiPreparedRequestDispatchBoundaryService } from "./dispatch/ai-prepared-request-dispatch-boundary.service";
import { AiDispatchExecutionCoordinatorService } from "./dispatch/ai-dispatch-execution-coordinator.service";
import { AiExecutionContextService } from "./execution/ai-execution-context.service";
import { PropertyOsAiSdkService } from "./sdk/propertyos-ai-sdk.service";
import { AiToolManifestValidator } from "./tools/manifest/ai-tool-manifest.validator";
import { AiToolExecutionService } from "./tools/execution/ai-tool-execution.service";
import { AiToolCallCoordinatorService } from "./tools/orchestration/ai-tool-call-coordinator.service";
import { AiToolInteractionProjectionService } from "./tools/orchestration/ai-tool-interaction-projection.service";
import { AiToolContinuationBoundaryService } from "./tools/orchestration/ai-tool-continuation-boundary.service";
import { AiToolContinuationDispatchService } from "./tools/orchestration/ai-tool-continuation-dispatch.service";
import { AiToolContinuationExecutionService } from "./tools/orchestration/ai-tool-continuation-execution.service";
import { AiToolContinuationCoordinatorService } from "./tools/orchestration/ai-tool-continuation-coordinator.service";
import { AiToolOrchestrationDecisionService } from "./tools/orchestration/ai-tool-orchestration-decision.service";
import { AiToolRegistry } from "./tools/registry/ai-tool.registry";

@Module({
  imports: [DiscoveryModule, EventBusModule, AuthModule],
  controllers: [AiController],
  providers: [
    AiContextAssemblyService,
    AiTokenBudgetService,
    {
      provide: AiConversationSessionService,
      useFactory: () => new AiConversationSessionService(),
    },
    AiProviderFailoverService,
    AiProviderSelectionService,
    AiProviderSimulationService,
    AiProviderActivationBoundaryService,
    OpenAiCompatibleProtocolService,
    AnthropicMessagesProtocolService,
    AiProviderRuntimeService,
    FetchAiProviderHttpTransportService,
    {
      provide: AI_PROVIDER_HTTP_TRANSPORT,
      useExisting: FetchAiProviderHttpTransportService,
    },
    EnvironmentAiProviderCredentialResolverService,
    {
      provide: AI_PROVIDER_CREDENTIAL_RESOLVER,
      useExisting: EnvironmentAiProviderCredentialResolverService,
    },
    AiProviderRuntimeConfigurationService,
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    AiProviderDiscoveryService,
    AiProviderRegistrationService,
    AiProviderRegistrationBootstrapService,
    MockAiProvider,
    OpenAiProvider,
    DeepSeekAiProvider,
    QwenAiProvider,
    ClaudeAiProvider,
    AiOrchestrationEvidenceService,
    AiRequestPreparationService,
    AiPreparedRequestDispatchBoundaryService,
    AiDispatchExecutionCoordinatorService,
    AiExecutionContextService,
    PropertyOsAiSdkService,
    AiToolManifestValidator,
    AiToolExecutionService,
    AiToolCallCoordinatorService,
    AiToolInteractionProjectionService,
    AiToolContinuationBoundaryService,
    AiToolContinuationDispatchService,
    AiToolContinuationExecutionService,
    AiToolContinuationCoordinatorService,
    AiToolOrchestrationDecisionService,
    AiToolRegistry,
  ],
  exports: [
    AiContextAssemblyService,
    AiTokenBudgetService,
    AiConversationSessionService,
    AiProviderFailoverService,
    AiProviderSelectionService,
    AiProviderSimulationService,
    AiProviderActivationBoundaryService,
    OpenAiCompatibleProtocolService,
    AiProviderRuntimeService,
    FetchAiProviderHttpTransportService,
    AI_PROVIDER_HTTP_TRANSPORT,
    EnvironmentAiProviderCredentialResolverService,
    AI_PROVIDER_CREDENTIAL_RESOLVER,
    AiProviderRuntimeConfigurationService,
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    AiProviderDiscoveryService,
    AiProviderRegistrationService,
    AiOrchestrationEvidenceService,
    AiRequestPreparationService,
    AiPreparedRequestDispatchBoundaryService,
    AiDispatchExecutionCoordinatorService,
    AiExecutionContextService,
    PropertyOsAiSdkService,
    AiToolRegistry,
    AiToolExecutionService,

    AiToolCallCoordinatorService,
    AiToolInteractionProjectionService,
    AiToolContinuationBoundaryService,
    AiToolContinuationDispatchService,
    AiToolContinuationExecutionService,
    AiToolContinuationCoordinatorService,
    AiToolOrchestrationDecisionService,
  ],
})
export class AiModule {}
