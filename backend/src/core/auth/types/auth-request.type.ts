import type { Request } from 'express';

import { AuthTokenPayload } from '../services/auth.service';

export type AuthRequest = Request & {
  user?: AuthTokenPayload;
};
