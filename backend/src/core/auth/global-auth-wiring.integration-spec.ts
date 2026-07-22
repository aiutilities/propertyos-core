import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';

function source(path: string): string {
  return readFileSync(
    resolve(process.cwd(), path),
    'utf8',
  );
}

describe(
  'global authentication wiring evidence',
  () => {
    it(
      'registers guards in the required fail-closed order',
      () => {
        const appModule = source(
          'src/app.module.ts',
        );

        const throttler =
          appModule.indexOf(
            'useClass: ThrottlerGuard',
          );

        const jwt =
          appModule.indexOf(
            'useExisting: JwtAuthGuard',
          );

        const permission =
          appModule.indexOf(
            'useExisting: PermissionGuard',
          );

        expect(throttler).toBeGreaterThan(-1);
        expect(jwt).toBeGreaterThan(throttler);
        expect(permission).toBeGreaterThan(jwt);
      },
    );

    it(
      'keeps login explicitly public',
      () => {
        const controller = source(
          'src/core/auth/auth.controller.ts',
        );

        expect(controller).toMatch(
          /@Public\(\)\s+@Post\('login'\)/,
        );
      },
    );

    it(
      'keeps bootstrap explicitly public',
      () => {
        const controller = source(
          'src/core/bootstrap/controllers/' +
            'bootstrap.controller.ts',
        );

        expect(controller).toMatch(
          /@Public\(\)\s+@Controller\('bootstrap'\)/,
        );
      },
    );

    it(
      'keeps operational health probes explicitly public',
      () => {
        const controller = source(
          'src/core/health/health.controller.ts',
        );

        expect(controller).toMatch(
          /@Public\(\)\s+@Controller\('health'\)/,
        );
      },
    );

    it(
      'does not implement path-based authentication bypasses',
      () => {
        const guard = source(
          'src/core/auth/guards/jwt-auth.guard.ts',
        );

        expect(guard).not.toMatch(
          /request\.(path|url|route).*auth/i,
        );

        expect(guard).not.toMatch(
          /includes\(['"`]\/health/i,
        );

        expect(guard).not.toMatch(
          /includes\(['"`]\/bootstrap/i,
        );
      },
    );
  },
);
