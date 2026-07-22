import { Test } from "@nestjs/testing";
import { Pool } from "pg";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { provisionIntegrationAdmin } from "./helpers/integration-auth.helper";
import { POSTGRES_POOL } from "../../src/database/postgres";

describe("Plugin API integration", () => {
  let accessToken = "";
  let cleanupAuth: (() => Promise<void>) | undefined;

  let app: any;
  let pool: Pool;

  const timestamp = Date.now();
  const pluginName = `e2e-plugin-${timestamp}`;
  const dependentPluginName = `e2e-dependent-plugin-${timestamp}`;

  let pluginId: string;
  let dependentPluginId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();

    const auth = await provisionIntegrationAdmin(app, "plugin");

    accessToken = auth.accessToken;

    cleanupAuth = auth.cleanup;

    pool = app.get(POSTGRES_POOL);
  });

  afterAll(async () => {
    if (cleanupAuth) {
      await cleanupAuth();
    }

    if (pool) {
      if (dependentPluginId) {
        await pool.query("DELETE FROM core_plugins WHERE id = $1", [
          dependentPluginId,
        ]);
      }

      if (pluginId) {
        await pool.query("DELETE FROM core_plugins WHERE id = $1", [pluginId]);
      }

      await pool.end();
    }

    await app.close();
  });

  it("POST /api/v1/plugins installs a plugin manifest", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/plugins")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        manifest: {
          name: pluginName,
          displayName: "E2E Plugin",
          version: "1.0.0",
          description: "Plugin lifecycle integration test",
          author: "PropertyOS Test Suite",
          minPlatformVersion: "0.1.0",
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("INSTALLED");
    expect(response.body.plugin.id).toBeDefined();
    expect(response.body.plugin.name).toBe(pluginName);
    expect(response.body.plugin.displayName).toBe("E2E Plugin");
    expect(response.body.plugin.version).toBe("1.0.0");
    expect(response.body.plugin.status).toBe("INSTALLED");

    pluginId = response.body.plugin.id;
  });

  it("GET /api/v1/plugins/installed lists installed plugin", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/plugins/installed")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((plugin: any) => plugin.id === pluginId)).toBe(
      true,
    );
  });

  it("GET /api/v1/plugins/:id returns installed plugin", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/plugins/${pluginId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.id).toBe(pluginId);
    expect(response.body.name).toBe(pluginName);
    expect(response.body.version).toBe("1.0.0");
    expect(response.body.status).toBe("INSTALLED");
  });

  it("GET /api/v1/plugins/:id/lifecycle returns lifecycle status", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/plugins/${pluginId}/lifecycle`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.id).toBe(pluginId);
    expect(response.body.name).toBe(pluginName);
    expect(response.body.status).toBe("INSTALLED");
    expect(response.body.installedAt).toBeDefined();
  });

  it("POST /api/v1/plugins/:id/lifecycle activates plugin", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/${pluginId}/lifecycle`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        action: "ACTIVATE",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("ACTIVE");
    expect(response.body.previousStatus).toBe("INSTALLED");
    expect(response.body.plugin.status).toBe("ACTIVE");
    expect(response.body.plugin.activatedAt).toBeDefined();
  });

  it("POST /api/v1/plugins/:id/lifecycle deactivates plugin", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/${pluginId}/lifecycle`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        action: "DEACTIVATE",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("INACTIVE");
    expect(response.body.previousStatus).toBe("ACTIVE");
    expect(response.body.plugin.status).toBe("INACTIVE");
    expect(response.body.plugin.deactivatedAt).toBeDefined();
  });

  it("POST /api/v1/plugins/:id/upgrade upgrades plugin version", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/${pluginId}/upgrade`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        version: "1.1.0",
        notes: "Upgrade from integration test",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("UPGRADED");
    expect(response.body.fromVersion).toBe("1.0.0");
    expect(response.body.toVersion).toBe("1.1.0");
    expect(response.body.plugin.version).toBe("1.1.0");
    expect(response.body.plugin.status).toBe("INSTALLED");
  });

  it("POST /api/v1/plugins/:id/rollback rolls plugin back to previous version", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/${pluginId}/rollback`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        targetVersion: "1.0.0",
        notes: "Rollback from integration test",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("ROLLED_BACK");
    expect(response.body.fromVersion).toBe("1.1.0");
    expect(response.body.toVersion).toBe("1.0.0");
    expect(response.body.plugin.version).toBe("1.0.0");
    expect(response.body.plugin.status).toBe("INSTALLED");
  });

  it("POST /api/v1/plugins/:id/lifecycle blocks uninstall when dependent plugin exists", async () => {
    const dependentResponse = await request(app.getHttpServer())
      .post("/api/v1/plugins")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        manifest: {
          name: dependentPluginName,
          displayName: "E2E Dependent Plugin",
          version: "1.0.0",
          description: "Dependent plugin lifecycle integration test",
          author: "PropertyOS Test Suite",
          dependencies: [pluginName],
        },
      })
      .expect(201);

    dependentPluginId = dependentResponse.body.plugin.id;

    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/${pluginId}/lifecycle`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        action: "UNINSTALL",
      })
      .expect(201);

    expect(response.body.success).toBe(false);
    expect(response.body.status).toBe("DEPENDENCY_BLOCKED");
    expect(response.body.plugin).toBe(pluginName);
    expect(response.body.error).toBe(
      "PLUGIN_UNINSTALL_BLOCKED_BY_DEPENDENCIES",
    );
    expect(response.body.dependents).toHaveLength(1);
    expect(response.body.dependents[0].name).toBe(dependentPluginName);
  });

  it("DELETE /api/v1/plugins/:id removes dependent plugin", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/v1/plugins/${dependentPluginId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.id).toBe(dependentPluginId);
    expect(response.body.status).toBe("REMOVED");

    dependentPluginId = "";
  });

  it("POST /api/v1/plugins/:id/lifecycle uninstalls plugin when dependencies are removed", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/${pluginId}/lifecycle`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        action: "UNINSTALL",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("UNINSTALLED");
    expect(response.body.plugin.status).toBe("UNINSTALLED");
  });

  it("DELETE /api/v1/plugins/:id removes plugin", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/v1/plugins/${pluginId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.id).toBe(pluginId);
    expect(response.body.status).toBe("REMOVED");

    pluginId = "";
  });
});
