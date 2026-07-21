import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadGatewayException,
  BadRequestException,
} from '@nestjs/common';

import {
  PropertyOsAiSdkService,
} from '../../ai';
import {
  DraftHelpdeskReplyDto,
} from '../dto/draft-helpdesk-reply.dto';
import {
  HelpdeskAiReplyService,
} from './helpdesk-ai-reply.service';

describe('HelpdeskAiReplyService', () => {
  const execute =
    jest.fn<PropertyOsAiSdkService['execute']>();

  const service =
    new HelpdeskAiReplyService({
      execute,
    } as unknown as PropertyOsAiSdkService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const dto =
    (): DraftHelpdeskReplyDto => ({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      subject: 'Water leakage',
      customerMessage:
        'Water is leaking from the bathroom ceiling.',
      internalNotes:
        'A plumber has been assigned.',
    });

  it('uses the public AI SDK boundary', async () => {
    execute.mockResolvedValue({
      ok: true,
      sdkVersion: '1.0.0',
      correlationId: 'correlation-1',
      content: JSON.stringify({
        subject:
          'Update on your water leakage request',
        reply:
          'Thank you for reporting this. A plumber has been assigned to inspect the issue.',
        confidence: 0.95,
        tone: 'empathetic',
      }),
      providerName: 'simulated',
      model: 'simulated-model',
      usage: {},
      attempts: [],
    });

    const result =
      await service.draftReply(dto());

    expect(execute).toHaveBeenCalledTimes(1);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        moduleId: 'helpdesk',
        capability: 'TEXT_GENERATION',
        executionMode: 'SIMULATED',
        dataClassification: 'INTERNAL',
        temperature: 0.2,
        metadata: {
          operation:
            'helpdesk_reply_drafting',
          advisoryOnly: true,
        },
      }),
    );

    expect(result).toEqual({
      subject:
        'Update on your water leakage request',
      reply:
        'Thank you for reporting this. A plumber has been assigned to inspect the issue.',
      confidence: 0.95,
      tone: 'empathetic',
      correlationId: 'correlation-1',
      providerName: 'simulated',
      model: 'simulated-model',
    });
  });

  it('accepts JSON wrapped in explanatory text', async () => {
    execute.mockResolvedValue({
      ok: true,
      sdkVersion: '1.0.0',
      correlationId: 'correlation-2',
      content: [
        'Suggested response:',
        JSON.stringify({
          subject: 'Request received',
          reply:
            'Thank you for contacting us. We are reviewing your request.',
          confidence: 0.78,
          tone: 'professional',
        }),
      ].join('\n'),
      providerName: 'simulated',
      usage: {},
      attempts: [],
    });

    await expect(
      service.draftReply(dto()),
    ).resolves.toEqual({
      subject: 'Request received',
      reply:
        'Thank you for contacting us. We are reviewing your request.',
      confidence: 0.78,
      tone: 'professional',
      correlationId: 'correlation-2',
      providerName: 'simulated',
      model: undefined,
    });
  });

  it('rejects missing required input', async () => {
    await expect(
      service.draftReply({
        ...dto(),
        customerMessage: '   ',
      }),
    ).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(execute).not.toHaveBeenCalled();
  });

  it('maps SDK failures to a gateway error', async () => {
    execute.mockResolvedValue({
      ok: false,
      sdkVersion: '1.0.0',
      correlationId: 'correlation-3',
      error: {
        code: 'ALL_PROVIDERS_FAILED',
        message: 'Providers unavailable',
        retriable: true,
      },
    });

    await expect(
      service.draftReply(dto()),
    ).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rejects malformed AI output', async () => {
    execute.mockResolvedValue({
      ok: true,
      sdkVersion: '1.0.0',
      correlationId: 'correlation-4',
      content: JSON.stringify({
        subject: '',
        reply: '',
        confidence: 3,
        tone: 'casual',
      }),
      providerName: 'simulated',
      usage: {},
      attempts: [],
    });

    await expect(
      service.draftReply(dto()),
    ).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
