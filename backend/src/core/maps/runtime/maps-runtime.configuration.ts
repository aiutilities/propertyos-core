export interface PropertyOSMapsRuntimeConfiguration {
  enabled: boolean;

  cacheMaximumEntries: number;

  geocodeProviders:
    readonly string[];

  reverseGeocodeProviders:
    readonly string[];

  routingProviders:
    readonly string[];

  errors:
    readonly string[];
}

function parseProviderList(
  value: string | undefined,
  fallback: readonly string[],
): string[] {
  const providers =
    value
      ?.split(',')
      .map(
        (item) =>
          item
            .trim()
            .toLowerCase(),
      )
      .filter(Boolean);

  return providers &&
    providers.length > 0
    ? providers
    : [
        ...fallback,
      ];
}

function parseBoolean(
  value: string | undefined,
): boolean {
  return [
    '1',
    'true',
    'yes',
    'enabled',
  ].includes(
    value
      ?.trim()
      .toLowerCase() ??
      '',
  );
}

export function resolvePropertyOSMapsRuntimeConfiguration():
  PropertyOSMapsRuntimeConfiguration {
  const errors:
    string[] = [];

  const enabled =
    parseBoolean(
      process.env
        .MAPS_ENABLED,
    );

  const rawMaximumEntries =
    process.env
      .MAPS_CACHE_MAX_ENTRIES;

  const cacheMaximumEntries =
    rawMaximumEntries ===
      undefined
      ? 1000
      : Number(
          rawMaximumEntries,
        );

  if (
    !Number.isInteger(
      cacheMaximumEntries,
    ) ||
    cacheMaximumEntries < 1
  ) {
    errors.push(
      'MAPS_CACHE_MAX_ENTRIES must be a positive integer',
    );
  }

  const geocodeProviders =
    parseProviderList(
      process.env
        .MAPS_GEOCODE_PROVIDERS,
      [
        'nominatim',
      ],
    );

  const reverseGeocodeProviders =
    parseProviderList(
      process.env
        .MAPS_REVERSE_GEOCODE_PROVIDERS,
      [
        'nominatim',
      ],
    );

  const routingProviders =
    parseProviderList(
      process.env
        .MAPS_ROUTING_PROVIDERS,
      [
        'osrm',
      ],
    );

  if (
    enabled &&
    !process.env
      .MAPS_NOMINATIM_USER_AGENT
      ?.trim()
  ) {
    errors.push(
      'MAPS_NOMINATIM_USER_AGENT is required when Maps is enabled',
    );
  }

  return {
    enabled,

    cacheMaximumEntries:
      Number.isInteger(
        cacheMaximumEntries,
      ) &&
      cacheMaximumEntries > 0
        ? cacheMaximumEntries
        : 1000,

    geocodeProviders,
    reverseGeocodeProviders,
    routingProviders,

    errors,
  };
}
