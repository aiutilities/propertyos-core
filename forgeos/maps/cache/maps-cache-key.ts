import {
  createHash,
} from 'node:crypto';

import {
  MapsCacheOperation,
} from './maps-cache.types';

function normalizeValue(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      normalizeValue,
    );
  }

  if (
    typeof value ===
      'object' &&
    value !== null
  ) {
    return Object.fromEntries(
      Object.entries(
        value as
          Record<
            string,
            unknown
          >,
      )
        .filter(
          (
            [
              ,
              child,
            ],
          ) =>
            child !==
              undefined,
        )
        .sort(
          (
            [
              left,
            ],

            [
              right,
            ],
          ) =>
            left.localeCompare(
              right,
            ),
        )
        .map(
          (
            [
              key,
              child,
            ],
          ) => [
            key,
            normalizeValue(
              child,
            ),
          ],
        ),
    );
  }

  if (
    typeof value ===
      'string'
  ) {
    return value.trim();
  }

  return value;
}

export interface CreateMapsCacheKeyInput {
  operation:
    MapsCacheOperation;

  request:
    unknown;

  selectionSignature?:
    readonly string[];
}

export function createMapsCacheKey(
  input:
    CreateMapsCacheKeyInput,
): string {
  const serialized =
    JSON.stringify(
      normalizeValue({
        operation:
          input.operation,

        request:
          input.request,

        selectionSignature:
          input
            .selectionSignature,
      }),
    );

  const digest =
    createHash(
      'sha256',
    )
      .update(
        serialized,
      )
      .digest(
        'hex',
      );

  return [
    'forgeos',
    'maps',
    input.operation
      .toLowerCase(),
    digest,
  ].join(':');
}
