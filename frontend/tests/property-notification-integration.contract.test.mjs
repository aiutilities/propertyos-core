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

const propertyForm = read(
  "../src/components/property/PropertyForm.tsx",
);

const zoneForm = read(
  "../src/components/zone/ZoneForm.tsx",
);

const spaceForm = read(
  "../src/components/space/SpaceForm.tsx",
);

test(
  "queues Property create and update notifications before redirect",
  () => {
    assert.match(
      propertyForm,
      /notifications\.afterRedirect\.created/,
    );

    assert.match(
      propertyForm,
      /notifications\.afterRedirect\.updated/,
    );

    assert.match(
      propertyForm,
      /"Property"/,
    );

    assert.match(
      propertyForm,
      /router\.replace/,
    );
  },
);

test(
  "shows sanitized Property failure notifications",
  () => {
    assert.match(
      propertyForm,
      /notifications\.error/,
    );

    assert.match(
      propertyForm,
      /Property could not be created/,
    );

    assert.match(
      propertyForm,
      /Property could not be updated/,
    );
  },
);

test(
  "queues Zone creation notification",
  () => {
    assert.match(
      zoneForm,
      /notifications\.afterRedirect\.created/,
    );

    assert.match(
      zoneForm,
      /"Zone"/,
    );

    assert.match(
      zoneForm,
      /Zone could not be created/,
    );
  },
);

test(
  "queues Space creation notification",
  () => {
    assert.match(
      spaceForm,
      /notifications\.afterRedirect\.created/,
    );

    assert.match(
      spaceForm,
      /"Space"/,
    );

    assert.match(
      spaceForm,
      /Space could not be created/,
    );
  },
);

test(
  "does not expose raw mutation errors inline",
  () => {
    assert.doesNotMatch(
      zoneForm,
      /err instanceof Error \? err\.message/,
    );

    assert.doesNotMatch(
      spaceForm,
      /err instanceof Error \? err\.message/,
    );
  },
);
