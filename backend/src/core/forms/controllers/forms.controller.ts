import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateFormDto } from '../dto/create-form.dto';
import { FormsService } from '../services/forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly service: FormsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateFormDto) {
    return this.service.create(dto);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() values: Record<string, unknown>,
  ) {
    return this.service.submit(id, values);
  }
}
