export interface VisitorPluginSettingEntity {
  id: string;
  propertyId?: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
