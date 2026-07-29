import {
  createHash,
} from 'node:crypto';

import {
  PlacesCacheOperation,
} from './places-cache.types';

function normalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      normalize,
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
            normalize(
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

export interface CreatePlacesCacheKeyInput {
  operation:
    PlacesCacheOperation;

  request:
    unknown;

  providerSignature?:
    readonly string[];
}

export function createPlacesCacheKey(
  input:
    CreatePlacesCacheKeyInput,
): string {
  const serialized =
    JSON.stringify(
      normalize({
        operation:
          input.operation,

        request:
          input.request,

        providerSignature:
          input.providerSignature,
      }),
    );

  return [
    'forgeos',
    'places',
    input.operation
      .toLowerCase(),
    createHash(
      'sha256',
    )
      .update(
        serialized,
      )
      .digest(
        'hex',
      ),
  ].join(':');
}
