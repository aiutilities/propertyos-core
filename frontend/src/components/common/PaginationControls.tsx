"use client";

type Props = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function PaginationControls({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: Props) {
  if (total === 0) {
    return null;
  }

  const firstRecord = (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <p>
        Showing <strong>{firstRecord}</strong>–<strong>{lastRecord}</strong>{" "}
        of <strong>{total}</strong>
      </p>

      <div className="pagination-actions">
        <button
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          disabled={page >= totalPages}
          type="button"
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
