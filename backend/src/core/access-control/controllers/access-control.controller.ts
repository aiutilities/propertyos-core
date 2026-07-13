import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { ACCESS_CONTROL_PERMISSIONS } from "../access-control.constants";
import { CreateAccessGrantDto } from "../dto/create-access-grant.dto";
import { CreateAccessPointDto } from "../dto/create-access-point.dto";
import { EvaluateAccessDto } from "../dto/evaluate-access.dto";
import { RevokeAccessGrantDto } from "../dto/revoke-access-grant.dto";
import { UpdateAccessPointDto } from "../dto/update-access-point.dto";
import { AccessControlService } from "../services/access-control.service";
import {
  AccessDecision,
  AccessEventType,
  AccessGrantStatus,
  AccessPointStatus,
  AccessPointType,
  AccessSubjectType,
} from "../types/access-control.types";

@ApiTags("Access Control")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("/access-control")
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("points")
  async listAccessPoints(
    @Query("propertyId")
    propertyId?: string,
    @Query("zoneId")
    zoneId?: string,
    @Query("spaceId")
    spaceId?: string,
    @Query("accessPointType")
    accessPointType?: AccessPointType,
    @Query("status")
    status?: AccessPointStatus,
    @Query("search")
    search?: string,
  ) {
    return this.success(
      await this.accessControlService.listAccessPoints({
        propertyId,
        zoneId,
        spaceId,
        accessPointType,
        status,
        search,
      }),
    );
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.CREATE)
  @Post("points")
  async createAccessPoint(@Body() dto: CreateAccessPointDto) {
    return this.success(await this.accessControlService.createAccessPoint(dto));
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("points/lookup/:code")
  async lookupAccessPoint(
    @Param("code") code: string,
    @Query("propertyId")
    propertyId: string,
  ) {
    return this.success(
      await this.accessControlService.lookupAccessPoint(propertyId, code),
    );
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("points/:id")
  async getAccessPoint(@Param("id") id: string) {
    return this.success(await this.accessControlService.getAccessPoint(id));
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.MANAGE)
  @Patch("points/:id")
  async updateAccessPoint(
    @Param("id") id: string,
    @Body() dto: UpdateAccessPointDto,
  ) {
    return this.success(
      await this.accessControlService.updateAccessPoint(id, dto),
    );
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("grants")
  async listGrants(
    @Query("accessPointId")
    accessPointId?: string,
    @Query("subjectType")
    subjectType?: AccessSubjectType,
    @Query("subjectId")
    subjectId?: string,
    @Query("status")
    status?: AccessGrantStatus,
  ) {
    return this.success(
      await this.accessControlService.listGrants({
        accessPointId,
        subjectType,
        subjectId,
        status,
      }),
    );
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.CREATE)
  @Post("grants")
  async createGrant(@Body() dto: CreateAccessGrantDto) {
    return this.success(await this.accessControlService.createGrant(dto));
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("grants/:id")
  async getGrant(@Param("id") id: string) {
    return this.success(await this.accessControlService.getGrant(id));
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.MANAGE)
  @Post("grants/:id/revoke")
  async revokeGrant(
    @Param("id") id: string,
    @Body() dto: RevokeAccessGrantDto,
  ) {
    return this.success(await this.accessControlService.revokeGrant(id, dto));
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.OPERATE)
  @Post("evaluate")
  async evaluate(@Body() dto: EvaluateAccessDto) {
    return this.success(await this.accessControlService.evaluateAccess(dto));
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("events")
  async listEvents(
    @Query("accessPointId")
    accessPointId?: string,
    @Query("propertyId")
    propertyId?: string,
    @Query("subjectType")
    subjectType?: AccessSubjectType,
    @Query("subjectId")
    subjectId?: string,
    @Query("eventType")
    eventType?: AccessEventType,
    @Query("decision")
    decision?: AccessDecision,
    @Query("occurredFrom")
    occurredFrom?: string,
    @Query("occurredUntil")
    occurredUntil?: string,
    @Query("limit")
    limit?: string,
  ) {
    return this.success(
      await this.accessControlService.listEvents({
        accessPointId,
        propertyId,
        subjectType,
        subjectId,
        eventType,
        decision,
        occurredFrom: this.optionalDate(occurredFrom),
        occurredUntil: this.optionalDate(occurredUntil),
        limit: limit ? Number(limit) : undefined,
      }),
    );
  }

  @RequirePermission(ACCESS_CONTROL_PERMISSIONS.READ)
  @Get("metrics")
  async metrics(
    @Query("propertyId")
    propertyId?: string,
  ) {
    return this.success(await this.accessControlService.getMetrics(propertyId));
  }

  private optionalDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
