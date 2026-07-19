import { PluginManifest } from '../../types/plugin.types';

export type PluginInstallationStage =
  | 'DISCOVER'
  | 'EXTRACT'
  | 'VALIDATE'
  | 'RESOLVE_DEPENDENCIES'
  | 'RUN_MIGRATIONS'
  | 'REGISTER'
  | 'ENABLE'
  | 'COMPLETE'
  | 'FAILED'
  | 'ROLLED_BACK';

export interface PluginInstallationProvenance {
  publicationId: string;
  pluginId: string;
  version: string;
  publisherId: string;
  keyId: string;
  artifactStorageObjectId: string;
  artifactSha256: string;
  integritySha256: string;
  verifiedAt?: string;
}

export interface PluginInstallationRequest {
  packagePath: string;
  autoEnable?: boolean;
  overwrite?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PluginInstallationResult {
  success: boolean;
  stage: PluginInstallationStage;
  manifest?: PluginManifest;
  installedPluginId?: string;
  requestKey?: string;
  replayed?: boolean;
  messages: string[];
  error?: string;
}
