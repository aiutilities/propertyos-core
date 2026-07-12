import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuditService } from '../../src/core/audit/audit.service';
import { EventBusService } from '../../src/core/eventbus/services/eventbus.service';
import {
  VEHICLE_EVENTS,
  VEHICLE_PERMISSIONS,
} from '../../src/core/vehicle/vehicle.constants';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Vehicle Registry API integration', () => {
  let app: any;
  let pool: Pool;
  let eventBus: EventBusService;
  let auditService: AuditService;
  let accessToken: string;

  const timestamp = Date.now();
  const password =
    'CorrectHorseBatteryStaple123!';
  const email =
    `vehicle-e2e-${timestamp}@propertyos.test`;

  const personId = randomUUID();
  const securityPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const propertyId = randomUUID();
  const spaceId = randomUUID();

  const registrationNumber =
    `TN 59 AB ${String(timestamp).slice(-4)}`;

  let vehicleId = '';

  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);
    auditService = app.get(AuditService);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (
        id, display_name, email, phone, status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        personId,
        'Vehicle E2E Owner',
        email,
        '9000000201',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO persons (
        id, display_name, email, phone, status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        securityPersonId,
        'Vehicle E2E Security',
        `vehicle-security-${timestamp}@propertyos.test`,
        '9000000202',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO credentials (
        id, person_id, credential_type, credential_value
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        credentialId,
        personId,
        'PASSWORD',
        `sha256:${salt}:${hash}`,
      ],
    );

    await pool.query(
      `
      INSERT INTO roles (
        id, name, description
      )
      VALUES ($1,$2,$3)
      `,
      [
        roleId,
        `Vehicle E2E Role ${timestamp}`,
        'Vehicle integration test role',
      ],
    );

    for (const permission of [
      VEHICLE_PERMISSIONS.READ,
      VEHICLE_PERMISSIONS.CREATE,
      VEHICLE_PERMISSIONS.MANAGE,
      VEHICLE_PERMISSIONS.SECURITY,
    ]) {
      await pool.query(
        `
        INSERT INTO permissions (
          id, permission_key, description
        )
        VALUES ($1,$2,$3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [
          randomUUID(),
          permission,
          `Vehicle test permission: ${permission}`,
        ],
      );
    }

    await pool.query(
      `
      INSERT INTO person_roles (
        id, person_id, role_id
      )
      VALUES ($1,$2,$3)
      `,
      [personRoleId, personId, roleId],
    );

    for (const permission of [
      VEHICLE_PERMISSIONS.READ,
      VEHICLE_PERMISSIONS.CREATE,
      VEHICLE_PERMISSIONS.MANAGE,
      VEHICLE_PERMISSIONS.SECURITY,
    ]) {
      const result = await pool.query(
        `
        SELECT id
        FROM permissions
        WHERE permission_key = $1
        `,
        [permission],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (
          id, role_id, permission_id
        )
        VALUES ($1,$2,$3)
        `,
        [
          randomUUID(),
          roleId,
          result.rows[0].id,
        ],
      );
    }

    await pool.query(
      `
      INSERT INTO properties (
        id,
        name,
        code,
        property_type,
        description,
        city,
        state,
        country,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        propertyId,
        'Vehicle E2E Property',
        `VEH-E2E-${timestamp}`,
        'GATED_COMMUNITY',
        'Vehicle integration test property',
        'Madurai',
        'Tamil Nadu',
        'India',
        true,
      ],
    );

    await pool.query(
      `
      INSERT INTO spaces (
        id,
        property_id,
        zone_id,
        name,
        code,
        space_type,
        floor,
        description,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        spaceId,
        propertyId,
        null,
        'Vehicle E2E Unit',
        `VEH-SPACE-${timestamp}`,
        'UNIT',
        'Ground',
        'Vehicle integration test unit',
        true,
      ],
    );

    const login =
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    if (pool) {
      if (vehicleId) {
        await pool.query(
          `
          DELETE FROM audit_logs
          WHERE payload->>'entityId' = $1
             OR payload->>'vehicleId' = $1
          `,
          [vehicleId],
        );
      }

      await pool.query(
        `
        DELETE FROM vehicle_movements
        WHERE vehicle_id = $1
        `,
        [vehicleId || randomUUID()],
      );

      await pool.query(
        `
        DELETE FROM vehicles
        WHERE id = $1
        `,
        [vehicleId || randomUUID()],
      );

      await pool.query(
        `DELETE FROM spaces WHERE id = $1`,
        [spaceId],
      );

      await pool.query(
        `DELETE FROM properties WHERE id = $1`,
        [propertyId],
      );

      await pool.query(
        `DELETE FROM role_permissions WHERE role_id = $1`,
        [roleId],
      );

      await pool.query(
        `DELETE FROM person_roles WHERE person_id = $1`,
        [personId],
      );

      await pool.query(
        `DELETE FROM roles WHERE id = $1`,
        [roleId],
      );

      await pool.query(
        `DELETE FROM credentials WHERE person_id = $1`,
        [personId],
      );

      await pool.query(
        `DELETE FROM persons WHERE id IN ($1,$2)`,
        [personId, securityPersonId],
      );

      await pool.end();
    }

    if (app) {
      await app.close();
    }
  });

  it('rejects unauthenticated listing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .expect(401);
  });

  it('registers a pending vehicle', async () => {
    const response =
      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          registrationNumber,
          vehicleType: 'CAR',
          ownerPersonId: personId,
          propertyId,
          spaceId,
          parkingSlot: 'P-12',
          make: 'Tata',
          model: 'Nexon',
          colour: 'Blue',
          yearOfManufacture: 2024,
          rfidTag: `RFID-${timestamp}`,
          notes: 'Primary resident vehicle',
        })
        .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(
      'PENDING',
    );
    expect(
      response.body.data
        .normalizedRegistrationNumber,
    ).toMatch(/^TN59AB\d{4}$/);

    vehicleId = response.body.data.id;
  });

  it('rejects duplicate registration variants', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        registrationNumber:
          registrationNumber.replace(/\s/g, '-'),
        vehicleType: 'CAR',
        ownerPersonId: personId,
        propertyId,
      })
      .expect(409);
  });

  it('lists and searches the vehicle', async () => {
    const response =
      await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .query({
          propertyId,
          ownerPersonId: personId,
          status: 'PENDING',
          vehicleType: 'CAR',
          search: 'Nexon',
        })
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

    expect(
      response.body.data.some(
        (vehicle: any) =>
          vehicle.id === vehicleId,
      ),
    ).toBe(true);
  });

  it('looks up a vehicle by formatted registration number', async () => {
    const response =
      await request(app.getHttpServer())
        .get(
          `/api/v1/vehicles/lookup/${encodeURIComponent(
            registrationNumber,
          )}`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

    expect(response.body.data.id).toBe(vehicleId);
  });

  it('blocks movement before verification', async () => {
    await request(app.getHttpServer())
      .post(
        `/api/v1/vehicles/${vehicleId}/movements`,
      )
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        movementType: 'ENTRY',
        gate: 'Main Gate',
        recordedByPersonId:
          securityPersonId,
      })
      .expect(400);
  });

  it('verifies the vehicle', async () => {
    const response =
      await request(app.getHttpServer())
        .post(
          `/api/v1/vehicles/${vehicleId}/status`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          status: 'VERIFIED',
          changedByPersonId: personId,
        })
        .expect(201);

    expect(response.body.data.status).toBe(
      'VERIFIED',
    );
    expect(
      response.body.data.verifiedByPersonId,
    ).toBe(personId);
  });

  it('records entry and exit movements', async () => {
    for (const movementType of [
      'ENTRY',
      'EXIT',
    ]) {
      const response =
        await request(app.getHttpServer())
          .post(
            `/api/v1/vehicles/${vehicleId}/movements`,
          )
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .send({
            movementType,
            gate: 'Main Gate',
            recordedByPersonId:
              securityPersonId,
            remarks: `${movementType} recorded`,
          })
          .expect(201);

      expect(
        response.body.data.movementType,
      ).toBe(movementType);
    }
  });

  it('rejects duplicate consecutive movement', async () => {
    await request(app.getHttpServer())
      .post(
        `/api/v1/vehicles/${vehicleId}/movements`,
      )
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        movementType: 'EXIT',
        gate: 'Main Gate',
        recordedByPersonId:
          securityPersonId,
      })
      .expect(400);
  });

  it('returns details and movement history', async () => {
    const response =
      await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${vehicleId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

    expect(
      response.body.data.movements,
    ).toHaveLength(2);

    expect(
      response.body.data.movements.map(
        (movement: any) =>
          movement.movementType,
      ),
    ).toEqual([
      'EXIT',
      'ENTRY',
    ]);
  });

  it('returns vehicle metrics', async () => {
    const response =
      await request(app.getHttpServer())
        .get('/api/v1/vehicles/metrics')
        .query({ propertyId })
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

    expect(response.body.data.total).toBe(1);
    expect(response.body.data.verified).toBe(1);
    expect(
      response.body.data.currentlyInside,
    ).toBe(0);
    expect(response.body.data.cars).toBe(1);
  });

  it('persists audit and Event Bus records', async () => {
    const audits =
      await auditService.listByEntity(
        'vehicle',
        vehicleId,
        100,
      );

    const directAudits = audits.filter(
      (entry) =>
        entry.source === 'core.vehicle' &&
        entry.payload.entityId === vehicleId,
    );

    expect(
      directAudits.map(
        (entry) => entry.eventType,
      ),
    ).toEqual(
      expect.arrayContaining([
        VEHICLE_EVENTS.CREATED,
        VEHICLE_EVENTS.VERIFIED,
        VEHICLE_EVENTS.MOVEMENT_RECORDED,
      ]),
    );

    const events = await eventBus.listEvents({
      source: 'core.vehicle',
      limit: 100,
    });

    expect(
      events.some(
        (event) =>
          event.payload.vehicleId ===
          vehicleId,
      ),
    ).toBe(true);
  });
});
