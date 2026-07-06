export type PluginDocumentDefinition = {
  code: string;
  name: string;
  entityType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

export function defineDocuments<T extends PluginDocumentDefinition>(
  items: T[],
): T[] {
  return items;
}
