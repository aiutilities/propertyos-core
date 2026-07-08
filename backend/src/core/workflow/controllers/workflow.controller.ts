import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { CreateWorkflowDefinitionDto } from '../dto/create-workflow-definition.dto';
import { StartWorkflowDto } from '../dto/start-workflow.dto';
import { TransitionWorkflowDto } from '../dto/transition-workflow.dto';
import { StartWorkflowByCodeDto } from '../dto/start-workflow-by-code.dto';
import { TransitionWorkflowByEntityDto } from '../dto/transition-workflow-by-entity.dto';
import { WorkflowService } from '../services/workflow.service';

@Controller('workflows')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('definitions')
  @RequirePermission(Permissions.WORKFLOW_CREATE)
  async createDefinition(@Body() dto: CreateWorkflowDefinitionDto) {
    const definition = await this.workflowService.createDefinition(dto);

    return {
      success: true,
      data: {
        definition,
      },
    };
  }

  @Get('definitions')
  @RequirePermission(Permissions.WORKFLOW_READ)
  async listDefinitions() {
    const definitions = await this.workflowService.listDefinitions();

    return {
      success: true,
      data: {
        definitions,
      },
    };
  }

  @Get('definitions/code/:code')
  @RequirePermission(Permissions.WORKFLOW_READ)
  async getDefinitionByCode(@Param('code') code: string) {
    const definition = await this.workflowService.getDefinitionByCode(code);

    return {
      success: true,
      data: {
        definition,
      },
    };
  }

  @Get('definitions/:id')
  @RequirePermission(Permissions.WORKFLOW_READ)
  async getDefinition(@Param('id') id: string) {
    const definition = await this.workflowService.getDefinition(id);

    return {
      success: true,
      data: {
        definition,
      },
    };
  }


  @Get('metrics')
  @RequirePermission(Permissions.WORKFLOW_READ)
  async getMetrics() {
    const metrics = await this.workflowService.getMetrics();

    return {
      success: true,
      data: {
        metrics,
      },
    };
  }

  @Post('instances/by-code')
  @RequirePermission(Permissions.WORKFLOW_CREATE)
  async startWorkflowByCode(@Body() dto: StartWorkflowByCodeDto) {
    const instance = await this.workflowService.startWorkflowByCode(dto);

    return {
      success: true,
      data: {
        instance,
      },
    };
  }

  @Post('instances/by-entity/transitions')
  @RequirePermission(Permissions.WORKFLOW_CREATE)
  async transitionWorkflowByEntity(@Body() dto: TransitionWorkflowByEntityDto) {
    const instance = await this.workflowService.transitionWorkflowByEntity(dto);

    return {
      success: true,
      data: {
        instance,
      },
    };
  }

  @Get('instances/by-entity/:entityType/:entityId')
  @RequirePermission(Permissions.WORKFLOW_READ)
  async getInstanceByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const instance = await this.workflowService.getInstanceByEntity(
      entityType,
      entityId,
    );

    return {
      success: true,
      data: {
        instance,
      },
    };
  }

  @Post('instances')
  @RequirePermission(Permissions.WORKFLOW_CREATE)
  async startWorkflow(@Body() dto: StartWorkflowDto) {
    const instance = await this.workflowService.startWorkflow(dto);

    return {
      success: true,
      data: {
        instance,
      },
    };
  }

  @Get('instances/:id')
  @RequirePermission(Permissions.WORKFLOW_READ)
  async getInstance(@Param('id') id: string) {
    const instance = await this.workflowService.getInstance(id);

    return {
      success: true,
      data: {
        instance,
      },
    };
  }

  @Post('instances/:id/transitions')
  @RequirePermission(Permissions.WORKFLOW_CREATE)
  async transitionWorkflow(
    @Param('id') id: string,
    @Body() dto: TransitionWorkflowDto,
  ) {
    const instance = await this.workflowService.transitionWorkflow(id, dto);

    return {
      success: true,
      data: {
        instance,
      },
    };
  }
}
