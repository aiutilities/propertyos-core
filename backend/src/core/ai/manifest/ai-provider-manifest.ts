import {
  PlatformRuntimeService,
} from '../../platform/runtime/platform-runtime.service';
import { AiExecutionMode } from '../types/ai-orchestration.types';
import { AiCapability } from '../types/ai.types';

export const AI_PROVIDER_MANIFEST_VERSION = '1.0.0';
export const AI_PROVIDER_CONTRACT_VERSION = '1.0.0';
export const PROPERTYOS_PLATFORM_VERSION =
  PlatformRuntimeService
    .resolvePlatformVersion();

export interface AiProviderManifestIdentity {
  id: string;
  name: string;
  displayName: string;
  version: string;
  vendor: string;
  description?: string;
}

export interface AiProviderManifestCompatibility {
  propertyOsVersion: string;
  aiContractVersion: string;
}

export interface AiProviderManifestModel {
  id: string;
  displayName: string;
  contextWindow: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolCalling: boolean;
}

export interface AiProviderManifestLimits {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTotalTokens?: number;
}

export interface AiProviderManifest {
  manifestVersion: string;
  provider: AiProviderManifestIdentity;
  compatibility: AiProviderManifestCompatibility;
  execution: {
    supportedModes: AiExecutionMode[];
  };
  capabilities: AiCapability[];
  models: AiProviderManifestModel[];
  limits: AiProviderManifestLimits;
  metadata?: Record<string, unknown>;
}

export interface AiProviderManifestValidationOptions {
  platformVersion?: string;
  aiContractVersion?: string;
}

export interface AiProviderManifestValidationResult {
  valid: boolean;
  compatible: boolean;
  errors: string[];
  manifest?: AiProviderManifest;
}
