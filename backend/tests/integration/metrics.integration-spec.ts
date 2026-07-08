import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Metrics API integration', () => {
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

  it('GET /api/v1/metrics/prometheus returns Prometheus text exposition format', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/metrics/prometheus')
      .expect(200)
      .expect((response) => {
        expect(response.headers['content-type']).toContain('text/plain');
        expect(response.text).toContain('# HELP process_uptime_seconds');
        expect(response.text).toContain('# TYPE process_uptime_seconds gauge');
        expect(response.text).toContain('process_uptime_seconds ');
        expect(response.text).toContain('# HELP process_memory_rss_bytes');
        expect(response.text).toContain('# TYPE process_memory_rss_bytes gauge');
      });
  });
});
