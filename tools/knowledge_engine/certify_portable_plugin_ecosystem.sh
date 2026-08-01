#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/anandnataraj/aiutilities/PropertyOS/propertyos-core"
EXPECTED_HEAD=""
REPORT="/tmp/propertyos-phase21b22g3-all-plugin-build-certification.txt"
WORK="$(mktemp -d /tmp/propertyos-phase21b22g3-XXXXXX)"

fail(){ echo; echo "ERROR: $1"; exit 1; }
cleanup(){ rm -rf "$WORK"; }
trap cleanup EXIT

cd "$REPO"

EXPECTED_HEAD="$(git rev-parse --short=8 HEAD)"
exec > >(tee "$REPORT") 2>&1

echo "============================================================"
echo "PHASE 21B22G4 — PERMANENT ECOSYSTEM CERTIFICATION"
echo "EXTERNAL TEMPORARY WORKSPACE / NO REPOSITORY MUTATION"
echo "============================================================"

test "$(git rev-parse --short=8 HEAD)" = "$EXPECTED_HEAD" || fail "HEAD changed"
test -z "$(git status --porcelain=v1 -uall)" || fail "Repository is not clean"

echo
echo "1. REPOSITORY"
echo "Branch : $(git branch --show-current)"
echo "HEAD   : $(git rev-parse HEAD)"
echo "Status : CLEAN"
echo "Work   : $WORK"

echo
echo "2. PREPARE EXTERNAL ECOSYSTEM"

mkdir -p "$WORK/generated/plugin-staging" "$WORK/generated/plugin-artifacts" "$WORK/packages"

cp generated/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz \
   "$WORK/generated/plugin-artifacts/"

python3 - "$WORK" <<'PY'
from pathlib import Path
import json, shutil, sys

work = Path(sys.argv[1])
src_root = Path("generated/plugin-staging")
dst_root = work / "generated/plugin-staging"

plugins = []
for src in sorted(src_root.iterdir()):
    if not (src.is_dir() and (src/"package.json").is_file() and (src/"plugin.json").is_file()):
        continue

    pkg = json.loads((src/"package.json").read_text())
    manifest = json.loads((src/"plugin.json").read_text())
    plugin_id = manifest.get("id") or manifest.get("pluginId") or manifest.get("name") or src.name

    dst = dst_root / src.name
    shutil.copytree(
        src, dst,
        ignore=shutil.ignore_patterns("node_modules", "dist", "coverage", "*.tgz"),
    )
    plugins.append({"id": plugin_id, "workspace": src.name, "package": pkg["name"]})
    print(f"{plugin_id}|copied")

if len(plugins) != 16:
    raise SystemExit(f"Expected 16 plugins, found {len(plugins)}")

(work/"inventory.json").write_text(json.dumps(plugins, indent=2, sort_keys=True) + "\n")
print("Plugin inventory: PASS")
PY

echo
echo "3. STATIC PORTABILITY GATES"

python3 - "$WORK" <<'PY'
from pathlib import Path
import json, sys

work = Path(sys.argv[1])
root = work/"generated/plugin-staging"
errors = []

for ws in sorted(root.iterdir()):
    pkg = json.loads((ws/"package.json").read_text())
    plugin = json.loads((ws/"plugin.json").read_text())
    ts = json.loads((ws/"tsconfig.json").read_text())
    meta = pkg.get("propertyos", {})
    dep = pkg.get("dependencies", {}).get("@propertyos/core-contracts")

    checks = [
        (meta.get("sourceStrategy") == "portable-facade", "source strategy"),
        (meta.get("hostApiVersion") == "0.1.0", "host API"),
        (meta.get("portable") is True, "portable flag"),
        (dep == "file:../../plugin-artifacts/propertyos-core-contracts-0.1.0.tgz", f"contract dependency {dep}"),
        ("extends" not in ts, "repository tsconfig"),
        (ts.get("compilerOptions", {}).get("module") == "Node16", "module"),
        (ts.get("compilerOptions", {}).get("moduleResolution") == "Node16", "moduleResolution"),
        (plugin.get("materialization", {}).get("sourceStrategy") == "portable-facade", "plugin strategy"),
    ]
    for ok, label in checks:
        if not ok:
            errors.append(f"{ws.name}: {label}")

    for path in (ws/"package.json", ws/"plugin.json", ws/"tsconfig.json"):
        text = path.read_text()
        for marker in ("backend/tsconfig", "backend/src", "/Users/", "docker-compose", "docker.sock"):
            if marker in text:
                errors.append(f"{ws.name}: {marker} in {path.name}")

    print(f"{ws.name}|portable=PASS")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)

print("Static portability: PASS")
PY

echo
echo "4. INSTALL, TYPECHECK, BUILD AND PACK"

python3 - "$WORK/inventory.json" <<'PY' > "$WORK/order.txt"
from pathlib import Path
import json, sys
items = json.loads(Path(sys.argv[1]).read_text())
for item in sorted(items, key=lambda x: (x["workspace"] == "procurement", x["workspace"])):
    print(item["workspace"])
