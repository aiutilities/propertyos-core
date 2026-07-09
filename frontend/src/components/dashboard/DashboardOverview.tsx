"use client";

import StatCard from "./StatCard";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardOverview() {
  const { data, loading } = useDashboard();

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!data) {
    return <p>Dashboard data is unavailable.</p>;
  }

  return (
    <div className="dashboard-grid">
      <StatCard title="Platform" value={`${data.platform.name} ${data.platform.version}`} />
      <StatCard title="Status" value={data.platform.status} />
      <StatCard title="Installed Plugins" value={data.plugins.installed} />
      <StatCard title="Active Plugins" value={data.plugins.active} />
      <StatCard title="Workflows" value={data.workflows.enabled ? "Enabled" : "Disabled"} />
      <StatCard title="Notifications" value={data.notifications.enabled ? "Enabled" : "Disabled"} />
    </div>
  );
}
