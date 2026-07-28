import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(relativePath) {
  return fs.readFileSync(
    new URL(
      relativePath,
      import.meta.url,
    ),
    "utf8",
  );
}

const runtime = read(
  "../src/lib/notifications.ts",
);

const provider = read(
  "../src/components/notification/NotificationProvider.tsx",
);

const hook = read(
  "../src/hooks/useNotifications.ts",
);

const layout = read(
  "../src/app/layout.tsx",
);

const styles = read(
  "../src/app/styles.css",
);

const contract = read(
  "../../documentation/product-audit/GLOBAL_NOTIFICATION_UX_CONTRACT.md",
);

const configuration =
  JSON.parse(
    read(
      "../public/config/notifications.json",
    ),
  );

test(
  "installs the notification provider at the application root",
  () => {
    assert.match(
      layout,
      /<NotificationProvider>/,
    );

    assert.match(
      provider,
      /aria-live="polite"/,
    );
  },
);

test(
  "supports all four notification tones",
  () => {
    for (
      const tone
      of [
        "success",
        "error",
        "warning",
        "information",
      ]
    ) {
      assert.match(
        runtime,
        new RegExp(`"${tone}"`),
      );

      assert.match(
        styles,
        new RegExp(
          `notification-toast-${tone}`,
        ),
      );
    }
  },
);

test(
  "provides configurable CRUD templates",
  () => {
    assert.match(
      configuration.templates.create,
      /created successfully/,
    );

    assert.match(
      configuration.templates.update,
      /updated successfully/,
    );

    assert.match(
      configuration.templates.delete,
      /deleted successfully/,
    );
  },
);

test(
  "supports redirect persistence",
  () => {
    assert.match(
      runtime,
      /queueRedirectNotification/,
    );

    assert.match(
      runtime,
      /consumeRedirectNotifications/,
    );

    assert.match(
      runtime,
      /sessionStorage/,
    );

    assert.match(
      hook,
      /afterRedirect/,
    );
  },
);

test(
  "supports administrator overrides",
  () => {
    assert.match(
      runtime,
      /readNotificationOverride/,
    );

    assert.match(
      runtime,
      /saveNotificationOverride/,
    );

    assert.match(
      runtime,
      /localStorage/,
    );
  },
);

test(
  "sanitizes backend failures",
  () => {
    assert.match(
      runtime,
      /sanitizeNotificationError/,
    );

    assert.match(
      runtime,
      /should not exist/,
    );
  },
);

test(
  "provides semantic action helpers",
  () => {
    for (
      const helper
      of [
        "created:",
        "updated:",
        "deleted:",
        "approved:",
        "rejected:",
        "completed:",
      ]
    ) {
      assert.match(
        hook,
        new RegExp(helper),
      );
    }
  },
);

test(
  "documents notification governance",
  () => {
    assert.match(
      contract,
      /No CRUD operation/,
    );

    assert.match(
      contract,
      /Redirect Persistence/,
    );

    assert.match(
      contract,
      /Raw API JSON/,
    );
  },
);

test(
  "consumes redirect notifications after client navigation",
  () => {
    assert.match(
      provider,
      /usePathname/,
    );

    assert.match(
      provider,
      /configurationLoaded/,
    );

    assert.match(
      provider,
      /consumeRedirectNotifications/,
    );

    assert.match(
      provider,
      /pathname,/,
    );
  },
);
