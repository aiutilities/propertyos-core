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

function source(
  path:
    string,
): string {
  return readFileSync(
    resolve(
      process.cwd(),
      path,
    ),
    'utf8',
  );
}

describe(
  'Payment webhook HTTP bootstrap',
  () => {
    it(
      'enables Nest raw-body preservation',
      () => {
        const main =
          source(
            'src/main.ts',
          );

        expect(main)
          .toMatch(
            /NestFactory\.create\([\s\S]*?AppModule[\s\S]*?rawBody\s*:\s*true/,
          );
      },
    );

    it(
      'keeps payment webhooks explicitly public',
      () => {
        const controller =
          source(
            'src/core/payment/controllers/payment-webhook.controller.ts',
          );

        expect(controller)
          .toMatch(
            /@Public\(\)\s+@Controller\(\s*'payments\/webhooks'/,
          );

        expect(controller)
          .not
          .toMatch(
            /request\.(path|url).*public/i,
          );
      },
    );

    it(
      'requires the exact raw request body',
      () => {
        const controller =
          source(
            'src/core/payment/controllers/payment-webhook.controller.ts',
          );

        expect(controller)
          .toContain(
            'request.rawBody',
          );

        expect(controller)
          .toContain(
            'PAYMENT_WEBHOOK_RAW_BODY_REQUIRED',
          );
      },
    );
  },
);
