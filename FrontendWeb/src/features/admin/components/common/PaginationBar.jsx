import React from "react";

export default function PaginationBar({ page = 1, totalPages = 1, total = 0, onPageChange, align = "between" }) {
  const containerClass =
    align === "end"
      ? "mt-3 flex justify-end items-center gap-2 text-sm text-slate-500"
      : "mt-3 flex items-center justify-between text-sm text-slate-500";

  return (
    <div className={containerClass}>
      {align === "between" ? <span>Tổng: {total || 0}</span> : null}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </button>
        <span>{page || 1}/{totalPages || 1}</span>
        <button
          className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
          disabled={page >= (totalPages || 1)}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
