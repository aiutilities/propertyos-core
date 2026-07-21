import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
} from '@nestjs/common';

import {
  SearchService,
} from '../../search';
import {
  HelpdeskAiKnowledgeService,
} from './helpdesk-ai-knowledge.service';

describe('HelpdeskAiKnowledgeService', () => {
  const search =
    jest.fn<SearchService['search']>();

  const service =
    new HelpdeskAiKnowledgeService({
      search,
    } as unknown as SearchService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves normalized evidence', async () => {
    search.mockResolvedValue([
      {
        id: 'document:doc-1',
        entityType: 'document',
        entityId: 'doc-1',
        title: 'Water leakage SOP',
        description:
          'Steps for handling water leakage.',
        score: 98,
        providerName:
          'document-search-provider',
        metadata: {
          documentType: 'SOP',
        },
      },
    ]);

    const result =
      await service.retrieve({
        tenantId: ' tenant-1 ',
        query: ' water leakage ',
        entityTypes: [
          ' document ',
          'helpdesk',
          'document',
          '',
        ],
        limit: 3,
      });

    expect(search).toHaveBeenCalledTimes(1);

    expect(search).toHaveBeenCalledWith({
      query: 'water leakage',
      entityTypes: [
        'document',
        'helpdesk',
      ],
      limit: 3,
      offset: 0,
    });

    expect(result).toEqual({
      query: 'water leakage',
      evidenceCount: 1,
      evidence: [
        {
          id: 'document:doc-1',
          entityType: 'document',
          entityId: 'doc-1',
          title: 'Water leakage SOP',
          description:
            'Steps for handling water leakage.',
          score: 98,
          providerName:
            'document-search-provider',
          metadata: {
            documentType: 'SOP',
          },
        },
      ],
    });
  });

  it('uses the default retrieval limit', async () => {
    search.mockResolvedValue([]);

    await service.retrieve({
      tenantId: 'tenant-1',
      query: 'parking policy',
    });

    expect(search).toHaveBeenCalledWith({
      query: 'parking policy',
      entityTypes: undefined,
      limit: 5,
      offset: 0,
    });
  });

  it('omits empty entity type filters', async () => {
    search.mockResolvedValue([]);

    await service.retrieve({
      tenantId: 'tenant-1',
      query: 'lift maintenance',
      entityTypes: [
        ' ',
        '',
      ],
    });

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTypes: undefined,
      }),
    );
  });

  it('returns defensive metadata copies', async () => {
    const metadata = {
      status: 'OPEN',
    };

    search.mockResolvedValue([
      {
        id: 'helpdesk:ticket-1',
        entityType: 'helpdesk',
        entityId: 'ticket-1',
        title: 'Lift not working',
        metadata,
      },
    ]);

    const result =
      await service.retrieve({
        tenantId: 'tenant-1',
        query: 'lift',
      });

    expect(result.evidence[0].metadata)
      .toEqual(metadata);

    expect(result.evidence[0].metadata)
      .not.toBe(metadata);
  });

  it('rejects missing tenantId', async () => {
    await expect(
      service.retrieve({
        tenantId: ' ',
        query: 'water leakage',
      }),
    ).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(search).not.toHaveBeenCalled();
  });

  it('rejects missing query', async () => {
    await expect(
      service.retrieve({
        tenantId: 'tenant-1',
        query: ' ',
      }),
    ).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(search).not.toHaveBeenCalled();
  });
});
