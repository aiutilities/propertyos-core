import { Module } from '@nestjs/common';

import { EventBusModule } from '../eventbus/eventbus.module';
import { SearchModule } from '../search';
import { DocumentController } from './controllers/document.controller';
import { PostgresDocumentRepository } from './repositories/postgres-document.repository';
import { DocumentService } from './services/document.service';
import { DocumentSearchProviderService } from './document-search-provider.service';

@Module({
  imports: [EventBusModule, SearchModule],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentSearchProviderService,
    PostgresDocumentRepository,
  ],
  exports: [DocumentService, PostgresDocumentRepository],
})
export class DocumentModule {}
