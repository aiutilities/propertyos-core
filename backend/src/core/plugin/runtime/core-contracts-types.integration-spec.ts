import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  PaginationQueryDto,
  normalizePagination,
} from '@propertyos/core-contracts';

describe(
  '@propertyos/core-contracts type bridge',
  () => {
    it(
      'exposes the pagination contract fields',
      () => {
        const query =
          new PaginationQueryDto();

        query.page = 3;
        query.limit = 20;
        query.search =
          'tenant';
        query.sortBy =
          'createdAt';
        query.sortOrder =
          'asc';

        expect(
          normalizePagination(
            query,
          ),
        ).toEqual({
          page: 3,
          limit: 20,
          offset: 40,
        });

        expect(
          query,
        ).toMatchObject({
          search:
            'tenant',
          sortBy:
            'createdAt',
          sortOrder:
            'asc',
        });
      },
    );
  },
);
