import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { EventBusService } from '../../eventbus/services/eventbus.service';
import { CreateWorkflowDefinitionDto } from '../dto/create-workflow-definition.dto';
import { StartWorkflowDto } from '../dto/start-workflow.dto';
import { TransitionWorkflowDto } from '../dto/transition-workflow.dto';
import { StartWorkflowByCodeDto } from '../dto/start-workflow-by-code.dto';
import { TransitionWorkflowByEntityDto } from '../dto/transition-workflow-by-entity.dto';
import {
  WORKFLOW_REPOSITORY,
  WorkflowRepository,
} from '../repositories/workflow-repository.interface';

@Injectable()
export class WorkflowService {
  private readonly eventSource = 'workflow.service';

  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflowRepository: WorkflowRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async createDefinition(dto: CreateWorkflowDefinitionDto) {
    const existing = await this.workflowRepository.findDefinitionByCode(dto.code);

    if (existing) {
      throw new BadRequestException('Workflow definition code already exists');
    }

    const hasInitialState = dto.states.some((state) => state.code === dto.initialState);

    if (!hasInitialState) {
      throw new BadRequestException('Initial state must exist in workflow states');
    }

    return this.workflowRepository.createDefinition(dto);
  }

  async listDefinitions() {
    return this.workflowRepository.listDefinitions();
  }

  async getDefinition(id: string) {
    const definition = await this.workflowRepository.findDefinitionById(id);

    if (!definition) {
      throw new NotFoundException('Workflow definition not found');
    }

    const states = await this.workflowRepository.listStates(id);
    const transitions = await this.workflowRepository.listTransitions(id);

    return {
      ...definition,
      states,
      transitions,
    };
  }


  async getDefinitionByCode(code: string) {
    const definition = await this.workflowRepository.findDefinitionByCode(code);

    if (!definition) {
      throw new NotFoundException('Workflow definition not found');
    }

    const states = await this.workflowRepository.listStates(definition.id);
    const transitions = await this.workflowRepository.listTransitions(definition.id);

    return {
      ...definition,
      states,
      transitions,
    };
  }

  async getInstanceByEntity(entityType: string, entityId: string) {
    const instance = await this.workflowRepository.findInstanceByEntity(
      entityType,
      entityId,
    );

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    const history = await this.workflowRepository.listHistory(instance.id);

    return {
      ...instance,
      history,
    };
  }

  async startWorkflowByCode(dto: StartWorkflowByCodeDto) {
    const definition = await this.workflowRepository.findDefinitionByCode(
      dto.workflowCode,
    );

    if (!definition) {
      throw new NotFoundException('Workflow definition not found');
    }

    return this.startWorkflow({
      workflowDefinitionId: definition.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      createdBy: dto.createdBy,
      metadata: dto.metadata,
    });
  }

  async transitionWorkflowByEntity(dto: TransitionWorkflowByEntityDto) {
    const instance = await this.workflowRepository.findInstanceByEntity(
      dto.entityType,
      dto.entityId,
    );

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    return this.transitionWorkflow(instance.id, {
      actionCode: dto.actionCode,
      actorId: dto.actorId,
      notes: dto.notes,
      metadata: dto.metadata,
    });
  }

  async startWorkflow(dto: StartWorkflowDto) {
    const definition = await this.workflowRepository.findDefinitionById(dto.workflowDefinitionId);

    if (!definition) {
      throw new NotFoundException('Workflow definition not found');
    }

    if (!definition.isActive) {
      throw new BadRequestException('Workflow definition is inactive');
    }

    const existing = await this.workflowRepository.findInstanceByEntity(dto.entityType, dto.entityId);

    if (existing) {
      throw new BadRequestException('Workflow instance already exists for this entity');
    }

    const instance = await this.workflowRepository.startInstance(dto);

    await this.workflowRepository.addHistory({
      workflowInstanceId: instance.id,
      fromState: null,
      toState: instance.currentState,
      actionCode: 'START',
      actorId: dto.createdBy ?? null,
      metadata: dto.metadata ?? {},
    });

    await this.eventBus.publish('workflow.started', this.eventSource, {
      workflowInstanceId: instance.id,
      workflowDefinitionId: instance.workflowDefinitionId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      currentState: instance.currentState,
      status: instance.status,
      createdBy: instance.createdBy ?? null,
      metadata: dto.metadata ?? {},
    });

    return instance;
  }

  async getInstance(id: string) {
    const instance = await this.workflowRepository.findInstanceById(id);

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    const history = await this.workflowRepository.listHistory(id);

    return {
      ...instance,
      history,
    };
  }

  async transitionWorkflow(instanceId: string, dto: TransitionWorkflowDto) {
    const instance = await this.workflowRepository.findInstanceById(instanceId);

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== 'ACTIVE') {
      throw new BadRequestException('Only active workflow instances can transition');
    }

    const transition = await this.workflowRepository.findTransition(
      instance.workflowDefinitionId,
      instance.currentState,
      dto.actionCode,
    );

    if (!transition) {
      throw new BadRequestException('Invalid workflow transition');
    }

    const states = await this.workflowRepository.listStates(instance.workflowDefinitionId);
    const targetState = states.find((state) => state.code === transition.toState);
    const nextStatus = targetState?.isFinal ? 'COMPLETED' : 'ACTIVE';

    const updatedInstance = await this.workflowRepository.transitionInstance(
      {
        workflowInstanceId: instanceId,
        actionCode: dto.actionCode,
        actorId: dto.actorId,
        notes: dto.notes,
        metadata: dto.metadata,
      },
      transition.toState,
      nextStatus,
    );

    await this.workflowRepository.addHistory({
      workflowInstanceId: instanceId,
      fromState: instance.currentState,
      toState: transition.toState,
      actionCode: dto.actionCode,
      actorId: dto.actorId ?? null,
      notes: dto.notes ?? null,
      metadata: dto.metadata ?? {},
    });

    await this.eventBus.publish('workflow.transitioned', this.eventSource, {
      workflowInstanceId: updatedInstance.id,
      workflowDefinitionId: updatedInstance.workflowDefinitionId,
      entityType: updatedInstance.entityType,
      entityId: updatedInstance.entityId,
      fromState: instance.currentState,
      toState: updatedInstance.currentState,
      actionCode: dto.actionCode,
      actorId: dto.actorId ?? null,
      status: updatedInstance.status,
      metadata: dto.metadata ?? {},
    });

    if (updatedInstance.status === 'COMPLETED') {
      await this.eventBus.publish('workflow.completed', this.eventSource, {
        workflowInstanceId: updatedInstance.id,
        workflowDefinitionId: updatedInstance.workflowDefinitionId,
        entityType: updatedInstance.entityType,
        entityId: updatedInstance.entityId,
        finalState: updatedInstance.currentState,
        actorId: dto.actorId ?? null,
        metadata: dto.metadata ?? {},
      });
    }

    return updatedInstance;
  }
}
