"use client";

export function HelpdeskSlaCountdown({
  dueAt,
}: {
  dueAt?: string | null;
}) {
  if (!dueAt) {
    return <span>—</span>;
  }

  const due =
    new Date(dueAt).getTime();

  if (Number.isNaN(due)) {
    return <span>—</span>;
  }

  const difference =
    due - Date.now();

  const overdue =
    difference < 0;

  const totalMinutes =
    Math.max(
      1,
      Math.floor(
        Math.abs(difference) /
          60_000,
      ),
    );

  const days =
    Math.floor(
      totalMinutes /
        (24 * 60),
    );

  const hours =
    Math.floor(
      (totalMinutes %
        (24 * 60)) /
        60,
    );

  const minutes =
    totalMinutes % 60;

  const parts = [
    days > 0
      ? `${days}d`
      : "",
    hours > 0
      ? `${hours}h`
      : "",
    days === 0 &&
    hours === 0
      ? `${minutes}m`
      : "",
  ].filter(Boolean);

  return (
    <span
      className={
        overdue
          ? "text-danger"
          : "text-success"
      }
    >
      {parts.join(" ")}{" "}
      {overdue
        ? "overdue"
        : "remaining"}
    </span>
  );
}
