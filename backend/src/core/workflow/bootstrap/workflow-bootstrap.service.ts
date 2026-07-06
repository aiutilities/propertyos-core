import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { RegistryBootstrapRunner } from '../../plugin/bootstrap/registry-bootstrap.runner';
import { PluginWorkflowRegistry } from '../../plugin/registries/plugin-workflow.registry';
import {
  WORKFLOW_REPOSITORY,
  WorkflowRepository,
} from '../repositories/workflow-repository.interface';
import { CreateWorkflowDefinitionInput } from '../types/workflow.types';

type PluginWorkflowDefinition = {
  code: string;
  name: string;
  description?: string;
  entityType: string;
  initialState: string;
  states: string[] | Array<{
    code: string;
    name?: string;
    isInitial?: boolean;
    isFinal?: boolean;
    sortOrder?: number;
    metadata?: Record<string, unknown>;
  }>;
  transitions: Array<{
    from?: string;
    fromState?: string;
    to?: string;
    toState?: string;
    action?: string;
    actionCode?: string;
    actionName?: string;
    requiredPermission?: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class WorkflowBootstrapService
  extends RegistryBootstrapRunner<PluginWorkflowDefinition>
  implements OnModuleInit
{
  constructor(
    private readonly pluginWorkflowRegistry: PluginWorkflowRegistry,
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflowRepository: WorkflowRepository,
  ) {
    super(WorkflowBootstrapService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.run();
  }

  load(): PluginWorkflowDefinition[] {
    return this.pluginWorkflowRegistry.list() as PluginWorkflowDefinition[];
  }

  async synchronize(workflows: PluginWorkflowDefinition[]): Promise<void> {
    for (const workflow of workflows) {
      await this.syncWorkflow(workflow);
    }
  }

  private async syncWorkflow(workflow: PluginWorkflowDefinition): Promise<void> {
    const existing = await this.workflowRepository.findDefinitionByCode(workflow.code);

    if (existing) {
      this.logger.log(`Workflow already exists: ${workflow.code}`);
      return;
    }

    const input = this.toCreateInput(workflow);

    await this.workflowRepository.createDefinition(input);

    this.logger.log(`Workflow registered from plugin registry: ${workflow.code}`);
  }

  private toCreateInput(workflow: PluginWorkflowDefinition): CreateWorkflowDefinitionInput {
    return {
      code: workflow.code,
      name: workflow.name,
      description: workflow.description,
      entityType: workflow.entityType,
      initialState: workflow.initialState,
      states: workflow.states.map((state, index) => {
        if (typeof state === 'string') {
          return {
            code: state,
            name: this.toTitle(state),
            isInitial: state === workflow.initialState,
            isFinal: this.isFinalState(state),
            sortOrder: index,
            metadata: {},
          };
        }

        return {
          code: state.code,
          name: state.name ?? this.toTitle(state.code),
          isInitial: state.isInitial ?? state.code === workflow.initialState,
          isFinal: state.isFinal ?? this.isFinalState(state.code),
          sortOrder: state.sortOrder ?? index,
          metadata: state.metadata ?? {},
        };
      }),
      transitions: workflow.transitions.map((transition) => {
        const fromState = transition.fromState ?? transition.from;
        const toState = transition.toState ?? transition.to;
        const actionCode = transition.actionCode ?? transition.action;

        if (!fromState || !toState || !actionCode) {
          throw new Error(`Invalid workflow transition in ${workflow.code}`);
        }

        return {
          fromState,
          toState,
          actionCode,
          actionName: transition.actionName ?? this.toTitle(actionCode),
          requiredPermission: transition.requiredPermission,
          metadata: transition.metadata ?? {},
        };
      }),
      metadata: {
        ...(workflow.metadata ?? {}),
        source: 'plugin-registry',
      },
    };
  }

  private isFinalState(state: string): boolean {
    return [
      'CLOSED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED',
      'NO_SHOW',
    ].includes(state);
  }

  private toTitle(value: string): string {
    return value
      .toLowerCase()
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
