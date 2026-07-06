import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDocumentTemplateDto } from '../dto/create-document-template.dto';
import { CreateDocumentVersionDto } from '../dto/create-document-version.dto';
import { GenerateDocumentDto } from '../dto/generate-document.dto';
import { DocumentService } from '../services/document.service';

@Controller()
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post('document-templates')
  createTemplate(@Body() dto: CreateDocumentTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Get('document-templates')
  listTemplates() {
    return this.service.listTemplates();
  }

  @Post('documents/generate')
  generate(@Body() dto: GenerateDocumentDto) {
    return this.service.generate(dto);
  }

  @Get('documents')
  listDocuments() {
    return this.service.listDocuments();
  }

  @Get('documents/:id')
  getDocument(@Param('id') id: string) {
    return this.service.getDocument(id);
  }

  @Post('documents/:id/versions')
  createVersion(
    @Param('id') id: string,
    @Body() dto: CreateDocumentVersionDto,
  ) {
    return this.service.createVersion(id, dto);
  }

  @Get('documents/:id/versions')
  listVersions(@Param('id') id: string) {
    return this.service.listVersions(id);
  }
}
