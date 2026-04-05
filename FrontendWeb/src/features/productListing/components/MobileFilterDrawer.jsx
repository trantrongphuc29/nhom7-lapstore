import React, { useEffect } from "react";

/** Panel bộ lọc (chỉ dùng dưới breakpoint lg). */
export default function MobileFilterDrawer({ open, onClose, title = "Bộ lọc", children }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Đóng bộ lọc" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 id="mobile-filter-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[26px] leading-none">close</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
