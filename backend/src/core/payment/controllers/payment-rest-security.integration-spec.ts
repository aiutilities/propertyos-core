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
  'Payment REST API security',
  () => {
    it(
      'requires JWT and permission guards',
      () => {
        const source =
          readFileSync(
            resolve(
              process.cwd(),

              'src/core/payment/controllers/payment.controller.ts',
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
            'PAYMENT_PERMISSIONS.READ',
          );

        expect(source)
          .toContain(
            'PAYMENT_PERMISSIONS.CREATE',
          );

        expect(source)
          .toContain(
            'PAYMENT_PERMISSIONS.MANAGE',
          );
      },
    );
  },
);
