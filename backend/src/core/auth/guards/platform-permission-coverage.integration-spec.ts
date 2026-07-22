import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface ControllerContract {
  file: string;
  permissions: readonly string[];
}

const contracts: readonly ControllerContract[] = [
  {
    file: "../../admin/controllers/admin.controller.ts",
    permissions: ["Permissions.ADMIN_READ"],
  },
  {
    file: "../../configuration/controllers/configuration.controller.ts",
    permissions: [
      "Permissions.CONFIGURATION_READ",
      "Permissions.CONFIGURATION_MANAGE",
    ],
  },
  {
    file: "../../plugin/controllers/plugin.controller.ts",
    permissions: [
      "Permissions.PLUGIN_READ",
      "Permissions.PLUGIN_CREATE",
      "Permissions.PLUGIN_MANAGE",
    ],
  },
  {
    file: "../../plugin/marketplace/controllers/plugin-marketplace.controller.ts",
    permissions: ["Permissions.PLUGIN_READ"],
  },
  {
    file: "../../plugin/package/controllers/plugin-package.controller.ts",
    permissions: ["Permissions.PLUGIN_READ", "Permissions.PLUGIN_MANAGE"],
  },
  {
    file: "../../theme/controllers/theme.controller.ts",
    permissions: ["Permissions.THEME_READ", "Permissions.THEME_MANAGE"],
  },
  {
    file: "../../theme/package/controllers/theme-package.controller.ts",
    permissions: ["Permissions.THEME_READ", "Permissions.THEME_MANAGE"],
  },
  {
    file: "../../distribution/controllers/distribution.controller.ts",
    permissions: [
      "Permissions.DISTRIBUTION_READ",
      "Permissions.DISTRIBUTION_MANAGE",
    ],
  },
  {
    file: "../../integration/controllers/integration.controller.ts",
    permissions: [
      "Permissions.INTEGRATION_READ",
      "Permissions.INTEGRATION_MANAGE",
    ],
  },
  {
    file: "../../upload/controllers/upload.controller.ts",
    permissions: ["Permissions.UPLOAD_CREATE"],
  },
];

describe("platform permission coverage contract", () => {
  it.each(contracts)(
    "protects $file with permission enforcement",
    ({ file, permissions }) => {
      const source = readFileSync(resolve(__dirname, file), "utf8");

      expect(source).toContain("PermissionGuard");

      expect(source).toContain("JwtAuthGuard");

      expect(source).toMatch(
        /@UseGuards\s*\([\s\S]*?JwtAuthGuard[\s\S]*?PermissionGuard[\s\S]*?\)/,
      );

      expect(source).toContain("@ApiBearerAuth");

      for (const permission of permissions) {
        expect(source).toContain(`@RequirePermission(${permission})`);
      }
    },
  );

  it("keeps marketplace access authenticated", () => {
    const source = readFileSync(
      resolve(
        __dirname,
        "../../plugin/marketplace/controllers/plugin-marketplace.controller.ts",
      ),
      "utf8",
    );

    expect(source).not.toContain("@Public()");

    expect(source).toContain("@RequirePermission(Permissions.PLUGIN_READ)");
  });
});
