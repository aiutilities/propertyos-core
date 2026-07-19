import {
  Test,
} from '@nestjs/testing';
import {
  Pool,
} from 'pg';
import request from 'supertest';
import {
  AppModule,
} from '../../src/app.module';
import {
  POSTGRES_POOL,
} from '../../src/database/postgres';

describe(
  'Plugin publication installation HTTP security',
  () => {
    let app: any;
    let pool: Pool;

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

        pool =
          app.get(
            POSTGRES_POOL,
          );
      },
    );

    afterAll(
      async () => {
        if (pool) {
          await pool.end();
        }

        await app.close();
      },
    );

    it(
      'rejects unauthenticated publication installation before database access',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/plugin-publication-installer/11111111-1111-4111-8111-111111111111/install',
          )
          .send({
            autoEnable:
              true,
            storageObjectId:
              'attacker-controlled',
          })
          .expect(401);
      },
    );
  },
);
