import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [IdentityModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionGuard],
  exports: [
    AuthService,
    JwtAuthGuard,
    PermissionGuard,
    IdentityModule,
  ],
})
export class AuthModule {}
