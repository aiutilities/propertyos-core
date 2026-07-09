import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { setupSwagger } from '../../src/core/platform';

describe('Swagger/OpenAPI integration', () => {
  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes OpenAPI JSON with API metadata and bearer auth', async () => {
    await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect((response) => {
        expect(response.body.openapi).toBeDefined();
        expect(response.body.info.title).toBe('PropertyOS API');
        expect(response.body.info.description).toContain('property management');
        expect(response.body.components.securitySchemes.JWT).toMatchObject({
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        });
        expect(Object.keys(response.body.paths).some((path) => path.startsWith('/api/v1/'))).toBe(true);
      });
  });
});
