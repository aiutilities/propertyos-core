export type PluginWorkflowDefinition = {
  code: string;
  name: string;
  description?: string;
  entityType: string;
  initialState: string;
  states: unknown[];
  transitions: unknown[];
  metadata?: Record<string, unknown>;
};

export function defineWorkflow<T extends PluginWorkflowDefinition>(
  workflow: T,
): T {
  return workflow;
}

export function defineWorkflows<T extends PluginWorkflowDefinition>(
  workflows: T[],
): T[] {
  return workflows;
}
