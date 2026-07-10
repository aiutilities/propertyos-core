import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateFormDto } from '../dto/create-form.dto';
import { SubmitFormDto } from '../dto/submit-form.dto';
import { FormsService } from '../services/forms.service';
import { FormStatus } from '../types/forms.types';

@ApiTags('Forms')
@ApiBearerAuth('JWT')
@Controller('forms')
export class FormsController {
  constructor(private readonly service: FormsService) {}

  @Get()
  list(
    @Query('status') status?: FormStatus,
    @Query('code') code?: string,
  ) {
    return this.service.list({ status, code });
  }

  @Get('code/:code')
  getByCode(@Param('code') code: string) {
    return this.service.getByCode(code);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateFormDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: FormStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitFormDto,
  ) {
    return this.service.submit(id, dto);
  }

  @Get(':id/submissions')
  listSubmissions(@Param('id') id: string) {
    return this.service.listSubmissions(id);
  }
}
