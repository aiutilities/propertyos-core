#!/usr/bin/env python3

from pathlib import Path
import sys

LOGIN_FORM = Path(
    "frontend/src/components/auth/LoginForm.tsx"
)

FORBIDDEN = [
    "admin@propertyos.local",
    "admin12345",
]

REQUIRED = [
    'const [email, setEmail] = useState("");',
    'const [password, setPassword] = useState("");',
    'autoComplete="email"',
    'autoComplete="current-password"',
    'type="password"',
    'disabled={loading}',
    'router.replace("/dashboard")',
]

if not LOGIN_FORM.is_file():
    raise SystemExit(
        f"ERROR: Login form missing: {LOGIN_FORM}"
    )

text = LOGIN_FORM.read_text(
    encoding="utf-8"
)

for value in FORBIDDEN:
    if value in text:
        raise SystemExit(
            "ERROR: Browser-visible default credential "
            f"remains: {value}"
        )

for value in REQUIRED:
    if value not in text:
        raise SystemExit(
            f"ERROR: Required login contract missing: {value}"
        )

frontend_root = Path("frontend/src")

for path in frontend_root.rglob("*"):
    if not path.is_file():
        continue

    if path.suffix not in {
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".json",
    }:
        continue

    content = path.read_text(
        encoding="utf-8",
        errors="ignore",
    )

    for value in FORBIDDEN:
        if value in content:
            raise SystemExit(
                "ERROR: Default credential found in "
                f"{path}: {value}"
            )

print("Login credential safety: VALID")
print("Email default:            empty")
print("Password default:         empty")
print("Email autocomplete:       email")
print("Password autocomplete:    current-password")
print("Browser credential leak:  absent")
