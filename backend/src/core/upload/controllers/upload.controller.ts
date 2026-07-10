import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { UploadObjectDto } from '../dto/upload-object.dto';
import { UploadService } from '../services/upload.service';

@ApiTags('Uploads')
@ApiBearerAuth('JWT')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async upload(@Body() dto: UploadObjectDto) {
    return {
      success: true,
      data: {
        upload: await this.uploadService.upload(dto),
      },
    };
  }
}
