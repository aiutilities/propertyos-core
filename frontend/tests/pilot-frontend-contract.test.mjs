import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import {
  join,
  resolve,
} from "node:path";

const repositoryRoot = resolve(
  import.meta.dirname,
  "../..",
);

function absolute(path) {
  return join(repositoryRoot, path);
}

function read(path) {
  assert.ok(
    existsSync(absolute(path)),
    `Missing required file: ${path}`,
  );

  return readFileSync(
    absolute(path),
    "utf8",
  );
}

const requiredRoutes = [
  "frontend/src/app/visitors/page.tsx",
  "frontend/src/app/visitors/new/page.tsx",
  "frontend/src/app/visitors/[id]/page.tsx",
  "frontend/src/app/resident/visitors/page.tsx",
  "frontend/src/app/resident/visitors/new/page.tsx",
  "frontend/src/app/security/page.tsx",
  "frontend/src/app/security/access/page.tsx",
  "frontend/src/app/security/staff/page.tsx",
  "frontend/src/app/access/page.tsx",
  "frontend/src/app/access/events/page.tsx",
  "frontend/src/app/access/grants/page.tsx",
  "frontend/src/app/access/points/page.tsx",
  "frontend/src/app/access/points/new/page.tsx",
  "frontend/src/app/access/points/[id]/page.tsx",
  "frontend/src/app/staff/page.tsx",
  "frontend/src/app/staff/new/page.tsx",
  "frontend/src/app/staff/[id]/page.tsx",
  "frontend/src/app/resident/staff/page.tsx",
  "frontend/src/app/resident/staff/new/page.tsx",
  "frontend/src/app/reservations/page.tsx",
  "frontend/src/app/reservations/new/page.tsx",
  "frontend/src/app/reservations/[id]/page.tsx",
  "frontend/src/app/reservations/approvals/page.tsx",
  "frontend/src/app/reservations/calendar/page.tsx",
  "frontend/src/app/reservations/resources/page.tsx",
  "frontend/src/app/reservations/resources/new/page.tsx",
  "frontend/src/app/reservations/resources/[id]/page.tsx",
  "frontend/src/app/resident/reservations/page.tsx",
  "frontend/src/app/resident/reservations/new/page.tsx",
  "frontend/src/app/helpdesk/page.tsx",
  "frontend/src/app/helpdesk/new/page.tsx",
  "frontend/src/app/helpdesk/[id]/page.tsx",
  "frontend/src/app/resident/helpdesk/page.tsx",
  "frontend/src/app/resident/helpdesk/new/page.tsx",
  "frontend/src/app/resident/helpdesk/[id]/page.tsx",
];

const requiredContracts = [
  {
    path: "frontend/src/hooks/useVisitors.ts",
    tokens: ["/plugins/visitor"],
  },
  {
    path: "frontend/src/hooks/useVisitor.ts",
    tokens: [
      "/plugins/visitor/",
      "/history",
    ],
  },
  {
    path: "frontend/src/components/visitor/VisitorForm.tsx",
    tokens: ["/plugins/visitor/invite"],
  },
  {
    path: "frontend/src/components/visitor/VisitorDetails.tsx",
    tokens: [
      "/plugins/visitor/",
      "/generate-qr",
      '"arrive"',
      '"check-in"',
      '"check-out"',
    ],
  },
  {
    path: "frontend/src/components/security/QrValidationPanel.tsx",
    tokens: ["/plugins/visitor/validate-qr"],
  },
  {
    path: "frontend/src/hooks/useStaffs.ts",
    tokens: [
      "/staff",
      "/metrics",
      "/attendance",
    ],
  },
  {
    path: "frontend/src/hooks/useAccessControl.ts",
    tokens: [
      "/access-control/points",
      "/access-control/grants",
      "/access-control/evaluate",
      "/access-control/events",
    ],
  },
  {
    path: "frontend/src/hooks/useReservations.ts",
    tokens: [
      "/reservations",
      "/resources",
      "/approve",
      "/reject",
      '"check-in"',
    ],
  },
  {
    path: "frontend/src/hooks/useHelpdesk.ts",
    tokens: ["/helpdesk"],
  },
];

const requiredTypes = [
  "frontend/src/types/visitor.ts",
  "frontend/src/types/staff.ts",
  "frontend/src/types/access-control.ts",
  "frontend/src/types/reservation.ts",
  "frontend/src/types/helpdesk.ts",
];

test(
  "pilot routes exist and remain protected",
  () => {
    for (const path of requiredRoutes) {
      const source = read(path);

      const reexportsProtectedPage =
        /export\s*\{\s*default\s*\}\s*from\s*["'][.][.]\/page["']/.test(
          source,
        );

      if (reexportsProtectedPage) {
        const parentSource = read(
          path.replace(
            "/points/page.tsx",
            "/page.tsx",
          ),
        );

        assert.match(
          parentSource,
          /\bProtectedRoute\b/,
          `${path} parent must use ProtectedRoute`,
        );

        assert.match(
          parentSource,
          /\bAdminShell\b/,
          `${path} parent must use AdminShell`,
        );

        continue;
      }

      assert.match(
        source,
        /\bProtectedRoute\b/,
        `${path} must use ProtectedRoute`,
      );

      assert.match(
        source,
        /\bAdminShell\b/,
        `${path} must use AdminShell`,
      );
    }
  },
);

test(
  "pilot API contracts remain connected",
  () => {
    for (const contract of requiredContracts) {
      const source = read(contract.path);

      for (const token of contract.tokens) {
        assert.ok(
          source.includes(token),
          `${contract.path} is missing ${token}`,
        );
      }
    }
  },
);

test(
  "pilot frontend types remain present",
  () => {
    for (const path of requiredTypes) {
      assert.ok(
        existsSync(absolute(path)),
        `Missing required type file: ${path}`,
      );
    }
  },
);

test(
  "pilot surfaces contain no unfinished markers",
  () => {
    const checkedFiles = [
      ...requiredRoutes,
      ...requiredContracts.map(
        ({ path }) => path,
      ),
      ...requiredTypes,
    ];

    const unfinished =
      /\b(?:TODO|FIXME|WIP)\b|not implemented|coming soon|temporary stub/i;

    for (const path of new Set(checkedFiles)) {
      assert.doesNotMatch(
        read(path),
        unfinished,
        `Unfinished marker found in ${path}`,
      );
    }
  },
);
