import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PlatformException } from '../exceptions/platform.exception';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { requestId?: string }>();
    const response = context.getResponse<Response>();

    const requestId =
      request.requestId ||
      String(request.headers[REQUEST_ID_HEADER] || '') ||
      undefined;

    const error = this.normalizeError(exception);

    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private normalizeError(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    if (exception instanceof PlatformException) {
      return {
        statusCode: this.mapPlatformStatus(exception.code),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode,
          code: this.mapHttpStatusCode(statusCode),
          message: response,
        };
      }

      const body = response as Record<string, unknown>;
      const message = Array.isArray(body.message)
        ? body.message.join('; ')
        : String(body.message ?? exception.message);

      return {
        statusCode,
        code: String(body.error ?? this.mapHttpStatusCode(statusCode))
          .toUpperCase()
          .replace(/\\s+/g, '_'),
        message,
        details: body,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };
  }

  private mapPlatformStatus(code: string): number {
    switch (code) {
      case 'PLATFORM_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'PLATFORM_VALIDATION_ERROR':
        return HttpStatus.BAD_REQUEST;
      case 'PLATFORM_CONFLICT':
        return HttpStatus.CONFLICT;
      case 'PLATFORM_UNAUTHORIZED':
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private mapHttpStatusCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'HTTP_ERROR';
    }
  }
}
