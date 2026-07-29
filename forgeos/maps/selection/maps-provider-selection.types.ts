import {
  MapProviderCapability,
} from '../contracts';

export interface MapsProviderSelectionRule {
  capability:
    MapProviderCapability;

  providers:
    readonly string[];
}

export interface MapsProviderSelectionConfiguration {
  rules:
    readonly MapsProviderSelectionRule[];
}

export interface MapsProviderSelectionResult {
  capability:
    MapProviderCapability;

  providers:
    readonly string[];
}
