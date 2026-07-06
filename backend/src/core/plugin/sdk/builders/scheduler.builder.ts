export type PluginSchedulerDefinition = {
  code: string;
  name: string;
  description?: string;
  cron?: string;
  event?: string;
  metadata?: Record<string, unknown>;
};

export function defineScheduler<T extends PluginSchedulerDefinition>(
  items: T[],
): T[] {
  return items;
}
