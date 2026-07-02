import { Module } from '@nestjs/common';
import { PropertyService } from './services/property.service';

@Module({
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
