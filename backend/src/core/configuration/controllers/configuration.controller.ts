import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { ConfigurationService } from '../services/configuration.service';
import { ConfigurationScope } from '../types/configuration.types';

@ApiTags('Configuration')
@ApiBearerAuth('JWT')
@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly configurationService: ConfigurationService,
  ) {}

  @Post('settings')
  async upsert(@Body() dto: CreateSettingDto) {
    return {
      success: true,
      data: {
        setting: await this.configurationService.upsert(dto),
      },
    };
  }

  @Get('settings')
  async list(
    @Query('scopeType') scopeType?: ConfigurationScope,
    @Query('scopeId') scopeId?: string,
  ) {
    return {
      success: true,
      data: {
        settings: await this.configurationService.list(scopeType, scopeId),
      },
    };
  }

  @Get('settings/:scopeType/:key')
  async getByScopeAndKey(
    @Param('scopeType') scopeType: ConfigurationScope,
    @Param('key') key: string,
    @Query('scopeId') scopeId?: string,
  ) {
    return {
      success: true,
      data: {
        setting: await this.configurationService.getByScopeAndKey(
          scopeType,
          scopeId,
          key,
        ),
      },
    };
  }

  @Patch('settings/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return {
      success: true,
      data: {
        setting: await this.configurationService.update(id, dto),
      },
    };
  }

  @Delete('settings/:id')
  async delete(@Param('id') id: string) {
    await this.configurationService.delete(id);

    return {
      success: true,
      data: {
        deleted: true,
      },
    };
  }
}
