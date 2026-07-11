import Link from "next/link";

const modules = [
  {
    title: "Workflow Center",
    description:
      "Inspect workflow definitions, metrics, entity instances and start workflows manually.",
    href: "/workflows",
  },
  {
    title: "Notification Center",
    description:
      "Review generated notifications, delivery status, channels and registered templates.",
    href: "/notifications",
  },
  {
    title: "Scheduler Center",
    description:
      "Monitor scheduled jobs, registered handlers, failures and manual job execution.",
    href: "/scheduler",
  },
];

export default function OperationsHome() {
  return (
    <div className="operations-module-grid">
      {modules.map((module) => (
        <Link
          className="operations-module-card"
          href={module.href}
          key={module.href}
        >
          <div>
            <p className="eyebrow">Operations Engine</p>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </div>

          <span>Open module →</span>
        </Link>
      ))}
    </div>
  );
}
