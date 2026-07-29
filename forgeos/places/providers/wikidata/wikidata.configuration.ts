import {
  WikidataConfiguration,
  WikidataConfigurationInput,
} from './wikidata.types';

const DEFAULT_ENDPOINT =
  'https://www.wikidata.org/wiki/Special:EntityData';

const DEFAULT_TIMEOUT_MILLISECONDS =
  10_000;

const DEFAULT_USER_AGENT =
  'ForgeOS Places/0.1';

const DEFAULT_LANGUAGE =
  'en';

export function resolveWikidataConfiguration(
  input:
    WikidataConfigurationInput = {},
): WikidataConfiguration {
  const errors:
    string[] = [];

  const endpoint =
    (
      input.endpoint ??
      DEFAULT_ENDPOINT
    )
      .trim()
      .replace(
        /\/+$/,
        '',
      );

  const timeoutMilliseconds =
    input.timeoutMilliseconds ??
    DEFAULT_TIMEOUT_MILLISECONDS;

  const userAgent =
    (
      input.userAgent ??
      DEFAULT_USER_AGENT
    ).trim();

  const defaultLanguage =
    (
      input.defaultLanguage ??
      DEFAULT_LANGUAGE
    )
      .trim()
      .toLowerCase();

  try {
    const url =
      new URL(
        endpoint,
      );

    if (
      ![
        'http:',
        'https:',
      ].includes(
        url.protocol,
      )
    ) {
      errors.push(
        'Wikidata endpoint must use HTTP or HTTPS',
      );
    }
  } catch {
    errors.push(
      'Wikidata endpoint must be a valid URL',
    );
  }

  if (
    !Number.isInteger(
      timeoutMilliseconds,
    ) ||
    timeoutMilliseconds < 1
  ) {
    errors.push(
      'Wikidata timeoutMilliseconds must be a positive integer',
    );
  }

  if (!userAgent) {
    errors.push(
      'Wikidata userAgent must not be empty',
    );
  }

  if (
    !/^[a-z]{2,12}(-[a-z0-9]{2,12})?$/.test(
      defaultLanguage,
    )
  ) {
    errors.push(
      'Wikidata defaultLanguage must be a valid language code',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    endpoint,

    timeoutMilliseconds:
      Number.isInteger(
        timeoutMilliseconds,
      ) &&
      timeoutMilliseconds > 0
        ? timeoutMilliseconds
        : DEFAULT_TIMEOUT_MILLISECONDS,

    userAgent:
      userAgent ||
      DEFAULT_USER_AGENT,

    defaultLanguage:
      defaultLanguage ||
      DEFAULT_LANGUAGE,

    errors,
  };
}
