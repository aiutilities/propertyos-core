import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { AiService } from './ai.service';

describe(
  'AiService provider discovery boundary',
  () => {
    it(
      'lists provider descriptors without executing providers',
      () => {
        const generate =
          jest.fn();

        const provider = {
          generate,
          getProvider:
            jest.fn(
              () => ({
                id:
                  'mock-provider',
                name:
                  'mock',
                displayName:
                  'Mock Provider',
                status:
                  'ACTIVE' as const,
                capabilities: [
                  'CHAT' as const,
                ],
                defaultModel:
                  'mock-model',
              }),
            ),
        };

        const registry = {
          list:
            jest.fn(
              () => [
                provider,
              ],
            ),
        };

        const service =
          new AiService(
            registry as never,
          );

        expect(
          service.listProviders(),
        ).toEqual([
          {
            id:
              'mock-provider',
            name:
              'mock',
            displayName:
              'Mock Provider',
            status:
              'ACTIVE',
            capabilities: [
              'CHAT',
            ],
            defaultModel:
              'mock-model',
          },
        ]);

        expect(
          registry.list,
        ).toHaveBeenCalledTimes(1);

        expect(
          provider.getProvider,
        ).toHaveBeenCalledTimes(1);

        expect(
          generate,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'does not expose a legacy generate operation',
      () => {
        expect(
          (
            AiService
              .prototype as unknown as
              Record<
                string,
                unknown
              >
          ).generate,
        ).toBeUndefined();
      },
    );
  },
);
