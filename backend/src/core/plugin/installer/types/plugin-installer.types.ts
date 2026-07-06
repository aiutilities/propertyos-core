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
  messages: string[];
  error?: string;
}
