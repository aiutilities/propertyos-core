"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ThemeTable from "@/components/theme/ThemeTable";
import { useThemes } from "@/hooks/useThemes";

export default function ThemesPage() {
  const { themes, loading, error } = useThemes();

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Appearance</p>
            <h1>Themes</h1>
          </div>
        </div>

        {loading && <p>Loading themes...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && (
          <ThemeTable themes={themes} />
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
