import { Body, Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { StoreObjectDto } from '../dto/store-object.dto';
import { StorageService } from '../services/storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('objects')
  async store(@Body() dto: StoreObjectDto) {
    return {
      success: true,
      data: {
        object: await this.storageService.store(dto),
      },
    };
  }

  @Get('objects')
  async list() {
    return {
      success: true,
      data: {
        objects: await this.storageService.list(),
      },
    };
  }

  @Get('objects/:id/content')
  async getContent(@Param('id') id: string, @Res() res: Response) {
    const content = await this.storageService.getContent(id);

    res.send(content);
  }

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
