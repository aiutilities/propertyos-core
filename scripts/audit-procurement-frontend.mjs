import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";

import {
  dirname,
  join,
  relative,
  resolve,
} from "node:path";

function findRepositoryRoot(start) {
  let current = resolve(start);

  while (true) {
    if (
      existsSync(
        join(
          current,
          "frontend",
          "package.json",
        ),
      ) &&
      existsSync(
        join(
          current,
          "backend",
          "package.json",
        ),
      )
    ) {
      return current;
    }

    const parent =
      dirname(current);

    if (parent === current) {
      throw new Error(
        "Unable to locate repository root",
      );
    }

    current = parent;
  }
}

const root = findRepositoryRoot(
  process.cwd(),
);

const failures = [];
const warnings = [];
const passed = [];

function pass(message) {
  passed.push(message);
  console.log(`PASS  ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL  ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN  ${message}`);
}

function assertFile(path) {
  const absolute = join(root, path);

  if (
    existsSync(absolute) &&
    statSync(absolute).isFile()
  ) {
    pass(`File exists: ${path}`);
    return;
  }

  fail(`Missing file: ${path}`);
}

function assertContains(
  path,
  expected,
  description,
) {
  const absolute = join(root, path);

  if (!existsSync(absolute)) {
    fail(`${description}: missing ${path}`);
    return;
  }

  const text = readFileSync(
    absolute,
    "utf8",
  );

  if (text.includes(expected)) {
    pass(description);
  } else {
    fail(
      `${description}: expected "${expected}" in ${path}`,
    );
  }
}

function collectFiles(directory) {
  const absolute = join(
    root,
    directory,
  );

  if (!existsSync(absolute)) {
    return [];
  }

  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current)) {
      const path = join(
        current,
        entry,
      );

      if (statSync(path).isDirectory()) {
        walk(path);
      } else {
        files.push(
          relative(root, path),
        );
      }
    }
  }

  walk(absolute);

  return files;
}

const requiredRoutes = [
  "frontend/src/app/procurement/dashboard/page.tsx",
  "frontend/src/app/procurement/requests/page.tsx",
  "frontend/src/app/procurement/requests/new/page.tsx",
  "frontend/src/app/procurement/requests/[id]/page.tsx",
  "frontend/src/app/procurement/rfqs/page.tsx",
  "frontend/src/app/procurement/rfqs/new/page.tsx",
  "frontend/src/app/procurement/rfqs/[id]/page.tsx",
  "frontend/src/app/procurement/rfqs/[id]/comparison/page.tsx",
  "frontend/src/app/procurement/quotations/page.tsx",
  "frontend/src/app/procurement/quotations/new/page.tsx",
  "frontend/src/app/procurement/quotations/[id]/page.tsx",
  "frontend/src/app/procurement/comparison/page.tsx",
  "frontend/src/app/procurement/purchase-orders/page.tsx",
  "frontend/src/app/procurement/purchase-orders/new/page.tsx",
  "frontend/src/app/procurement/purchase-orders/[id]/page.tsx",
  "frontend/src/app/procurement/goods-receipts/page.tsx",
  "frontend/src/app/procurement/goods-receipts/new/page.tsx",
  "frontend/src/app/procurement/goods-receipts/[id]/page.tsx",
  "frontend/src/app/procurement/invoice-matches/page.tsx",
  "frontend/src/app/procurement/invoice-matches/new/page.tsx",
  "frontend/src/app/procurement/invoice-matches/[id]/page.tsx",
  "frontend/src/app/procurement/payment-requests/page.tsx",
  "frontend/src/app/procurement/payment-requests/new/page.tsx",
  "frontend/src/app/procurement/payment-requests/[id]/page.tsx",
];

const requiredHooks = [
  "frontend/src/hooks/useProcurement.ts",
  "frontend/src/hooks/useQuotations.ts",
  "frontend/src/hooks/useQuotationComparison.ts",
  "frontend/src/hooks/usePurchaseOrders.ts",
  "frontend/src/hooks/useGoodsReceipts.ts",
  "frontend/src/hooks/useInvoiceMatches.ts",
  "frontend/src/hooks/usePaymentRequests.ts",
  "frontend/src/hooks/useProcurementDashboard.ts",
];

const requiredTypes = [
  "frontend/src/types/procurement.ts",
  "frontend/src/types/quotation.ts",
  "frontend/src/types/quotationComparison.ts",
  "frontend/src/types/purchaseOrder.ts",
  "frontend/src/types/goodsReceipt.ts",
  "frontend/src/types/invoiceMatch.ts",
  "frontend/src/types/paymentRequest.ts",
  "frontend/src/types/procurementDashboard.ts",
];

const navigationRoutes = [
  "/procurement/dashboard",
  "/procurement/requests",
  "/procurement/rfqs",
  "/procurement/quotations",
  "/procurement/comparison",
  "/procurement/purchase-orders",
  "/procurement/goods-receipts",
  "/procurement/invoice-matches",
  "/procurement/payment-requests",
];

console.log(
  "===== Procurement Frontend Release Audit =====",
);

for (const path of requiredRoutes) {
  assertFile(path);

  assertContains(
    path,
    "ProtectedRoute",
    `Protected route: ${path}`,
  );

  assertContains(
    path,
    "AdminShell",
    `Admin shell: ${path}`,
  );
}

for (const path of requiredHooks) {
  assertFile(path);
}

for (const path of requiredTypes) {
  assertFile(path);
}

for (const route of navigationRoutes) {
  assertContains(
    "frontend/src/components/layout/AdminShell.tsx",
    `href: "${route}"`,
    `Navigation contains ${route}`,
  );
}

const allFiles = [
  ...collectFiles(
    "frontend/src/app/procurement",
  ),
  ...collectFiles(
    "frontend/src/components/procurement",
  ),
  ...requiredHooks,
  ...requiredTypes,
];

for (
  const path
  of Array.from(
    new Set(allFiles),
  )
) {
  if (!existsSync(join(root, path))) {
    continue;
  }

  const text = readFileSync(
    join(root, path),
    "utf8",
  );

  if (text.includes("TODO")) {
    warn(`TODO found in ${path}`);
  }

  if (text.includes("FIXME")) {
    warn(`FIXME found in ${path}`);
  }

  if (text.includes("console.log(")) {
    warn(`console.log found in ${path}`);
  }
}

console.log();
console.log("===== Audit Summary =====");
console.log(`Passed: ${passed.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Routes checked: ${requiredRoutes.length}`);

if (warnings.length) {
  console.log();
  console.log("Warnings:");

  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (failures.length) {
  console.error();
  console.error(
    "Procurement frontend audit failed.",
  );

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log();
console.log(
  "Procurement frontend audit passed.",
);
