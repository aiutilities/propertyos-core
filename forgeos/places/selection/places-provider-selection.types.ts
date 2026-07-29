import {
  PlacesProviderCapability,
} from '../contracts';

export interface PlacesProviderSelectionRule {
  capability:
    PlacesProviderCapability;

  providers:
    readonly string[];
}

export interface PlacesProviderSelectionConfiguration {
  rules:
    readonly PlacesProviderSelectionRule[];
}

export interface PlacesProviderSelectionResult {
  capability:
    PlacesProviderCapability;

  providers:
    readonly string[];
}
