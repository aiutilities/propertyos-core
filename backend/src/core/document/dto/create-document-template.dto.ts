import { DocumentTemplateType } from '../types/document.types';

export class CreateDocumentTemplateDto {
  name!: string;
  code!: string;
  description?: string;
  templateType?: DocumentTemplateType;
  content!: string;
  variables?: string[];
}
