import { Injectable } from '@nestjs/common';
import { LogContext } from './log-context.type';
import { PlatformLogger } from './platform-logger.interface';

@Injectable()
export class ConsolePlatformLogger implements PlatformLogger {
  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write('error', message, context);
  }

  private write(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: LogContext,
  ): void {
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    const output = JSON.stringify(entry);

    if (level === 'error') {
      process.stderr.write(`${output}\n`);
      return;
    }

    process.stdout.write(`${output}\n`);
  }
}
