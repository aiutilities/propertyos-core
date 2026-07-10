import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../../metrics';
import { ConsolePlatformLogger } from '../logging';
import { REQUEST_ID_HEADER } from './request-id.middleware';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: ConsolePlatformLogger,
    private readonly metricsService: MetricsService,
  ) {}

  use(request: Request & { requestId?: string }, response: Response, next: NextFunction) {
    const startedAt = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const requestId =
        request.requestId ||
        String(request.headers[REQUEST_ID_HEADER] || '') ||
        undefined;

      const labels = {
        method: request.method,
        route: request.route?.path || request.originalUrl || request.url,
        statusCode: response.statusCode,
      };

      this.metricsService.incrementCounter({
        name: 'http_requests_total',
        help: 'Total number of completed HTTP requests.',
        labels,
      });

      this.metricsService.observeHistogram({
        name: 'http_request_duration_ms',
        help: 'Observed HTTP request duration in milliseconds.',
        labels,
        value: durationMs,
      });

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
