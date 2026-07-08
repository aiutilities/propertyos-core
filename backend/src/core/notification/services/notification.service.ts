import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  NotificationChannel,
  NotificationMessage,
} from '../types/notification.types';

export type NotificationTemplate = {
  code: string;
  event: string;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationService {
  private readonly templates = new Map<string, NotificationTemplate>();

  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createNotification(input: {
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationMessage> {
    const result = await this.pool.query(
      `
      INSERT INTO notifications (
        id,
        channel,
        recipient,
        subject,
        message,
        status,
        metadata,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
      `,
      [
        randomUUID(),
        input.channel,
        input.recipient,
        input.subject ?? null,
        input.message,
        'PENDING',
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return this.map(result.rows[0]);
  }

  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.code, template);
  }

  registerTemplates(templates: NotificationTemplate[]): void {
    for (const template of templates) {
      this.registerTemplate(template);
    }
  }

  listTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  async listNotifications(): Promise<NotificationMessage[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 500
      `,
    );

    return result.rows.map((row) => this.map(row));
  }

  private map(row: any): NotificationMessage {
    return {
      id: row.id,
      channel: row.channel,
      recipient: row.recipient,
      subject: row.subject,
      message: row.message,
      status: row.status,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    };
  }
}
