import {
  GeoCoordinate,
  MapRoute,
  RouteStep,
} from '../../contracts';

import {
  OsrmGeoJsonLineString,
  OsrmManeuver,
  OsrmRouteResponse,
  OsrmRouteStepResponse,
} from './osrm.types';

function coordinate(
  value:
    readonly number[],
): GeoCoordinate {
  const [
    longitude,
    latitude,
  ] = value;

  if (
    !Number.isFinite(
      latitude,
    ) ||
    !Number.isFinite(
      longitude,
    )
  ) {
    throw new Error(
      'INVALID_OSRM_RESPONSE: Route coordinate must contain numeric longitude and latitude',
    );
  }

  return {
    latitude,
    longitude,
  };
}

function geometry(
  value:
    OsrmGeoJsonLineString |
    undefined,
): GeoCoordinate[] {
  if (!value) {
    return [];
  }

  if (
    value.type !==
      'LineString' ||
    !Array.isArray(
      value.coordinates,
    )
  ) {
    throw new Error(
      'INVALID_OSRM_RESPONSE: Route geometry must be a GeoJSON LineString',
    );
  }

  return value.coordinates
    .map(
      coordinate,
    );
}

function instruction(
  maneuver:
    OsrmManeuver |
    undefined,

  roadName:
    string | undefined,
): string | undefined {
  if (
    maneuver?.instruction
  ) {
    return maneuver
      .instruction;
  }

  const action = [
    maneuver?.type,
    maneuver?.modifier,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (
    action &&
    roadName
  ) {
    return `${action} onto ${roadName}`;
  }

  return (
    action ||
    roadName
  );
}

function mapStep(
  step:
    OsrmRouteStepResponse,
): RouteStep {
  const stepGeometry =
    geometry(
      step.geometry,
    );

  const maneuverLocation =
    step.maneuver
      ?.location;

  const start =
    maneuverLocation
      ? coordinate(
          maneuverLocation,
        )
      : stepGeometry[0];

  const end =
    stepGeometry[
      stepGeometry.length -
      1
    ] ??
    start;

  if (
    !start ||
    !end
  ) {
    throw new Error(
      'INVALID_OSRM_RESPONSE: Route step must contain geometry or maneuver coordinates',
    );
  }

  return {
    instruction:
      instruction(
        step.maneuver,
        step.name,
      ),

    distanceMeters:
      step.distance,

    durationSeconds:
      step.duration,

    start,
    end,

    geometry:
      stepGeometry.length > 0
        ? stepGeometry
        : undefined,
  };
}

export function mapOsrmRoute(
  route:
    OsrmRouteResponse,

  providerName:
    string,

  index:
    number,
): MapRoute {
  if (
    !Number.isFinite(
      route.distance,
    ) ||
    !Number.isFinite(
      route.duration,
    )
  ) {
    throw new Error(
      'INVALID_OSRM_RESPONSE: Route distance and duration must be numeric',
    );
  }

  const steps =
    (
      route.legs ??
      []
    )
      .flatMap(
        (leg) =>
          leg.steps ??
          [],
      )
      .map(
        mapStep,
      );

  return {
    id:
      `osrm-route-${index + 1}`,

    providerName,

    distanceMeters:
      route.distance,

    durationSeconds:
      route.duration,

    geometry:
      geometry(
        route.geometry,
      ),

    steps:
      steps.length > 0
        ? steps
        : undefined,

    metadata: {
      weight:
        route.weight,

      weightName:
        route.weight_name,

      legCount:
        route.legs
          ?.length ??
        0,
    },
  };
}
