import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { provisionIntegrationAdmin } from "./helpers/integration-auth.helper";

describe("Theme API integration", () => {
  let accessToken = "";
  let cleanupAuth: (() => Promise<void>) | undefined;

  let app: any;

  const timestamp = Date.now();
  const themeId = `theme-e2e-${timestamp}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();

    const auth = await provisionIntegrationAdmin(app, "theme");

    accessToken = auth.accessToken;

    cleanupAuth = auth.cleanup;
  });

  afterAll(async () => {
    if (cleanupAuth) {
      await cleanupAuth();
    }

    await app.close();
  });

  it("POST /api/v1/themes installs a theme manifest", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/themes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        manifest: {
          id: themeId,
          name: "E2E Theme",
          version: "1.0.0",
          author: "PropertyOS Test Suite",
          description: "Theme integration test",
          layouts: ["admin", "security"],
          branding: {
            logo: "/assets/logo.svg",
            primaryColor: "#111111",
            secondaryColor: "#eeeeee",
          },
        },
      })
      .expect(201);

    expect(response.body.id).toBe(themeId);
    expect(response.body.manifest.name).toBe("E2E Theme");
    expect(response.body.manifest.version).toBe("1.0.0");
    expect(response.body.status).toBe("INSTALLED");
    expect(response.body.installedAt).toBeDefined();
  });

  it("GET /api/v1/themes lists installed theme", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/themes")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((theme: any) => theme.id === themeId)).toBe(
      true,
    );
  });

  it("POST /api/v1/themes/:id/activate activates installed theme", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/themes/${themeId}/activate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body.id).toBe(themeId);
    expect(response.body.status).toBe("ACTIVE");
    expect(response.body.activatedAt).toBeDefined();
  });

  it("GET /api/v1/themes/active returns active theme", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/themes/active")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(themeId);
    expect(response.body.data.status).toBe("ACTIVE");
  });
});
