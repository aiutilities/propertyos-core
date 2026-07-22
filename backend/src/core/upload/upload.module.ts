import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConfigurationModule } from "../configuration";
import { StorageModule } from "../storage";
import { UploadController } from "./controllers/upload.controller";
import { UploadService } from "./services/upload.service";

@Module({
  imports: [ConfigurationModule, StorageModule, AuthModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
