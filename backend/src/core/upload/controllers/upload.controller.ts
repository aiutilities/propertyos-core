import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { UploadObjectDto } from "../dto/upload-object.dto";
import { UploadService } from "../services/upload.service";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Uploads")
@ApiBearerAuth("JWT")
@Controller("uploads")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @RequirePermission(Permissions.UPLOAD_CREATE)
  async upload(@Body() dto: UploadObjectDto) {
    return {
      success: true,
      data: {
        upload: await this.uploadService.upload(dto),
      },
    };
  }
}
