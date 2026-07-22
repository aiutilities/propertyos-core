import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac, timingSafeEqual } from 'crypto';

import {
  PUBLIC_ROUTE_METADATA_KEY,
} from '../decorators/public.decorator';
import { AuthRequest } from '../types/auth-request.type';

const AUTH_SECRET = process.env.AUTH_SECRET ?? 'propertyos-dev-secret-change-me';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(
        PUBLIC_ROUTE_METADATA_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (isPublic === true) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);
    request.user = this.validateToken(token);

    return true;
  }

  private validateToken(token: string) {
    const [encodedHeader, encodedBody, signature] = token.split('.');

    if (!encodedHeader || !encodedBody || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = createHmac('sha256', AUTH_SECRET)
      .update(`${encodedHeader}.${encodedBody}`)
      .digest('base64url');

    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = JSON.parse(
      Buffer.from(encodedBody, 'base64url').toString('utf8'),
    );

    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.email || !payload.exp || payload.exp < now) {
      throw new UnauthorizedException('Token expired or invalid');
    }

    return payload;
  }
}
