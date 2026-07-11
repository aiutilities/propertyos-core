"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  PluginInstallationResult,
  UploadResponse,
} from "@/types/plugin";

const MAX_PLUGIN_SIZE_BYTES = 10 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Unable to read the selected ZIP file."));
    };

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to encode the selected ZIP file."));
        return;
      }

      const separatorIndex = result.indexOf(",");

      resolve(
        separatorIndex >= 0
          ? result.slice(separatorIndex + 1)
          : result,
      );
    };

    reader.readAsDataURL(file);
  });
}

export function usePluginInstaller() {
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<PluginInstallationResult | null>(null);

  async function install(
    file: File,
    options: {
      autoEnable: boolean;
      overwrite: boolean;
    },
  ) {
    setInstalling(true);
    setError("");
    setResult(null);

    try {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        throw new Error("Select a valid .zip plugin package.");
      }

      if (file.size > MAX_PLUGIN_SIZE_BYTES) {
        throw new Error(
          "Plugin ZIP exceeds the current 10 MB upload limit.",
        );
      }

      const content = await fileToBase64(file);
      const objectKey = [
        "plugin-packages",
        `${Date.now()}-${crypto.randomUUID()}-${file.name}`,
      ].join("/");

      const uploadResponse = await apiRequest<UploadResponse>(
        "/uploads",
        {
          method: "POST",
          body: JSON.stringify({
            objectKey,
            content,
            originalName: file.name,
            mimeType:
              file.type ||
              "application/zip",
            entityType: "PLUGIN_PACKAGE",
            metadata: {
              purpose: "plugin-installation",
            },
          }),
        },
      );

      const installation =
        await apiRequest<PluginInstallationResult>(
          "/plugin-installer/install",
          {
            method: "POST",
            body: JSON.stringify({
              storageObjectId:
                uploadResponse.data.upload.storageObjectId,
              autoEnable: options.autoEnable,
              overwrite: options.overwrite,
              metadata: {
                originalName: file.name,
                uploadObjectKey:
                  uploadResponse.data.upload.objectKey,
              },
            }),
          },
        );

      setResult(installation);

      if (!installation.success) {
        setError(
          installation.messages.join(" ") ||
            installation.error ||
            "Plugin installation failed.",
        );
      }

      return installation;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to install the plugin.",
      );
      return null;
    } finally {
      setInstalling(false);
    }
  }

  function reset() {
    setError("");
    setResult(null);
  }

  return {
    installing,
    error,
    result,
    install,
    reset,
  };
}
