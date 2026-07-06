import { ConfigurationScope, ConfigurationSetting } from '../types/configuration.types';

export interface ConfigurationRepository {
  upsert(setting: ConfigurationSetting): Promise<ConfigurationSetting>;

  findById(id: string): Promise<ConfigurationSetting | null>;

  findByScopeAndKey(
    scopeType: ConfigurationScope,
    scopeId: string | undefined,
    key: string,
  ): Promise<ConfigurationSetting | null>;

  list(scopeType?: ConfigurationScope, scopeId?: string): Promise<ConfigurationSetting[]>;

  delete(id: string): Promise<void>;
}
