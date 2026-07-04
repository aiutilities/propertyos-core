import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { IdentityService } from '../../identity/services/identity.service';

const AUTH_SECRET = process.env.AUTH_SECRET ?? 'propertyos-dev-secret-change-me';

@Injectable()
export class AuthService {
  constructor(private readonly identityService: IdentityService) {}

  verifyPassword(password: string, storedValue: string): boolean {
    const [algorithm, salt, expectedHash] = storedValue.split(':');

    if (algorithm !== 'sha256' || !salt || !expectedHash) {
      return false;
    }

    const actualHash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(actualHash),
      Buffer.from(expectedHash),
    );
  }

  async login(email: string, password: string) {
    const persons = await this.identityService.listPersons();
    const person = persons.find((item) => item.email === email);

    if (!person) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const credentials = await this.identityService.listCredentials();
    const passwordCredential = credentials.find(
      (credential) =>
        credential.personId === person.id &&
        credential.type === 'PASSWORD',
    );

    if (!passwordCredential) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = this.verifyPassword(password, passwordCredential.value);

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: this.signToken({
        sub: person.id,
        email: person.email,
        displayName: person.displayName,
      }),
      person,
    };
  }

  private signToken(payload: Record<string, unknown>): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...payload,
      iat: now,
      exp: now + 60 * 60 * 8,
    };

    const encodedHeader = this.base64Url(JSON.stringify(header));
    const encodedBody = this.base64Url(JSON.stringify(body));
    const signature = createHmac('sha256', AUTH_SECRET)
      .update(`${encodedHeader}.${encodedBody}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedBody}.${signature}`;
  }

  private base64Url(value: string): string {
    return Buffer.from(value).toString('base64url');
  }
}
