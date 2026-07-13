"use client";

import { use } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PluginDetails from "@/components/plugin/PluginDetails";

export default function PluginDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Extensibility</p>
            <h1>Plugin Details</h1>
          </div>

          <Link className="button-link" href="/plugins">
            Back to Plugins
          </Link>
        </div>

        <PluginDetails pluginId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
