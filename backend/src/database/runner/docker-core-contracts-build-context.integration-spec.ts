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

describe(
  'Docker core-contracts build context',
  () => {
    const backendRoot = resolve(
      __dirname,
      '../../..',
    );

    const dockerfile = readFileSync(
      resolve(
        backendRoot,
        'Dockerfile',
      ),
      'utf8',
    );

    const packageManifest = JSON.parse(
      readFileSync(
        resolve(
          backendRoot,
          'package.json',
        ),
        'utf8',
      ),
    );

    it('declares the tracked local package dependency', () => {
      expect(
        packageManifest.dependencies[
          '@propertyos/core-contracts'
        ],
      ).toBe('file:./core-contracts');
    });

    it('copies core-contracts before clean dependency installation', () => {
      const packageCopy =
        dockerfile.indexOf(
          'COPY package*.json ./',
        );

      const contractCopy =
        dockerfile.indexOf(
          'COPY core-contracts ./core-contracts',
        );

      const cleanInstall =
        dockerfile.indexOf(
          'RUN npm ci',
        );

      expect(packageCopy).toBeGreaterThanOrEqual(0);
      expect(contractCopy).toBeGreaterThan(packageCopy);
      expect(cleanInstall).toBeGreaterThan(contractCopy);
    });

    it('propagates core-contracts through build and runtime stages', () => {
      expect(dockerfile).toContain(
        'COPY --from=deps /app/core-contracts ./core-contracts',
      );

      expect(dockerfile).toContain(
        'COPY --from=build --chown=node:node /app/core-contracts ./core-contracts',
      );
    });

    it('keeps the production entrypoint unchanged', () => {
      expect(dockerfile).toContain(
        'ENTRYPOINT ["dumb-init", "--"]',
      );

      expect(dockerfile).toContain(
        'CMD ["node", "dist/main.js"]',
      );
    });
  },
);
