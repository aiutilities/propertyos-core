import { Test } from "@nestjs/testing";
import { createHash, randomUUID } from "crypto";
import { Pool } from "pg";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { AuditService } from "../../src/core/audit/audit.service";
import { EventBusService } from "../../src/core/eventbus/services/eventbus.service";
import {
  STAFF_EVENTS,
  STAFF_PERMISSIONS,
} from "../../src/core/staff/staff.constants";
import { POSTGRES_POOL } from "../../src/database/postgres";

describe("Staff Registry API integration", () => {
  let app: any;
  let pool: Pool;
  let eventBus: EventBusService;
  let auditService: AuditService;
  let accessToken: string;

  const timestamp = Date.now();
  const password = "CorrectHorseBatteryStaple123!";

  const email = `staff-e2e-${timestamp}@propertyos.test`;

  const personId = randomUUID();
  const securityPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();
  const propertyId = randomUUID();
  const zoneId = randomUUID();

  const employeeCode = `EMP-${String(timestamp).slice(-6)}`;

  const idCardNumber = `ID-${timestamp}`;

  const qrCode = `STAFF-QR-${timestamp}`;

  const rfidTag = `STAFF-RFID-${timestamp}`;

  let staffId = "";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);
    auditService = app.get(AuditService);

    const salt = randomUUID().replace(/-/g, "");

    const hash = createHash("sha256")
      .update(`${salt}:${password}`)
      .digest("hex");

    await pool.query(
      `
      INSERT INTO persons (
        id,
        display_name,
        email,
        phone,
        status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [personId, "Staff E2E User", email, "9000000301", "ACTIVE"],
    );

    await pool.query(
      `
      INSERT INTO persons (
        id,
        display_name,
        email,
        phone,
        status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        securityPersonId,
        "Staff E2E Security",
        `staff-security-${timestamp}@propertyos.test`,
        "9000000302",
        "ACTIVE",
      ],
    );

    await pool.query(
      `
      INSERT INTO credentials (
        id,
        person_id,
        credential_type,
        credential_value
      )
      VALUES ($1,$2,$3,$4)
      `,
      [credentialId, personId, "PASSWORD", `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `
      INSERT INTO roles (
        id,
        name,
        description
      )
      VALUES ($1,$2,$3)
      `,
      [roleId, `Staff E2E Role ${timestamp}`, "Staff integration test role"],
    );

    for (const permission of [
      STAFF_PERMISSIONS.READ,
      STAFF_PERMISSIONS.CREATE,
      STAFF_PERMISSIONS.MANAGE,
      STAFF_PERMISSIONS.SECURITY,
    ]) {
      await pool.query(
        `
        INSERT INTO permissions (
          id,
          permission_key,
          description
        )
        VALUES ($1,$2,$3)
        ON CONFLICT (
          permission_key
        ) DO NOTHING
        `,
        [randomUUID(), permission, `Staff test permission: ${permission}`],
      );
    }

    await pool.query(
      `
      INSERT INTO person_roles (
        id,
        person_id,
        role_id
      )
      VALUES ($1,$2,$3)
      `,
      [personRoleId, personId, roleId],
    );

    for (const permission of [
      STAFF_PERMISSIONS.READ,
      STAFF_PERMISSIONS.CREATE,
      STAFF_PERMISSIONS.MANAGE,
      STAFF_PERMISSIONS.SECURITY,
    ]) {
      const result = await pool.query(
        `
        SELECT id
        FROM permissions
        WHERE permission_key = $1
        `,
        [permission],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (
          id,
          role_id,
          permission_id
        )
        VALUES ($1,$2,$3)
        `,
        [randomUUID(), roleId, result.rows[0].id],
      );
    }

    await pool.query(
      `
      INSERT INTO properties (
        id,
        name,
        code,
        property_type,
        description,
        city,
        state,
        country,
        is_active
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      `,
      [
        propertyId,
        "Staff E2E Property",
        `STAFF-E2E-${timestamp}`,
        "GATED_COMMUNITY",
        "Staff integration test property",
        "Madurai",
        "Tamil Nadu",
        "India",
        true,
      ],
    );

    await pool.query(
      `
      INSERT INTO zones (
        id,
        property_id,
        name,
        code,
        description,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        zoneId,
        propertyId,
        "Staff E2E Zone",
        `STAFF-ZONE-${timestamp}`,
        "Staff integration test zone",
        true,
      ],
    );

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email,
        password,
      })
      .expect(201);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    if (pool) {
      if (staffId) {
        await pool.query(
          `
          DELETE FROM audit_logs
          WHERE payload->>'entityId' = $1
             OR payload->>'staffId' = $1
          `,
          [staffId],
        );
      }

      await pool.query(
        `
        DELETE FROM staff_attendance
        WHERE staff_id = $1
        `,
        [staffId || randomUUID()],
      );

      await pool.query(
        `
        DELETE FROM staff_members
        WHERE id = $1
        `,
        [staffId || randomUUID()],
      );

      await pool.query(
        `
        DELETE FROM zones
        WHERE id = $1
        `,
        [zoneId],
      );

      await pool.query(
        `
        DELETE FROM properties
        WHERE id = $1
        `,
        [propertyId],
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
        DELETE FROM person_roles
        WHERE person_id = $1
        `,
        [personId],
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
        WHERE person_id = $1
        `,
        [personId],
      );

      await pool.query(
        `
        DELETE FROM persons
        WHERE id IN ($1,$2)
        `,
        [personId, securityPersonId],
      );

      await pool.end();
    }

    if (app) {
      await app.close();
    }
  });

  it("rejects unauthenticated listing", async () => {
    await request(app.getHttpServer()).get("/api/v1/staff").expect(401);
  });

  it("registers a pending staff member", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/staff")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        employeeCode,
        personId,
        staffType: "HOUSEKEEPING",
        propertyId,
        zoneId,
        employerName: "PropertyOS Services",
        department: "Operations",
        designation: "Housekeeping Associate",
        shiftName: "Day Shift",
        idCardNumber,
        qrCode,
        rfidTag,
        notes: "Staff integration test record",
      })
      .expect(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.status).toBe("PENDING");

    expect(response.body.data.normalizedEmployeeCode).toBe(
      employeeCode.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    );

    staffId = response.body.data.id;
  });

  it("rejects duplicate employee-code variants", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/staff")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        employeeCode: employeeCode.replace(/-/g, " "),
        personId,
        staffType: "HOUSEKEEPING",
        propertyId,
      })
      .expect(409);
  });

  it("lists and searches staff", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/staff")
      .query({
        propertyId,
        personId,
        status: "PENDING",
        staffType: "HOUSEKEEPING",
        search: "Housekeeping",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.some((staff: any) => staff.id === staffId)).toBe(
      true,
    );
  });

  it("looks up staff by employee code", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/staff/lookup/employee/${encodeURIComponent(employeeCode)}`)
      .query({ propertyId })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.id).toBe(staffId);
  });

  it("looks up staff by QR and RFID", async () => {
    const qrResponse = await request(app.getHttpServer())
      .get(`/api/v1/staff/lookup/qr/${encodeURIComponent(qrCode)}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(qrResponse.body.data.id).toBe(staffId);

    const rfidResponse = await request(app.getHttpServer())
      .get(`/api/v1/staff/lookup/rfid/${encodeURIComponent(rfidTag)}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(rfidResponse.body.data.id).toBe(staffId);
  });

  it("blocks attendance before activation", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/staff/${staffId}/attendance`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        attendanceType: "CHECK_IN",
        gate: "Main Gate",
        recordedByPersonId: securityPersonId,
      })
      .expect(400);
  });

  it("activates the staff member", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/staff/${staffId}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        status: "ACTIVE",
        changedByPersonId: personId,
      })
      .expect(201);

    expect(response.body.data.status).toBe("ACTIVE");

    expect(response.body.data.verifiedByPersonId).toBe(personId);

    expect(response.body.data.verifiedAt).toBeTruthy();
  });

  it("records check-in and check-out", async () => {
    for (const attendanceType of ["CHECK_IN", "CHECK_OUT"]) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/staff/${staffId}/attendance`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          attendanceType,
          gate: "Main Gate",
          recordedByPersonId: securityPersonId,
          remarks: `${attendanceType} recorded`,
        })
        .expect(201);

      expect(response.body.data.attendanceType).toBe(attendanceType);
    }
  });

  it("rejects duplicate consecutive attendance", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/staff/${staffId}/attendance`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        attendanceType: "CHECK_OUT",
        gate: "Main Gate",
        recordedByPersonId: securityPersonId,
      })
      .expect(400);
  });

  it("returns staff details and attendance history", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/staff/${staffId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.attendance).toHaveLength(2);

    expect(
      response.body.data.attendance.map((entry: any) => entry.attendanceType),
    ).toEqual(["CHECK_OUT", "CHECK_IN"]);
  });

  it("returns Staff metrics", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/staff/metrics")
      .query({ propertyId })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.total).toBe(1);

    expect(response.body.data.active).toBe(1);

    expect(response.body.data.housekeeping).toBe(1);

    expect(response.body.data.currentlyInside).toBe(0);
  });

  it("persists audit and Event Bus records", async () => {
    const audits = await auditService.listByEntity("staff", staffId, 100);

    const directAudits = audits.filter(
      (entry) =>
        entry.source === "core.staff" && entry.payload.entityId === staffId,
    );

    expect(directAudits.map((entry) => entry.eventType)).toEqual(
      expect.arrayContaining([
        STAFF_EVENTS.CREATED,
        STAFF_EVENTS.ACTIVATED,
        STAFF_EVENTS.ATTENDANCE_RECORDED,
      ]),
    );

    const events = await eventBus.listEvents({
      source: "core.staff",
      limit: 100,
    });

    expect(events.some((event) => event.payload.staffId === staffId)).toBe(
      true,
    );
  });
});
