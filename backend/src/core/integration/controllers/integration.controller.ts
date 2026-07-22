import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ExecuteIntegrationActionDto } from "../dto/execute-integration-action.dto";
import { RegisterIntegrationDto } from "../dto/register-integration.dto";
import { IntegrationService } from "../services/integration.service";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Integrations")
@ApiBearerAuth("JWT")
@Controller("integrations")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get("connectors")
  @RequirePermission(Permissions.INTEGRATION_READ)
  listConnectors() {
    return this.integrationService.listConnectors();
  }

  @Post()
  @RequirePermission(Permissions.INTEGRATION_MANAGE)
  register(@Body() dto: RegisterIntegrationDto) {
    return this.integrationService.register(dto);
  }

  @Get()
  @RequirePermission(Permissions.INTEGRATION_READ)
  list() {
    return this.integrationService.list();
  }

  @Get(":id")
  @RequirePermission(Permissions.INTEGRATION_READ)
  get(@Param("id") id: string) {
    return this.integrationService.get(id);
  }

  @Patch(":id/activate")
  @RequirePermission(Permissions.INTEGRATION_MANAGE)
  activate(@Param("id") id: string) {
    return this.integrationService.activate(id);
  }

  @Patch(":id/deactivate")
  @RequirePermission(Permissions.INTEGRATION_MANAGE)
  deactivate(@Param("id") id: string) {
    return this.integrationService.deactivate(id);
  }

  @Post("execute")
  @RequirePermission(Permissions.INTEGRATION_MANAGE)
  execute(@Body() dto: ExecuteIntegrationActionDto) {
    return this.integrationService.execute(dto);
  }
}
