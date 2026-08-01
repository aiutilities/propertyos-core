import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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

import { RequirePermission } from "@propertyos/core-contracts";
import { JwtAuthGuard } from "@propertyos/core-contracts";
import { PermissionGuard } from "@propertyos/core-contracts";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { RecordStaffAttendanceDto } from "../dto/record-staff-attendance.dto";
import { UpdateStaffStatusDto } from "../dto/update-staff-status.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
import { StaffService } from "../services/staff.service";
import { STAFF_PERMISSIONS } from "../staff.constants";
import { StaffStatus, StaffType } from "../types/staff.types";

@ApiTags("Staff")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("/staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @RequirePermission(STAFF_PERMISSIONS.READ)
  @Get()
  async list(
    @Query("propertyId")
    propertyId?: string,
    @Query("zoneId")
    zoneId?: string,
    @Query("personId")
    personId?: string,
    @Query("staffType")
    staffType?: StaffType,
    @Query("status")
    status?: StaffStatus,
    @Query("employeeCode")
    employeeCode?: string,
    @Query("search")
    search?: string,
  ) {
    return this.success(
      await this.staffService.list({
        propertyId,
        zoneId,
        personId,
        staffType,
        status,
        employeeCode,
        search,
      }),
    );
  }

  @RequirePermission(STAFF_PERMISSIONS.CREATE)
  @Post()
  async create(@Body() dto: CreateStaffDto) {
    return this.success(await this.staffService.create(dto));
  }

  @RequirePermission(STAFF_PERMISSIONS.READ)
  @Get("metrics")
  async metrics(
    @Query("propertyId")
    propertyId?: string,
  ) {
    return this.success(await this.staffService.getMetrics(propertyId));
  }

  @RequirePermission(STAFF_PERMISSIONS.SECURITY)
  @Get("lookup/employee/:employeeCode")
  async lookupByEmployeeCode(
    @Param("employeeCode")
    employeeCode: string,
    @Query("propertyId")
    propertyId: string,
  ) {
    return this.success(
      await this.staffService.lookupByEmployeeCode(propertyId, employeeCode),
    );
  }

  @RequirePermission(STAFF_PERMISSIONS.SECURITY)
  @Get("lookup/qr/:qrCode")
  async lookupByQrCode(
    @Param("qrCode")
    qrCode: string,
  ) {
    return this.success(await this.staffService.lookupByQrCode(qrCode));
  }

  @RequirePermission(STAFF_PERMISSIONS.SECURITY)
  @Get("lookup/rfid/:rfidTag")
  async lookupByRfidTag(
    @Param("rfidTag")
    rfidTag: string,
  ) {
    return this.success(await this.staffService.lookupByRfidTag(rfidTag));
  }

  @RequirePermission(STAFF_PERMISSIONS.READ)
  @Get(":id")
  async get(@Param("id") id: string) {
    return this.success(await this.staffService.get(id));
  }

  @RequirePermission(STAFF_PERMISSIONS.MANAGE)
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.success(await this.staffService.update(id, dto));
  }

  @RequirePermission(STAFF_PERMISSIONS.MANAGE)
  @Post(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStaffStatusDto,
  ) {
    return this.success(await this.staffService.updateStatus(id, dto));
  }

  @RequirePermission(STAFF_PERMISSIONS.SECURITY)
  @Post(":id/attendance")
  async recordAttendance(
    @Param("id") id: string,
    @Body()
    dto: RecordStaffAttendanceDto,
  ) {
    return this.success(await this.staffService.recordAttendance(id, dto));
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
