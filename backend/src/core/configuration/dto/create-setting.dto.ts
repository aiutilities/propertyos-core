import { ConfigurationScope } from '../types/configuration.types';

export class CreateSettingDto {
  scopeType!: ConfigurationScope;
  scopeId?: string;
  key!: string;
  value!: unknown;
  valueType?: string;
  description?: string;
  isSecret?: boolean;
}
