import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  Permissions,
} from '../../auth/constants/permissions';
import {
  RequirePermission,
} from '../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';
import {
  OrchestrateAiRequestDto,
} from '../dto/orchestrate-ai-request.dto';
import {
  AiOrchestratorService,
} from '../services/ai-orchestrator.service';
import {
  AiService,
} from '../services/ai.service';
import {
  AiOrchestrationRequest,
} from '../types/ai-orchestration.types';

@ApiTags('AI')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly orchestrator:
      AiOrchestratorService,
  ) {}

  @Get('providers')
  @RequirePermission(
    Permissions.AI_EXECUTE,
  )
  listProviders() {
    return this.aiService.listProviders();
  }

  @Post('orchestrate')
  @RequirePermission(
    Permissions.AI_EXECUTE,
  )
  orchestrate(
    @Body() dto: OrchestrateAiRequestDto,
  ) {
    const request:
      AiOrchestrationRequest = {
        tenantId: dto.tenantId,
        capability: dto.capability,
        executionMode:
          dto.executionMode,
        dataClassification:
          dto.dataClassification,
        messages:
          dto.messages.map(
            (message) => ({
              role: message.role,
              content:
                message.content,
            }),
          ),
        providerName:
          dto.providerName,
        model: dto.model,
        temperature:
          dto.temperature,
        maxTokens:
          dto.maxTokens,
        tokenBudget:
          dto.tokenBudget
            ? {
                maxInputTokens:
                  dto.tokenBudget
                    .maxInputTokens,
                maxOutputTokens:
                  dto.tokenBudget
                    .maxOutputTokens,
                maxTotalTokens:
                  dto.tokenBudget
                    .maxTotalTokens,
              }
            : undefined,
        costBudget:
          dto.costBudget
            ? {
                maxEstimatedCostMinor:
                  dto.costBudget
                    .maxEstimatedCostMinor,
                currency:
                  dto.costBudget.currency,
              }
            : undefined,
        fallbackProviderNames:
          dto.fallbackProviderNames
            ? [
                ...dto
                  .fallbackProviderNames,
              ]
            : undefined,
        humanApprovalReference:
          dto.humanApprovalReference,
        timeoutMs:
          dto.timeoutMs,
        correlationId:
          dto.correlationId,
        metadata:
          dto.metadata
            ? {
                ...dto.metadata,
              }
            : undefined,
      };

    return this.orchestrator.execute(
      request,
    );
  }
}
