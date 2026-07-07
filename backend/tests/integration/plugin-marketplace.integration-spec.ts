import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('Plugin Marketplace API integration', () => {
  let app: any;

  const timestamp = Date.now();
  const pluginId = `marketplace-plugin-${timestamp}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/plugin-marketplace registers a marketplace plugin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugin-marketplace')
      .send({
        plugin: {
          id: pluginId,
          name: 'Visitor Marketplace Plugin',
          provider: 'PropertyOS Test Suite',
          description: 'Marketplace integration test',
          category: 'Visitor',
          tags: ['visitor', 'security'],
          latestVersion: '1.0.0',
          status: 'AVAILABLE',
          verified: true,
          rating: 5,
          downloads: 100,
          versions: [
            {
              version: '1.0.0',
              releasedAt: new Date().toISOString(),
              minimumPlatformVersion: '0.1.0'
            }
          ]
        }
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(pluginId);
    expect(response.body.data.status).toBe('AVAILABLE');
    expect(response.body.data.verified).toBe(true);
  });

  it('GET /api/v1/plugin-marketplace lists registered plugins', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/plugin-marketplace')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.some((plugin: any) => plugin.id === pluginId),
    ).toBe(true);
  });

  it('GET /api/v1/plugin-marketplace/:id returns plugin', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/plugin-marketplace/${pluginId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(pluginId);
    expect(response.body.data.provider).toBe('PropertyOS Test Suite');
  });

  it('POST /api/v1/plugin-marketplace/search searches by query', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugin-marketplace/search')
      .send({
        query: 'visitor'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.total).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.items.some((plugin: any) => plugin.id === pluginId),
    ).toBe(true);
  });

  it('POST /api/v1/plugin-marketplace/search filters by category', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugin-marketplace/search')
      .send({
        category: 'Visitor'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items.every((plugin: any) => plugin.category === 'Visitor')).toBe(true);
  });

  it('POST /api/v1/plugin-marketplace/search filters by tag', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugin-marketplace/search')
      .send({
        tag: 'security'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(
      response.body.data.items.some((plugin: any) =>
        plugin.tags.includes('security'),
      ),
    ).toBe(true);
  });
});
