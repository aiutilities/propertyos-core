export function VendorRatingDisplay({
  value,
  count,
}: {
  value: number;
  count?: number;
}) {
  const normalized =
    Number.isFinite(value)
      ? Math.max(
          0,
          Math.min(
            5,
            value,
          ),
        )
      : 0;

  return (
    <span
      aria-label={
        `${normalized.toFixed(1)} out of 5`
      }
    >
      <strong>
        {normalized.toFixed(1)}
      </strong>
      {" / 5"}
      {count !== undefined
        ? ` (${count})`
        : ""}
    </span>
  );
}
