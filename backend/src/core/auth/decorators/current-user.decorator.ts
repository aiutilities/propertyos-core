import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthRequest } from '../types/auth-request.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    return request.user;
  },
);
