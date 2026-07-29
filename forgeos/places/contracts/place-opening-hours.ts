export const PLACE_WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
] as const;

export type PlaceWeekday =
  typeof PLACE_WEEKDAYS[number];

export interface PlaceOpeningPeriod {
  day:
    PlaceWeekday;

  opensAt?:
    string;

  closesAt?:
    string;

  open24Hours?:
    boolean;

  closed?:
    boolean;
}

export interface PlaceOpeningHours {
  openNow?:
    boolean;

  periods?:
    readonly PlaceOpeningPeriod[];

  weekdayText?:
    readonly string[];
}
