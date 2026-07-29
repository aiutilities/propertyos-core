export interface WikidataConfigurationInput {
  endpoint?:
    string;

  timeoutMilliseconds?:
    number;

  userAgent?:
    string;

  defaultLanguage?:
    string;
}

export interface WikidataConfiguration {
  status:
    'READY' |
    'BLOCKED';

  endpoint:
    string;

  timeoutMilliseconds:
    number;

  userAgent:
    string;

  defaultLanguage:
    string;

  errors:
    readonly string[];
}

export interface WikidataLanguageValue {
  language:
    string;

  value:
    string;
}

export interface WikidataGlobeCoordinateValue {
  latitude:
    number;

  longitude:
    number;

  altitude?:
    number | null;

  precision?:
    number | null;

  globe?:
    string;
}

export interface WikidataCommonsMediaValue {
  value:
    string;
}

export interface WikidataDataValue {
  type:
    string;

  value:
    unknown;
}

export interface WikidataSnak {
  snaktype:
    string;

  property:
    string;

  datavalue?:
    WikidataDataValue;

  datatype?:
    string;
}

export interface WikidataStatement {
  id?:
    string;

  type?:
    string;

  rank?:
    string;

  mainsnak:
    WikidataSnak;
}

export interface WikidataSiteLink {
  site:
    string;

  title:
    string;

  badges?:
    readonly string[];

  url?:
    string;
}

export interface WikidataEntity {
  pageid?:
    number;

  ns?:
    number;

  title?:
    string;

  lastrevid?:
    number;

  modified?:
    string;

  type?:
    string;

  id:
    string;

  labels?:
    Record<
      string,
      WikidataLanguageValue
    >;

  descriptions?:
    Record<
      string,
      WikidataLanguageValue
    >;

  aliases?:
    Record<
      string,
      readonly WikidataLanguageValue[]
    >;

  claims?:
    Record<
      string,
      readonly WikidataStatement[]
    >;

  sitelinks?:
    Record<
      string,
      WikidataSiteLink
    >;
}

export interface WikidataEntityResponse {
  entities:
    Record<
      string,
      WikidataEntity
    >;
}
