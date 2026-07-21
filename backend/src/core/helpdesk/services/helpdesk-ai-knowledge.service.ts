import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  SearchService,
} from '../../search';
import {
  RetrieveHelpdeskKnowledgeDto,
} from '../dto/retrieve-helpdesk-knowledge.dto';
import {
  HelpdeskKnowledgeEvidence,
  HelpdeskKnowledgeRetrievalResult,
} from '../types/helpdesk-ai-knowledge.types';

@Injectable()
export class HelpdeskAiKnowledgeService {
  constructor(
    private readonly searchService:
      SearchService,
  ) {}

  async retrieve(
    dto: RetrieveHelpdeskKnowledgeDto,
  ): Promise<HelpdeskKnowledgeRetrievalResult> {
    this.requireText(dto.tenantId, 'tenantId');
    this.requireText(dto.query, 'query');

    const query = dto.query.trim();
    const limit = dto.limit ?? 5;

    const results =
      await this.searchService.search({
        query,
        entityTypes:
          this.normalizeEntityTypes(
            dto.entityTypes,
          ),
        limit,
        offset: 0,
      });

    const evidence =
      results.map(
        result =>
          this.toEvidence(result),
      );

    return {
      query,
      evidence,
      evidenceCount:
        evidence.length,
    };
  }

  private normalizeEntityTypes(
    entityTypes?: string[],
  ): string[] | undefined {
    if (!entityTypes?.length) {
      return undefined;
    }

    const normalized = [
      ...new Set(
        entityTypes
          .map(value => value.trim())
          .filter(Boolean),
      ),
    ];

    return normalized.length
      ? normalized
      : undefined;
  }

  private toEvidence(
    result: HelpdeskKnowledgeEvidence,
  ): HelpdeskKnowledgeEvidence {
    return {
      id: result.id,
      entityType:
        result.entityType,
      entityId:
        result.entityId,
      title:
        result.title,
      description:
        result.description,
      score:
        result.score,
      providerName:
        result.providerName,
      metadata:
        result.metadata
          ? {
              ...result.metadata,
            }
          : undefined,
    };
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
