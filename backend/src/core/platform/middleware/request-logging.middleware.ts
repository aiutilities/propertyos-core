import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ConsolePlatformLogger } from '../logging';
import { REQUEST_ID_HEADER } from './request-id.middleware';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: ConsolePlatformLogger) {}

  use(request: Request & { requestId?: string }, response: Response, next: NextFunction) {
    const startedAt = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const requestId =
        request.requestId ||
        String(request.headers[REQUEST_ID_HEADER] || '') ||
        undefined;

      this.logger.info('http.request.completed', {
        requestId,
        method: request.method,
        url: request.originalUrl || request.url,
        statusCode: response.statusCode,
        durationMs,
        ip: request.ip,
        userAgent: request.header('user-agent'),
      });
    });

    next();
  }
}
