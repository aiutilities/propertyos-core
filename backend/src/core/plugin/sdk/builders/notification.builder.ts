export type PluginNotificationDefinition = {
  code: string;
  event: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP';
  subject?: string;
  template: string;
  metadata?: Record<string, unknown>;
};

export function defineNotifications<T extends PluginNotificationDefinition>(
  items: T[],
): T[] {
  return items;
}
