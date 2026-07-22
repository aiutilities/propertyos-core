import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { AuthService } from './services/auth.service';

@ApiTags('Auth')
@ApiBearerAuth('JWT')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
