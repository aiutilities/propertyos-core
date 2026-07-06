export type ConfigurationScope =
  | 'PLATFORM'
  | 'ORGANIZATION'
  | 'PROPERTY'
  | 'PLUGIN'
  | 'THEME';

export interface ConfigurationSetting {
  id: string;
  scopeType: ConfigurationScope;
  scopeId?: string;
  key: string;
  value: unknown;
  valueType: string;
  description?: string;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}
