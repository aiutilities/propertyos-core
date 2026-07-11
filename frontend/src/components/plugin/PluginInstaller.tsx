"use client";

import { useState } from "react";
import Link from "next/link";
import { usePluginInstaller } from "@/hooks/usePluginInstaller";

export default function PluginInstaller() {
  const {
    installing,
    error,
    result,
    install,
    reset,
  } = usePluginInstaller();

  const [file, setFile] = useState<File | null>(null);
  const [autoEnable, setAutoEnable] = useState(true);
  const [overwrite, setOverwrite] = useState(false);

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      `Install ${file.name}? ` +
        (autoEnable
          ? "The plugin will be activated automatically."
          : "The plugin will remain inactive after installation."),
    );

    if (!confirmed) {
      return;
    }

    await install(file, {
      autoEnable,
      overwrite,
    });
  }

  function selectFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selected = event.target.files?.[0] ?? null;

    reset();
    setFile(selected);
  }

  return (
    <div className="plugin-installer-layout">
      <form
        className="plugin-installer-card"
        onSubmit={submit}
      >
        <div>
          <p className="eyebrow">Install from ZIP</p>
          <h2>Upload a plugin package</h2>
          <p className="muted">
            PropertyOS will upload, extract, validate, resolve
            dependencies, run migrations, register and optionally
            activate the plugin.
          </p>
        </div>

        <label className="plugin-file-field">
          Plugin ZIP
          <input
            required
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            disabled={installing}
            onChange={selectFile}
          />
        </label>

        {file ? (
          <div className="plugin-selected-file">
            <strong>{file.name}</strong>
            <span>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        ) : null}

        <label className="plugin-checkbox">
          <input
            type="checkbox"
            checked={autoEnable}
            disabled={installing}
            onChange={(event) =>
              setAutoEnable(event.target.checked)
            }
          />
          <span>
            <strong>Activate after installation</strong>
            <small>
              Disable this to review the plugin before activation.
            </small>
          </span>
        </label>

        <label className="plugin-checkbox">
          <input
            type="checkbox"
            checked={overwrite}
            disabled={installing}
            onChange={(event) =>
              setOverwrite(event.target.checked)
            }
          />
          <span>
            <strong>Allow package overwrite</strong>
            <small>
              Use only when replacing an existing package.
            </small>
          </span>
        </label>

        {error ? <p className="error">{error}</p> : null}

        <div className="plugin-installer-actions">
          <button
            className="button-link"
            type="submit"
            disabled={installing || !file}
          >
            {installing
              ? "Installing plugin..."
              : "Upload and install"}
          </button>

          <button
            className="secondary-button"
            type="button"
            disabled={installing}
            onClick={() => {
              reset();
              setFile(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <aside className="plugin-installer-card">
        <div>
          <p className="eyebrow">Installation result</p>
          <h2>Pipeline status</h2>
        </div>

        {!result ? (
          <div className="plugin-installer-placeholder">
            <p>
              Select a ZIP package and start the installation.
              Pipeline messages will appear here.
            </p>
          </div>
        ) : (
          <div className="plugin-installation-result">
            <div className="plugin-installation-summary">
              <span
                className={
                  result.success
                    ? "plugin-result-success"
                    : "plugin-result-failed"
                }
              >
                {result.success ? "Success" : "Failed"}
              </span>

              <strong>{result.stage}</strong>
            </div>

            {result.manifest ? (
              <dl className="plugin-definition-list">
                <div>
                  <dt>Plugin</dt>
                  <dd>{result.manifest.displayName}</dd>
                </div>
                <div>
                  <dt>Package name</dt>
                  <dd>{result.manifest.name}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{result.manifest.version}</dd>
                </div>
              </dl>
            ) : null}

            <ol className="plugin-installation-messages">
              {result.messages.map((message, index) => (
                <li key={`${index}-${message}`}>
                  {message}
                </li>
              ))}
            </ol>

            {result.success && result.installedPluginId ? (
              <Link
                className="button-link"
                href={`/plugins/${result.installedPluginId}`}
              >
                View installed plugin
              </Link>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
}
