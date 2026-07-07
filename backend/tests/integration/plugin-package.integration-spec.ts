import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('Plugin Package API integration', () => {
  let app: any;

  const timestamp = Date.now();

  let validPackageId: string;
  let invalidPackageId: string;

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

  it('POST /api/v1/plugin-packages registers a valid plugin package', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugin-packages')
      .send({
        packageName: `visitor-package-e2e-${timestamp}`,
        version: '1.0.0',
        manifest: {
          id: `visitor-plugin-e2e-${timestamp}`,
          name: `visitor-plugin-e2e-${timestamp}`,
          version: '1.0.0',
          provider: 'PropertyOS Test Suite',
          description: 'Plugin package integration test',
          minimumPlatformVersion: '0.1.0',
          dependencies: [],
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.packageName).toBe(`visitor-package-e2e-${timestamp}`);
    expect(response.body.data.version).toBe('1.0.0');
    expect(response.body.data.status).toBe('VALIDATED');
    expect(response.body.data.validationErrors).toEqual([]);
    expect(response.body.data.validationWarnings).toEqual([]);

    validPackageId = response.body.data.id;
  });

  it('GET /api/v1/plugin-packages lists registered plugin package', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/plugin-packages')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.some((pluginPackage: any) => pluginPackage.id === validPackageId),
    ).toBe(true);
  });

  it('GET /api/v1/plugin-packages/:id returns registered plugin package', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/plugin-packages/${validPackageId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(validPackageId);
    expect(response.body.data.status).toBe('VALIDATED');
    expect(response.body.data.manifest.minimumPlatformVersion).toBe('0.1.0');
  });

  it('POST /api/v1/plugin-packages/:id/validate validates registered package', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugin-packages/${validPackageId}/validate`)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(validPackageId);
    expect(response.body.data.status).toBe('VALIDATED');
    expect(response.body.data.validationErrors).toEqual([]);
  });

  it('POST /api/v1/plugin-packages marks invalid manifest as failed', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugin-packages')
      .send({
        packageName: `invalid-package-e2e-${timestamp}`,
        version: '1.0.0',
        manifest: {
          id: '',
          name: '',
          version: '',
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.status).toBe('FAILED');
    expect(response.body.data.validationErrors).toEqual([
      'Missing required manifest field: id',
      'Missing required manifest field: name',
      'Missing required manifest field: version',
    ]);
    expect(response.body.data.validationWarnings).toEqual([
      'Manifest provider is missing',
      'minimumPlatformVersion is missing',
      'dependencies should be declared as an array',
    ]);

    invalidPackageId = response.body.data.id;
  });

  it('POST /api/v1/plugin-packages/:id/validate keeps invalid package failed', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugin-packages/${invalidPackageId}/validate`)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(invalidPackageId);
    expect(response.body.data.status).toBe('FAILED');
    expect(response.body.data.validationErrors.length).toBeGreaterThan(0);
  });
});
