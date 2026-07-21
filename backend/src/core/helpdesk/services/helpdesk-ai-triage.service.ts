import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  PropertyOsAiSdkService,
} from '../../ai';
import {
  TriageHelpdeskTicketDto,
} from '../dto/triage-helpdesk-ticket.dto';
import {
  HelpdeskAiTriageResult,
} from '../types/helpdesk-ai.types';
import {
  HelpdeskPriority,
} from '../types/helpdesk.types';
import {
  HelpdeskAiPolicyService,
} from './helpdesk-ai-policy.service';

interface AiTriagePayload {
  suggestedPriority?: unknown;
  suggestedCategory?: unknown;
  summary?: unknown;
  confidence?: unknown;
  reasons?: unknown;
}

@Injectable()
export class HelpdeskAiTriageService {
  constructor(
    private readonly aiSdk:
      PropertyOsAiSdkService,
    private readonly policy:
      HelpdeskAiPolicyService,
  ) {}

  async triage(
    dto: TriageHelpdeskTicketDto,
  ): Promise<HelpdeskAiTriageResult> {
    this.requireText(dto.tenantId, 'tenantId');
    this.requireText(dto.title, 'title');
    this.requireText(
      dto.description,
      'description',
    );

    const policy =
      this.policy.resolve('TRIAGE');

    const result =
      await this.aiSdk.execute({
        tenantId: dto.tenantId.trim(),
        moduleId: 'helpdesk',
        capability: policy.capability,
        executionMode:
          policy.executionMode,
        dataClassification:
          policy.dataClassification,
        temperature:
          policy.temperature,
        maxTokens:
          policy.maxTokens,
        tokenBudget: {
          ...policy.tokenBudget,
        },
        providerName:
          policy.providerName,
        fallbackProviderNames: [
          ...policy
            .fallbackProviderNames,
        ],
        messages: [
          {
            role: 'system',
            content: this.systemPrompt(),
          },
          {
            role: 'user',
            content: JSON.stringify({
              title: dto.title.trim(),
              description:
                dto.description.trim(),
              categoryId:
                dto.categoryId?.trim() ||
                undefined,
              categoryName:
                dto.categoryName?.trim() ||
                undefined,
              currentPriority:
                dto.priority,
              channel: dto.channel,
            }),
          },
        ],
        metadata: {
          operation:
            'helpdesk_ticket_triage',
          advisoryOnly:
            policy.advisoryOnly,
        },
      });

    if (result.ok === false) {
      throw new BadGatewayException({
        code: result.error.code,
        message:
          'Helpdesk AI triage failed',
        retriable:
          result.error.retriable,
        correlationId:
          result.correlationId,
      });
    }

    const payload =
      this.parsePayload(result.content);

    return {
      ...payload,
      correlationId:
        result.correlationId,
      providerName:
        result.providerName,
      model: result.model,
    };
  }

  private systemPrompt(): string {
    return [
      'You are the PropertyOS Helpdesk triage assistant.',
      'Classify the supplied helpdesk request.',
      'Return JSON only without markdown.',
      'Use priority LOW, MEDIUM, HIGH, or CRITICAL.',
      'Return category, summary, confidence, and reasons.',
      'Confidence must be between 0 and 1.',
      'This is advisory only.',
    ].join('\n');
  }

  private parsePayload(
    content: string,
  ): Omit<
    HelpdeskAiTriageResult,
    | 'correlationId'
    | 'providerName'
    | 'model'
  > {
    let parsed: AiTriagePayload;

    try {
      parsed = JSON.parse(
        this.extractJson(content),
      ) as AiTriagePayload;
    } catch {
      throw new BadGatewayException(
        'AI triage returned invalid JSON',
      );
    }

    if (
      typeof parsed.suggestedPriority !==
        'string' ||
      !Object.values(
        HelpdeskPriority,
      ).includes(
        parsed.suggestedPriority as
          HelpdeskPriority,
      )
    ) {
      throw new BadGatewayException(
        'AI triage returned an invalid priority',
      );
    }

    if (
      typeof parsed.summary !== 'string' ||
      !parsed.summary.trim()
    ) {
      throw new BadGatewayException(
        'AI triage returned an invalid summary',
      );
    }

    if (
      typeof parsed.confidence !== 'number' ||
      !Number.isFinite(parsed.confidence) ||
      parsed.confidence < 0 ||
      parsed.confidence > 1
    ) {
      throw new BadGatewayException(
        'AI triage returned an invalid confidence',
      );
    }

    if (
      !Array.isArray(parsed.reasons) ||
      parsed.reasons.some(
        reason =>
          typeof reason !== 'string' ||
          !reason.trim(),
      )
    ) {
      throw new BadGatewayException(
        'AI triage returned invalid reasons',
      );
    }

    return {
      suggestedPriority:
        parsed.suggestedPriority as
          HelpdeskPriority,
      suggestedCategory:
        typeof parsed.suggestedCategory ===
          'string' &&
        parsed.suggestedCategory.trim()
          ? parsed.suggestedCategory.trim()
          : undefined,
      summary: parsed.summary.trim(),
      confidence: parsed.confidence,
      reasons: parsed.reasons.map(
        reason => reason.trim(),
      ),
    };
  }

  private extractJson(
    content: string,
  ): string {
    const trimmed = content.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');

    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }

    return trimmed;
  }

  private requireText(
    value: string | undefined,
    field: string,
  ): void {
    if (!value?.trim()) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }
  }
}
