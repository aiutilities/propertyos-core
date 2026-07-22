import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  Permissions,
} from '../../auth/constants/permissions';
import {
  CurrentUser,
} from '../../auth/decorators/current-user.decorator';
import {
  AuthTokenPayload,
} from '../../auth/services/auth.service';
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
  AiToolRuntimeContextService,
} from '../tools/runtime/ai-tool-runtime-context.service';
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
    private readonly toolRuntimeContext:
      AiToolRuntimeContextService,
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
  async orchestrate(
    @Body() dto: OrchestrateAiRequestDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    const correlationId =
      dto.correlationId?.trim() ||
      randomUUID();

    const toolContext =
      await this.toolRuntimeContext.create({
        user,
        correlationId,
      });

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
        correlationId,
        toolContext,
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
