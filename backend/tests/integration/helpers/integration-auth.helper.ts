import { createHash, randomUUID } from "crypto";
import { Pool } from "pg";
import request from "supertest";

import { Permissions } from "../../../src/core/auth/constants/permissions";
import { POSTGRES_POOL } from "../../../src/database/postgres";

export interface IntegrationAuthContext {
  accessToken: string;
  cleanup: () => Promise<void>;
}

export async function provisionIntegrationAdmin(
  app: any,
  label: string,
): Promise<IntegrationAuthContext> {
  const pool = app.get<Pool>(POSTGRES_POOL);

  const timestamp = `${Date.now()}-${randomUUID()}`;

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const email = `${label}-${timestamp}@propertyos.test`;

  const password = "CorrectHorseBatteryStaple123!";

  const salt = randomUUID().replace(/-/g, "");

  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");

  await pool.query(
    `
      INSERT INTO persons
        (
          id,
          display_name,
          email,
          phone,
          status
        )
      VALUES
        ($1, $2, $3, $4, $5)
    `,
    [personId, `${label} Integration Admin`, email, null, "ACTIVE"],
  );

  await pool.query(
    `
      INSERT INTO credentials
        (
          id,
          person_id,
          credential_type,
          credential_value
        )
      VALUES
        ($1, $2, $3, $4)
    `,
    [credentialId, personId, "PASSWORD", `sha256:${salt}:${hash}`],
  );

  await pool.query(
    `
      INSERT INTO roles
        (
          id,
          name,
          description
        )
      VALUES
        ($1, $2, $3)
    `,
    [
      roleId,
      `${label} Integration Role ${timestamp}`,
      `${label} authenticated integration suite`,
    ],
  );

  await pool.query(
    `
      INSERT INTO person_roles
        (
          id,
          person_id,
          role_id
        )
      VALUES
        ($1, $2, $3)
    `,
    [personRoleId, personId, roleId],
  );

  for (const permissionKey of Object.values(Permissions)) {
    await pool.query(
      `
        INSERT INTO permissions
          (
            id,
            permission_key,
            description
          )
        VALUES
          (
            gen_random_uuid(),
            $1,
            $2
          )
        ON CONFLICT (permission_key) DO NOTHING
      `,
      [permissionKey, `Allows ${permissionKey}`],
    );
  }

  await pool.query(
    `
      INSERT INTO role_permissions
        (
          id,
          role_id,
          permission_id
        )
      SELECT
        gen_random_uuid(),
        $1,
        permissions.id
      FROM permissions
      WHERE permissions.deleted_at IS NULL
      ON CONFLICT DO NOTHING
    `,
    [roleId],
  );

  const login = await request(app.getHttpServer())
    .post("/api/v1/auth/login")
    .send({
      email,
      password,
    })
    .expect(201);

  const accessToken = login.body.accessToken;

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Integration login did not return an access token");
  }

  return {
    accessToken,
    cleanup: async () => {
      await pool.query(
        `
          DELETE FROM person_roles
          WHERE id = $1
        `,
        [personRoleId],
      );

      await pool.query(
        `
          DELETE FROM role_permissions
          WHERE role_id = $1
        `,
        [roleId],
      );

      await pool.query(
        `
          DELETE FROM roles
          WHERE id = $1
        `,
        [roleId],
      );

      await pool.query(
        `
          DELETE FROM credentials
          WHERE id = $1
        `,
        [credentialId],
      );

      await pool.query(
        `
          DELETE FROM persons
          WHERE id = $1
        `,
        [personId],
      );
    },
  };
}