PY

PASS=0
: > "$WORK/results.tsv"

while IFS= read -r name; do
  WS="$WORK/generated/plugin-staging/$name"
  echo
  echo "------------------------------------------------------------"
  echo "PLUGIN: $name"
  echo "------------------------------------------------------------"

  rm -rf "$WS/node_modules" "$WS/dist" "$WS/coverage"

  (
    cd "$WS"
    npm ci --ignore-scripts
    npm run typecheck
    npm run build
    npm pack --json --pack-destination "$WORK/packages" > "$WORK/${name}-pack.json"
  )

  PASS=$((PASS+1))
  printf '%s\tPASS\n' "$name" >> "$WORK/results.tsv"
  echo "$name: PASS"
done < "$WORK/order.txt"

test "$PASS" -eq 16 || fail "Expected 16 passing plugins, found $PASS"
cat "$WORK/results.tsv"

echo
echo "5. ARCHIVE GATE"

python3 - "$WORK" <<'PY'
from pathlib import Path
import tarfile, sys

work = Path(sys.argv[1])
archives = sorted((work/"packages").glob("propertyos-plugin-*.tgz"))
if len(archives) != 16:
    raise SystemExit(f"Expected 16 archives, found {len(archives)}")

for archive in archives:
    with tarfile.open(archive, "r:gz") as tf:
        names = set(tf.getnames())
    required = {"package/package.json", "package/plugin.json", "package/README.md"}
    missing = required - names
    if missing:
        raise SystemExit(f"{archive.name}: missing {sorted(missing)}")
    if not any(n.startswith("package/dist/") and n.endswith(".js") for n in names):
        raise SystemExit(f"{archive.name}: no compiled JavaScript")
    print(f"{archive.name}|archive=PASS|files={len(names)}")

print("All plugin archives: PASS")
PY

echo
echo "6. CLEAN CONSUMER INSTALL"

mkdir -p "$WORK/consumer/node_modules/plugin-artifacts"

cp   "$REPO/generated/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz"   "$WORK/consumer/node_modules/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz"

test -f   "$WORK/consumer/node_modules/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz"   || fail "Consumer-local core-contract artifact copy failed"

echo "Consumer-local contract artifact: READY"

CONSUMER="$WORK/consumer"
mkdir -p "$CONSUMER"
printf '%s\n' '{"name":"propertyos-plugin-consumer-proof","version":"0.1.0","private":true}' \
  > "$CONSUMER/package.json"

HELPDESK="$(find "$WORK/packages" -maxdepth 1 -name 'propertyos-plugin-helpdesk-*.tgz' -print -quit)"
CORE="$WORK/generated/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz"

test -f "$HELPDESK" || fail "Helpdesk archive missing"

(
  cd "$CONSUMER"
  npm install --ignore-scripts "$CORE" "$HELPDESK"
)

node - "$CONSUMER" <<'JS'
const path = require("path");
const root = process.argv[2];
const core = require(path.join(root,"node_modules","@propertyos","core-contracts","package.json"));
const plugin = require(path.join(root,"node_modules","@propertyos","plugin-helpdesk","package.json"));
if (core.propertyos.sourceStrategy !== "portable-facade") throw new Error("Core is not portable");
if (plugin.propertyos.sourceStrategy !== "portable-facade") throw new Error("Plugin is not portable");
if (plugin.propertyos.hostApiVersion !== "0.1.0") throw new Error("Host API mismatch");
console.log("Clean consumer install: PASS");
JS

echo
echo "7. TRACKED REPOSITORY SAFETY"

cd "$REPO"
test "$(git rev-parse --short=8 HEAD)" = "$EXPECTED_HEAD" || fail "HEAD changed"
test -z "$(git status --porcelain=v1 -uall)" || fail "Repository changed"

RESIDUE="$(git ls-tree -r --name-only HEAD generated/plugin-staging | grep -E '/node_modules/|/coverage/' || true)"
test -z "$RESIDUE" || { echo "$RESIDUE"; fail "Tracked dependency residue found"; }

echo "Tracked node_modules: NONE"
echo "Repository status   : CLEAN"

echo
echo "8. CLEAN TEMPORARY WORKSPACE"
cleanup
trap - EXIT
test ! -e "$WORK" || fail "Temporary workspace remains"
echo "Temporary workspace: REMOVED"

echo
echo "============================================================"
echo "PHASE 21B22G4 PERMANENT ECOSYSTEM CERTIFICATION COMPLETE"
echo "Plugins certified : 16"
echo "Install           : PASS"
echo "Typecheck         : PASS"
echo "Build             : PASS"
echo "npm pack          : PASS"
echo "Consumer install  : PASS"
echo "Repository        : CLEAN"
echo "Report            : $REPORT"
echo "Next              : PHASE 21B22H RELEASE READINESS"
echo "============================================================"
