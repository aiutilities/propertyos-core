import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('Theme Package API integration', () => {
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

  it('POST /api/v1/theme-packages registers a valid theme package', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/theme-packages')
      .send({
        name: `theme-package-e2e-${timestamp}`,
        version: '1.0.0',
        sourcePath: 'themes/e2e-theme',
        manifest: {
          id: `theme-package-theme-e2e-${timestamp}`,
          name: 'Theme Package E2E Theme',
          version: '1.0.0',
          author: 'PropertyOS Test Suite',
          description: 'Theme package integration test',
          layouts: ['admin', 'security'],
        },
        metadata: {
          source: 'integration-test',
        },
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe(`theme-package-e2e-${timestamp}`);
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.status).toBe('VALIDATED');
    expect(response.body.validationErrors).toEqual([]);

    validPackageId = response.body.id;
  });

  it('GET /api/v1/theme-packages lists registered theme package', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/theme-packages')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(
      response.body.some((themePackage: any) => themePackage.id === validPackageId),
    ).toBe(true);
  });

  it('GET /api/v1/theme-packages/:id returns registered theme package', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/theme-packages/${validPackageId}`)
      .expect(200);

    expect(response.body.id).toBe(validPackageId);
    expect(response.body.status).toBe('VALIDATED');
    expect(response.body.manifest.name).toBe('Theme Package E2E Theme');
  });

  it('PATCH /api/v1/theme-packages/:id/install installs valid theme package', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/theme-packages/${validPackageId}/install`)
      .expect(200);

    expect(response.body.id).toBe(validPackageId);
    expect(response.body.status).toBe('INSTALLED');
    expect(response.body.validationErrors).toEqual([]);
  });

  it('PATCH /api/v1/theme-packages/:id/archive archives installed theme package', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/theme-packages/${validPackageId}/archive`)
      .expect(200);

    expect(response.body.id).toBe(validPackageId);
    expect(response.body.status).toBe('ARCHIVED');
  });

  it('POST /api/v1/theme-packages registers invalid theme package', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/theme-packages')
      .send({
        name: '',
        version: '',
        manifest: {
          id: `invalid-theme-package-theme-e2e-${timestamp}`,
          name: '',
          version: '',
        },
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('INVALID');
    expect(response.body.validationErrors).toEqual([
      'Theme package name is required',
      'Theme package version is required',
      'Theme manifest name is required',
      'Theme manifest version is required',
    ]);

    invalidPackageId = response.body.id;
  });

  it('PATCH /api/v1/theme-packages/:id/install does not install invalid package', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/theme-packages/${invalidPackageId}/install`)
      .expect(200);

    expect(response.body.id).toBe(invalidPackageId);
    expect(response.body.status).toBe('INVALID');
    expect(response.body.validationErrors.length).toBeGreaterThan(0);
  });
});
