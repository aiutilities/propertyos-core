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
  'Maps REST API security',
  () => {
    it(
      'requires JWT and Maps permissions',
      () => {
        const source =
          readFileSync(
            resolve(
              process.cwd(),

              'src/core/maps/controllers/maps.controller.ts',
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
            'MAPS_PERMISSIONS.USE',
          );

        expect(source)
          .toContain(
            'MAPS_PERMISSIONS.READ',
          );
      },
    );
  },
);
