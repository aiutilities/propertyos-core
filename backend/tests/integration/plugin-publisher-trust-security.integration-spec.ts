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
  'Plugin publisher trust HTTP security',
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
      'rejects unauthenticated key revocation before database access',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/plugin-publishers/propertyos/keys/release-2026/revoke',
          )
          .send({
            reason:
              'Private key compromise',
            actorId:
              'attacker-controlled',
          })
          .expect(401);
      },
    );
  },
);
