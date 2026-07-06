import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { DocumentController } from './controllers/document.controller';
import { PostgresDocumentRepository } from './repositories/postgres-document.repository';
import { DocumentService } from './services/document.service';

@Module({
  imports: [EventBusModule],
  controllers: [DocumentController],
  providers: [DocumentService, PostgresDocumentRepository],
  exports: [DocumentService, PostgresDocumentRepository],
})
export class DocumentModule {}
