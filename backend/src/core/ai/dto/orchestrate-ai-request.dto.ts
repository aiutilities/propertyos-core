import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AiCapability } from '../types/ai.types';
import {
  AiDataClassification,
  AiExecutionMode,
} from '../types/ai-orchestration.types';

export class AiOrchestrationMessageDto {
  @IsIn([
    'system',
    'user',
    'assistant',
  ])
  role!: 'system' | 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class AiTokenBudgetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxInputTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxOutputTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTotalTokens?: number;
}

export class AiCostBudgetDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  maxEstimatedCostMinor?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class OrchestrateAiRequestDto {
  @IsString()
  tenantId!: string;

  @IsIn([
    'CHAT',
    'TEXT_GENERATION',
    'CLASSIFICATION',
    'SUMMARIZATION',
    'EXTRACTION',
  ])
  capability!: AiCapability;

  @IsIn([
    'SIMULATED',
    'ISOLATED',
    'LIVE',
  ])
  executionMode!: AiExecutionMode;

  @IsIn([
    'PUBLIC',
    'INTERNAL',
    'CONFIDENTIAL',
    'RESTRICTED',
  ])
  dataClassification!: AiDataClassification;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AiOrchestrationMessageDto)
  messages!: AiOrchestrationMessageDto[];

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokens?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiTokenBudgetDto)
  tokenBudget?: AiTokenBudgetDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiCostBudgetDto)
  costBudget?: AiCostBudgetDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  fallbackProviderNames?: string[];

  @IsOptional()
  @IsString()
  humanApprovalReference?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120_000)
  timeoutMs?: number;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
