import {
  GeoCoordinate,
} from './coordinate';

export interface GeoBoundingBox {
  southWest:
    GeoCoordinate;

  northEast:
    GeoCoordinate;
}

export interface GeoPolygon {
  exterior:
    readonly GeoCoordinate[];

  holes?:
    readonly (
      readonly GeoCoordinate[]
    )[];
}
