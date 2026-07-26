import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MarketplaceQueryDto,
  MarketplaceSearchQuery,
  MarketplaceSortDirection,
  MarketplaceSortField,
} from '../dto/marketplace-query.dto';
import {
  MarketplacePlugin,
} from '../entities/marketplace-plugin.entity';
import {
  MarketplaceRepository,
} from '../repositories/marketplace.repository';

export interface MarketplacePage {
  items: MarketplacePlugin[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const marketplaceSortFields:
  MarketplaceSortField[] = [
    'name',
    'vendor',
    'publishedAt',
    'updatedAt',
  ];

const marketplaceSortDirections:
  MarketplaceSortDirection[] = [
    'asc',
    'desc',
  ];

@Injectable()
export class MarketplaceCatalogService {
  constructor(
    private readonly repository:
      MarketplaceRepository,
  ) {}

  async list(
    input: MarketplaceQueryDto,
  ): Promise<MarketplacePage> {
    const query = this.normalizeQuery(input);

    const result =
      await this.repository.search(query);

    return {
      items: result.items,
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages:
        result.total === 0
          ? 0
          : Math.ceil(
              result.total / query.limit,
            ),
    };
  }

  async details(
    slug: string,
  ): Promise<MarketplacePlugin> {
    const plugin =
      await this.repository.findBySlug(slug);

    if (!plugin) {
      throw new NotFoundException(
        'Marketplace plugin not found',
      );
    }

    return plugin;
  }

  private normalizeQuery(
    input: MarketplaceQueryDto,
  ): MarketplaceSearchQuery {
    const page = this.parsePositiveInteger(
      input.page,
      1,
      'page',
    );

    const limit = this.parsePositiveInteger(
      input.limit,
      20,
      'limit',
    );

    if (limit > 100) {
      throw new BadRequestException(
        'limit must not exceed 100',
      );
    }

    const sort =
      input.sort?.trim() || 'publishedAt';

    if (
      !marketplaceSortFields.includes(
        sort as MarketplaceSortField,
      )
    ) {
      throw new BadRequestException(
        'Unsupported marketplace sort field',
      );
    }

    const direction =
      input.direction?.trim().toLowerCase()
      || 'desc';

    if (
      !marketplaceSortDirections.includes(
        direction as MarketplaceSortDirection,
      )
    ) {
      throw new BadRequestException(
        'Marketplace sort direction must be asc or desc',
      );
    }

    return {
      q: this.normalizeOptionalText(input.q),
      category:
        this.normalizeOptionalText(
          input.category,
        ),
      vendor:
        this.normalizeOptionalText(
          input.vendor,
        ),
      verified:
        this.parseOptionalBoolean(
          input.verified,
        ),
      page,
      limit,
      offset: (page - 1) * limit,
      sort:
        sort as MarketplaceSortField,
      direction:
        direction as MarketplaceSortDirection,
    };
  }

  private normalizeOptionalText(
    value: string | undefined,
  ): string | undefined {
    const normalized = value?.trim();

    return normalized
      ? normalized
      : undefined;
  }

  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    field: string,
  ): number {
    if (value === undefined) {
      return fallback;
    }

    const parsed = Number(value);

    if (
      !Number.isInteger(parsed)
      || parsed < 1
    ) {
      throw new BadRequestException(
        `${field} must be a positive integer`,
      );
    }

    return parsed;
  }

  private parseOptionalBoolean(
    value: string | undefined,
  ): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized =
      value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    throw new BadRequestException(
      'verified must be true or false',
    );
  }
}
