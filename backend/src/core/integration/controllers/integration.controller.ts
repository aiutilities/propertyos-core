import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ExecuteIntegrationActionDto } from '../dto/execute-integration-action.dto';
import { RegisterIntegrationDto } from '../dto/register-integration.dto';
import { IntegrationService } from '../services/integration.service';

@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('connectors')
  listConnectors() {
    return this.integrationService.listConnectors();
  }

  @Post()
  register(@Body() dto: RegisterIntegrationDto) {
    return this.integrationService.register(dto);
  }

  @Get()
  list() {
    return this.integrationService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.integrationService.get(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.integrationService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.integrationService.deactivate(id);
  }

  @Post('execute')
  execute(@Body() dto: ExecuteIntegrationActionDto) {
    return this.integrationService.execute(dto);
  }
}
