import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  PropertyOsAiSdkService,
} from '../../ai';
import {
  DraftHelpdeskReplyDto,
} from '../dto/draft-helpdesk-reply.dto';
import {
  HelpdeskAiReplySuggestion,
} from '../types/helpdesk-ai-reply.types';

interface AiReplyPayload {
  subject?: unknown;
  reply?: unknown;
  confidence?: unknown;
  tone?: unknown;
}

type HelpdeskAiReplyTone =
  HelpdeskAiReplySuggestion['tone'];

@Injectable()
export class HelpdeskAiReplyService {
  constructor(
    private readonly aiSdk:
      PropertyOsAiSdkService,
  ) {}

  async draftReply(
    dto: DraftHelpdeskReplyDto,
  ): Promise<HelpdeskAiReplySuggestion> {
    this.requireText(dto.tenantId, 'tenantId');
    this.requireText(dto.ticketId, 'ticketId');
    this.requireText(dto.subject, 'subject');
    this.requireText(
      dto.customerMessage,
      'customerMessage',
    );

    const result =
      await this.aiSdk.execute({
        tenantId: dto.tenantId.trim(),
        moduleId: 'helpdesk',
        capability: 'TEXT_GENERATION',
        executionMode: 'SIMULATED',
        dataClassification: 'INTERNAL',
        temperature: 0.2,
        maxTokens: 700,
        tokenBudget: {
          maxOutputTokens: 700,
        },
        messages: [
          {
            role: 'system',
            content: this.systemPrompt(),
          },
          {
            role: 'user',
            content: JSON.stringify({
              ticketId: dto.ticketId.trim(),
              subject: dto.subject.trim(),
              customerMessage:
                dto.customerMessage.trim(),
              internalNotes:
                dto.internalNotes?.trim() ||
                undefined,
            }),
          },
        ],
        metadata: {
          operation:
            'helpdesk_reply_drafting',
          advisoryOnly: true,
        },
      });

    if (result.ok === false) {
      throw new BadGatewayException({
        code: result.error.code,
        message:
          'Helpdesk AI reply drafting failed',
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
      'You are the PropertyOS Helpdesk reply assistant.',
      'Draft a reply to the supplied customer message.',
      'Return JSON only without markdown.',
      'Return subject, reply, confidence, and tone.',
      'Tone must be professional, friendly, or empathetic.',
      'Confidence must be between 0 and 1.',
      'Do not claim an action was completed unless supplied in the internal notes.',
      'Do not invent dates, costs, approvals, or resolution commitments.',
      'This is advisory only and must be reviewed before sending.',
    ].join('\n');
  }

  private parsePayload(
    content: string,
  ): Omit<
    HelpdeskAiReplySuggestion,
    | 'correlationId'
    | 'providerName'
    | 'model'
  > {
    let parsed: AiReplyPayload;

    try {
      parsed = JSON.parse(
        this.extractJson(content),
      ) as AiReplyPayload;
    } catch {
      throw new BadGatewayException(
        'AI reply drafting returned invalid JSON',
      );
    }

    if (
      typeof parsed.subject !== 'string' ||
      !parsed.subject.trim()
    ) {
      throw new BadGatewayException(
        'AI reply drafting returned an invalid subject',
      );
    }

    if (
      typeof parsed.reply !== 'string' ||
      !parsed.reply.trim()
    ) {
      throw new BadGatewayException(
        'AI reply drafting returned an invalid reply',
      );
    }

    if (
      typeof parsed.confidence !== 'number' ||
      !Number.isFinite(parsed.confidence) ||
      parsed.confidence < 0 ||
      parsed.confidence > 1
    ) {
      throw new BadGatewayException(
        'AI reply drafting returned an invalid confidence',
      );
    }

    if (
      !this.isValidTone(parsed.tone)
    ) {
      throw new BadGatewayException(
        'AI reply drafting returned an invalid tone',
      );
    }

    return {
      subject: parsed.subject.trim(),
      reply: parsed.reply.trim(),
      confidence: parsed.confidence,
      tone: parsed.tone,
    };
  }

  private isValidTone(
    value: unknown,
  ): value is HelpdeskAiReplyTone {
    return (
      value === 'professional' ||
      value === 'friendly' ||
      value === 'empathetic'
    );
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
