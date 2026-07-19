import {
  Test,
} from '@nestjs/testing';
import request from 'supertest';
import {
  AppModule,
} from '../../src/app.module';

describe(
  'Plugin publication HTTP security',
  () => {
    let app: any;

    beforeAll(
      async () => {
        const moduleRef =
          await Test
            .createTestingModule({
              imports: [
                AppModule,
              ],
            })
            .compile();

        app =
          moduleRef
            .createNestApplication();
        app.setGlobalPrefix(
          'api/v1',
        );
        await app.init();
      },
    );

    afterAll(
      async () => {
        await app.close();
      },
    );

    it(
      'rejects unauthenticated publication submission before database access',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/plugin-publications',
          )
          .send({
            storageObjectId:
              '22222222-2222-4222-8222-222222222222',
            publisherId:
              'attacker',
            artifactSha256:
              'f'.repeat(64),
          })
          .expect(401);
      },
    );

    it(
      'rejects unauthenticated publication transitions before database access',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/plugin-publications/11111111-1111-4111-8111-111111111111/transition',
          )
          .send({
            targetStatus:
              'APPROVED',
            reason:
              'Injected approval',
          })
          .expect(401);
      },
    );
  },
);
