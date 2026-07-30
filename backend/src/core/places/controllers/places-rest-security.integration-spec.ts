import {
  readFileSync,
} from 'node:fs';

import {
  resolve,
} from 'node:path';

import {
  describe,
  expect,
  it,
} from '@jest/globals';

describe(
  'Places REST API security',
  () => {
    it(
      'requires JWT and Places permissions',
      () => {
        const source =
          readFileSync(
            resolve(
              process.cwd(),

              'src/core/places/controllers/places.controller.ts',
            ),

            'utf8',
          );

        expect(source)
          .toContain(
            '@UseGuards(',
          );

        expect(source)
          .toContain(
            'JwtAuthGuard',
          );

        expect(source)
          .toContain(
            'PermissionGuard',
          );

        expect(source)
          .not
          .toContain(
            '@Public()',
          );

        expect(source)
          .toContain(
            'PLACES_PERMISSIONS.USE',
          );

        expect(source)
          .toContain(
            'PLACES_PERMISSIONS.READ',
          );
      },
    );
  },
);
