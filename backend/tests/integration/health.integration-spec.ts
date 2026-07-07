import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Health API integration', () => {
  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    const pool = app.get(POSTGRES_POOL);
    await pool.end();
    await app.close();
  });

  it('GET /api/v1/health returns ok', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ok');
        expect(response.body.service).toBe('propertyos-api');
      });
  });
});
