import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateWorkflowDefinitionDto } from '../dto/create-workflow-definition.dto';
import { StartWorkflowDto } from '../dto/start-workflow.dto';
import { TransitionWorkflowDto } from '../dto/transition-workflow.dto';
import { WorkflowService } from '../services/workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('definitions')
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
  async listDefinitions() {
    const definitions = await this.workflowService.listDefinitions();

    return {
      success: true,
      data: {
        definitions,
      },
    };
  }

  @Get('definitions/:id')
  async getDefinition(@Param('id') id: string) {
    const definition = await this.workflowService.getDefinition(id);

    return {
      success: true,
      data: {
        definition,
      },
    };
  }

  @Post('instances')
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
