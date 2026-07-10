import { Test } from '@nestjs/testing';
import { Pool } from 'pg';

import { EventBusModule } from '../../../src/core/eventbus/eventbus.module';
import { EventBusService } from '../../../src/core/eventbus/services/eventbus.service';
import { PostgresModule } from '../../../src/database/postgres/postgres.module';
import { POSTGRES_POOL } from '../../../src/database/postgres';

describe('EventBus persistence integration', () => {
  let eventBus: EventBusService;
  let pool: Pool;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PostgresModule, EventBusModule],
    }).compile();

    eventBus = moduleRef.get(EventBusService);
    pool = moduleRef.get(POSTGRES_POOL);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS eventbus_events (
        id UUID PRIMARY KEY,
        event_type VARCHAR(255) NOT NULL,
        source VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        correlation_id UUID NOT NULL,
        causation_id UUID NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS eventbus_dead_letters (
        id UUID PRIMARY KEY,
        event_id UUID NOT NULL,
        event_snapshot JSONB NOT NULL,
        handler_name VARCHAR(255) NOT NULL,
        error_message TEXT NOT NULL,
        attempt INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('persists published events and dead letters', async () => {
    const eventType = `eventbus.persistence.${Date.now()}`;

    const event = await eventBus.publish(
      eventType,
      'eventbus.persistence.test',
      {
        propertyId: 'property-001',
      },
      {
        metadata: {
          test: true,
        },
      },
    );

    const events = await eventBus.listEvents({
      type: eventType,
      source: 'eventbus.persistence.test',
      correlationId: event.correlationId,
      limit: 5,
    });

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(event.id);
    expect(events[0].payload.propertyId).toBe('property-001');
    expect(events[0].metadata.test).toBe(true);

    eventBus.subscribe(eventType, async function failingHandler() {
      throw new Error('Persistent dead letter failure');
    });

    await eventBus.publish(eventType, 'eventbus.persistence.test', {
      shouldFail: true,
    });

    const deadLetters = await eventBus.listPersistentDeadLetters();

    expect(
      deadLetters.some(
        (deadLetter) =>
          deadLetter.event.type === eventType &&
          deadLetter.handlerName === 'failingHandler' &&
          deadLetter.errorMessage === 'Persistent dead letter failure',
      ),
    ).toBe(true);

    await eventBus.clearDeadLetters();

    const clearedDeadLetters = await eventBus.listPersistentDeadLetters();
    expect(clearedDeadLetters).toHaveLength(0);
  });
});
