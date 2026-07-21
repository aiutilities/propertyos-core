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
  TriageHelpdeskTicketDto,
} from '../dto/triage-helpdesk-ticket.dto';
import {
  HelpdeskChannel,
} from '../types/helpdesk.types';
import {
  HelpdeskAiPolicyService,
} from './helpdesk-ai-policy.service';
import {
  HelpdeskAiTriageService,
} from './helpdesk-ai-triage.service';

describe('HelpdeskAiTriageService', () => {
  const execute =
    jest.fn<PropertyOsAiSdkService['execute']>();

  const service =
    new HelpdeskAiTriageService(
      {
        execute,
      } as unknown as PropertyOsAiSdkService,
      new HelpdeskAiPolicyService(),
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const dto =
    (): TriageHelpdeskTicketDto => ({
      tenantId: 'tenant-1',
      title: 'Water leakage',
      description:
        'Water is leaking from the bathroom ceiling.',
      categoryName: 'Plumbing',
      channel: HelpdeskChannel.WEB,
    });

  it('uses the public AI SDK boundary', async () => {
    execute.mockResolvedValue({
      ok: true,
      sdkVersion: '1.0.0',
      correlationId: 'correlation-1',
      content: JSON.stringify({
        suggestedPriority: 'HIGH',
        suggestedCategory: 'Plumbing',
        summary:
          'Bathroom ceiling water leakage',
        confidence: 0.94,
        reasons: [
          'Active water leakage',
          'Property damage risk',
        ],
      }),
      providerName: 'simulated',
      model: 'simulated-model',
      usage: {},
      attempts: [],
    });

    const result = await service.triage(dto());

    expect(execute).toHaveBeenCalledTimes(1);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        moduleId: 'helpdesk',
        capability: 'CLASSIFICATION',
        executionMode: 'SIMULATED',
        dataClassification: 'INTERNAL',
        temperature: 0,
        metadata: {
          operation:
            'helpdesk_ticket_triage',
          advisoryOnly: true,
        },
      }),
    );

    expect(result).toEqual({
      suggestedPriority: 'HIGH',
      suggestedCategory: 'Plumbing',
      summary:
        'Bathroom ceiling water leakage',
      confidence: 0.94,
      reasons: [
        'Active water leakage',
        'Property damage risk',
      ],
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
        'Classification result:',
        JSON.stringify({
          suggestedPriority: 'MEDIUM',
          suggestedCategory: 'General',
          summary: 'General helpdesk request',
          confidence: 0.71,
          reasons: ['No immediate safety risk'],
        }),
      ].join('\n'),
      providerName: 'simulated',
      usage: {},
      attempts: [],
    });

    await expect(
      service.triage(dto()),
    ).resolves.toEqual({
      suggestedPriority: 'MEDIUM',
      suggestedCategory: 'General',
      summary: 'General helpdesk request',
      confidence: 0.71,
      reasons: ['No immediate safety risk'],
      correlationId: 'correlation-2',
      providerName: 'simulated',
      model: undefined,
    });
  });

  it('rejects missing required input', async () => {
    await expect(
      service.triage({
        ...dto(),
        title: '   ',
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
        message: 'Provider unavailable',
        retriable: true,
      },
    });

    await expect(
      service.triage(dto()),
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
        suggestedPriority: 'URGENT',
        summary: '',
        confidence: 4,
        reasons: ['Invalid output'],
      }),
      providerName: 'simulated',
      usage: {},
      attempts: [],
    });

    await expect(
      service.triage(dto()),
    ).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
