import { Module } from '@nestjs/common';

import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { VisitorRepository } from './visitor.repository';

@Module({
  controllers: [VisitorController],
  providers: [VisitorService, VisitorRepository],
  exports: [VisitorService],
})
export class VisitorModule {}
