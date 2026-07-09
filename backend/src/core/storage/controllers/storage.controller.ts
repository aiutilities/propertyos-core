import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { StoreObjectDto } from '../dto/store-object.dto';
import { StorageService } from '../services/storage.service';

@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Storage')
@ApiBearerAuth('JWT')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @RequirePermission(Permissions.STORAGE_CREATE)
  @Post('objects')
  async store(@Body() dto: StoreObjectDto) {
    return {
      success: true,
      data: {
        object: await this.storageService.store(dto),
      },
    };
  }

  @RequirePermission(Permissions.STORAGE_READ)
  @Get('objects')
  async list() {
    return {
      success: true,
      data: {
        objects: await this.storageService.list(),
      },
    };
  }

  @RequirePermission(Permissions.STORAGE_READ)
  @Get('objects/:id/content')
  async getContent(@Param('id') id: string, @Res() res: Response) {
    const content = await this.storageService.getContent(id);

    res.send(content);
  }

  @RequirePermission(Permissions.STORAGE_CREATE)
  @Delete('objects/:id')
  async delete(@Param('id') id: string) {
    await this.storageService.delete(id);

    return {
      success: true,
      data: {
        deleted: true,
      },
    };
  }
}
