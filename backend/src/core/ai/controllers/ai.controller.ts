import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { GenerateAiResponseDto } from '../dto/generate-ai-response.dto';
import { AiService } from '../services/ai.service';

@ApiTags('AI')
@ApiBearerAuth('JWT')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('providers')
  listProviders() {
    return this.aiService.listProviders();
  }

  @Post('generate')
  generate(@Body() dto: GenerateAiResponseDto) {
    return this.aiService.generate(dto);
  }
}
