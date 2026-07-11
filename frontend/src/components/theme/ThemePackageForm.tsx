"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useThemePackageRegistration,
} from "@/hooks/useThemePackageRegistration";

function parseLayouts(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ThemePackageForm() {
  const {
    submitting,
    error,
    result,
    register,
    reset,
  } = useThemePackageRegistration();

  const [packageName, setPackageName] = useState("");
  const [themeId, setThemeId] = useState("");
  const [themeName, setThemeName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [layouts, setLayouts] = useState("");
  const [logo, setLogo] = useState("");
  const [primaryColor, setPrimaryColor] =
    useState("#111827");
  const [secondaryColor, setSecondaryColor] =
    useState("#ffffff");
  const [sourcePath, setSourcePath] = useState("");

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const confirmed = window.confirm(
      `Register theme package ${packageName} version ${version}?`,
    );

    if (!confirmed) {
      return;
    }

    await register({
      name: packageName.trim(),
      version: version.trim(),
      sourcePath: sourcePath.trim() || undefined,
      manifest: {
        id: themeId.trim(),
        name: themeName.trim(),
        version: version.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        layouts: parseLayouts(layouts),
        branding: {
          logo: logo.trim() || undefined,
          primaryColor: primaryColor.trim() || undefined,
          secondaryColor:
            secondaryColor.trim() || undefined,
        },
      },
      metadata: {
        registeredVia: "admin-console",
      },
    });
  }

  function clearForm() {
    reset();
    setPackageName("");
    setThemeId("");
    setThemeName("");
    setVersion("1.0.0");
    setAuthor("");
    setDescription("");
    setLayouts("");
    setLogo("");
    setPrimaryColor("#111827");
    setSecondaryColor("#ffffff");
    setSourcePath("");
  }

  return (
    <div className="theme-package-registration-layout">
      <form
        className="theme-package-registration-card"
        onSubmit={submit}
      >
        <div>
          <p className="eyebrow">Theme Package</p>
          <h2>Register a theme package</h2>
          <p className="muted">
            Register and validate a theme manifest before installing it.
          </p>
        </div>

        <div className="form-grid">
          <label>
            Package name
            <input
              required
              placeholder="Example: propertyos-modern"
              value={packageName}
              onChange={(event) =>
                setPackageName(event.target.value)
              }
            />
          </label>

          <label>
            Version
            <input
              required
              placeholder="1.0.0"
              value={version}
              onChange={(event) =>
                setVersion(event.target.value)
              }
            />
          </label>

          <label>
            Theme ID
            <input
              required
              placeholder="propertyos-modern"
              value={themeId}
              onChange={(event) =>
                setThemeId(event.target.value)
              }
            />
          </label>

          <label>
            Display name
            <input
              required
              placeholder="PropertyOS Modern"
              value={themeName}
              onChange={(event) =>
                setThemeName(event.target.value)
              }
            />
          </label>

          <label>
            Author
            <input
              placeholder="Theme author"
              value={author}
              onChange={(event) =>
                setAuthor(event.target.value)
              }
            />
          </label>

          <label>
            Source path
            <input
              placeholder="Optional server package path"
              value={sourcePath}
              onChange={(event) =>
                setSourcePath(event.target.value)
              }
            />
          </label>

          <label>
            Primary colour
            <input
              type="color"
              value={primaryColor}
              onChange={(event) =>
                setPrimaryColor(event.target.value)
              }
            />
          </label>

          <label>
            Secondary colour
            <input
              type="color"
              value={secondaryColor}
              onChange={(event) =>
                setSecondaryColor(event.target.value)
              }
            />
          </label>
        </div>

        <label>
          Supported layouts
          <input
            placeholder="admin, resident, security"
            value={layouts}
            onChange={(event) =>
              setLayouts(event.target.value)
            }
          />
        </label>

        <label>
          Logo URL
          <input
            placeholder="/assets/theme-logo.svg"
            value={logo}
            onChange={(event) =>
              setLogo(event.target.value)
            }
          />
        </label>

        <label>
          Description
          <textarea
            placeholder="Describe this theme"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <div className="plugin-installer-actions">
          <button
            className="button-link"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Registering..."
              : "Register Package"}
          </button>

          <button
            className="secondary-button"
            type="button"
            disabled={submitting}
            onClick={clearForm}
          >
            Reset
          </button>
        </div>
      </form>

      <aside className="theme-package-registration-card">
        <div>
          <p className="eyebrow">Validation Result</p>
          <h2>Package status</h2>
        </div>

        {!result ? (
          <div className="plugin-installer-placeholder">
            <p>
              Submit the package manifest to see validation results.
            </p>
          </div>
        ) : (
          <div className="theme-registration-result">
            <div className="plugin-installation-summary">
              <span
                className={
                  result.status === "INVALID"
                    ? "plugin-result-failed"
                    : "plugin-result-success"
                }
              >
                {result.status}
              </span>

              <strong>{result.version}</strong>
            </div>

            <dl className="plugin-definition-list">
              <div>
                <dt>Package</dt>
                <dd>{result.name}</dd>
              </div>
              <div>
                <dt>Theme</dt>
                <dd>{result.manifest.name}</dd>
              </div>
              <div>
                <dt>Theme ID</dt>
                <dd>{result.manifest.id}</dd>
              </div>
            </dl>

            {result.validationErrors.length > 0 ? (
              <ul className="theme-registration-errors">
                {result.validationErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="success-message">
                Theme package passed validation and is ready to install.
              </p>
            )}

            <Link
              className="button-link"
              href="/themes/packages"
            >
              View Theme Packages
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
