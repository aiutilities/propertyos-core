"use client";

import { use } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ThemeDetails from "@/components/theme/ThemeDetails";

export default function ThemeDetailsPage({
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
            <p className="eyebrow">Appearance</p>
            <h1>Theme Details</h1>
          </div>

          <Link className="button-link" href="/themes">
            Back to Themes
          </Link>
        </div>

        <ThemeDetails themeId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
