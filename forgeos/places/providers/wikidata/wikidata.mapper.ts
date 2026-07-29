import {
  Place,
  PlaceCategory,
} from '../../contracts';

import {
  WikidataEntity,
  WikidataEntityResponse,
  WikidataGlobeCoordinateValue,
  WikidataStatement,
} from './wikidata.types';

const INSTANCE_CATEGORY_MAP:
  Readonly<
    Record<
      string,
      PlaceCategory
    >
  > = {
    Q16917:
      'HOSPITAL',

    Q3914:
      'SCHOOL',

    Q483110:
      'STADIUM',

    Q55488:
      'RAILWAY_STATION',

    Q644371:
      'METRO_STATION',

    Q1248784:
      'AIRPORT',

    Q33506:
      'MUSEUM',

    Q570116:
      'TOURIST_ATTRACTION',

    Q22698:
      'PARK',

    Q11707:
      'RESTAURANT',

    Q27686:
      'HOTEL',

    Q24354:
      'THEATRE',

    Q41253:
      'CINEMA',

    Q13226383:
      'LANDMARK',
  } as never;

function valueForLanguage(
  values:
    Record<
      string,
      {
        value:
          string;
      }
    > |
    undefined,

  language:
    string,
): string | undefined {
  return (
    values?.[
      language
    ]?.value ??
    values?.en?.value ??
    Object.values(
      values ??
      {},
    )[0]?.value
  );
}

function statements(
  entity:
    WikidataEntity,

  property:
    string,
): readonly WikidataStatement[] {
  return (
    entity.claims?.[
      property
    ] ??
    []
  );
}

function stringClaim(
  entity:
    WikidataEntity,

  property:
    string,
): string | undefined {
  for (
    const statement of
      statements(
        entity,
        property,
      )
  ) {
    const value =
      statement
        .mainsnak
        .datavalue
        ?.value;

    if (
      typeof value ===
        'string'
    ) {
      return value;
    }
  }

  return undefined;
}

function entityIdClaim(
  entity:
    WikidataEntity,

  property:
    string,
): string | undefined {
  for (
    const statement of
      statements(
        entity,
        property,
      )
  ) {
    const value =
      statement
        .mainsnak
        .datavalue
        ?.value;

    if (
      typeof value ===
        'object' &&
      value !== null
    ) {
      const candidate =
        value as {
          id?:
            unknown;
        };

      if (
        typeof candidate.id ===
          'string'
      ) {
        return candidate.id;
      }
    }
  }

  return undefined;
}

function coordinateClaim(
  entity:
    WikidataEntity,
): WikidataGlobeCoordinateValue |
  undefined {
  for (
    const statement of
      statements(
        entity,
        'P625',
      )
  ) {
    const value =
      statement
        .mainsnak
        .datavalue
        ?.value;

    if (
      typeof value ===
        'object' &&
      value !== null
    ) {
      const candidate =
        value as
          Partial<
            WikidataGlobeCoordinateValue
          >;

      if (
        typeof candidate.latitude ===
          'number' &&
        Number.isFinite(
          candidate.latitude,
        ) &&
        typeof candidate.longitude ===
          'number' &&
        Number.isFinite(
          candidate.longitude,
        )
      ) {
        return candidate as
          WikidataGlobeCoordinateValue;
      }
    }
  }

  return undefined;
}

function categoryOf(
  entity:
    WikidataEntity,
): PlaceCategory {
  const instanceId =
    entityIdClaim(
      entity,
      'P31',
    );

  return (
    (
      instanceId &&
      INSTANCE_CATEGORY_MAP[
        instanceId
      ]
    ) ||
    'LANDMARK'
  );
}

export function mapWikidataEntity(
  entity:
    WikidataEntity,

  language:
    string,

  providerName:
    string,
): Place | undefined {
  const coordinate =
    coordinateClaim(
      entity,
    );

  if (!coordinate) {
    return undefined;
  }

  const name =
    valueForLanguage(
      entity.labels,
      language,
    ) ??
    entity.id;

  const description =
    valueForLanguage(
      entity.descriptions,
      language,
    );

  const website =
    stringClaim(
      entity,
      'P856',
    );

  const image =
    stringClaim(
      entity,
      'P18',
    );

  const wikipedia =
    entity.sitelinks?.[
      `${language}wiki`
    ]?.url ??
    entity.sitelinks
      ?.enwiki
      ?.url;

  const primaryCategory =
    categoryOf(
      entity,
    );

  return {
    id:
      entity.id,

    providerName,

    name,

    coordinate: {
      latitude:
        coordinate.latitude,

      longitude:
        coordinate.longitude,
    },

    primaryCategory,

    categories: [
      primaryCategory,
    ],

    contact:
      website
        ? {
            website,
          }
        : undefined,

    photos:
      image
        ? [
            {
              reference:
                image,

              attribution: [
                'Wikimedia Commons',
              ],
            },
          ]
        : undefined,

    metadata: {
      description,

      wikipedia,

      wikidataId:
        entity.id,

      lastRevisionId:
        entity.lastrevid,

      modified:
        entity.modified,

      instanceOf:
        entityIdClaim(
          entity,
          'P31',
        ),
    },
  };
}

export function isWikidataEntityResponse(
  value:
    unknown,
): value is WikidataEntityResponse {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as {
      entities?:
        unknown;
    };

  return (
    typeof candidate.entities ===
      'object' &&
    candidate.entities !==
      null
  );
}
