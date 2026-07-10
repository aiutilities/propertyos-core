import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Auth API integration', () => {
  let app: any;
  let pool: Pool;

  const email = `auth-e2e-${Date.now()}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';
  let personId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);

    personId = randomUUID();
    const credentialId = randomUUID();
    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [personId, 'Auth E2E User', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO credentials (id, person_id, credential_type, credential_value)
      VALUES ($1, $2, $3, $4)
      `,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );
  });

  afterAll(async () => {
    if (pool) {
      await pool.query('DELETE FROM credentials WHERE person_id = $1', [
        personId,
      ]);
      await pool.query('DELETE FROM persons WHERE id = $1', [personId]);
      await pool.end();
    }

    await app.close();
  });

  it('POST /api/v1/auth/login returns access token for valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.accessToken).toBeDefined();
        expect(typeof response.body.accessToken).toBe('string');
        expect(response.body.person.id).toBe(personId);
        expect(response.body.person.email).toBe(email);
        expect(response.body.person.displayName).toBe('Auth E2E User');
      });
  });

  it('POST /api/v1/auth/login rejects invalid password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'wrong-password',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body.error.message).toBe('Invalid email or password');
        expect(response.body.requestId).toBeDefined();
      });
  });

  it('POST /api/v1/auth/login rejects unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `missing-${Date.now()}@propertyos.test`,
        password,
      })
      .expect(401)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body.error.message).toBe('Invalid email or password');
        expect(response.body.requestId).toBeDefined();
      });
  });
});
