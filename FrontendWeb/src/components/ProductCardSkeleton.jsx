import React from "react";

/** Cùng khung với ProductCard — dùng khi đang tải sau khi đổi bộ lọc */
export default function ProductCardSkeleton() {
  return (
    <div
      className="flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2 sm:min-h-[380px] sm:rounded-2xl sm:p-3 md:p-4 lg:h-[490px] lg:max-h-[490px]"
      aria-hidden
    >
      <div className="h-[110px] w-full shrink-0 animate-pulse rounded-lg bg-slate-200 sm:h-[160px] md:h-[210px] lg:h-[232px] lg:rounded-xl" />
      <div className="flex flex-col flex-1 min-h-0 pt-2.5 gap-2 mt-0">
        <div className="h-4 bg-slate-200 rounded-md w-4/5 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse" />
        <div className="h-[15px] bg-slate-200 rounded-md w-full animate-pulse" />
        <div className="h-[15px] bg-slate-200 rounded-md w-11/12 animate-pulse" />
        <div className="mt-auto pt-2 border-t border-slate-100 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-8 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse" />
          </div>
          <div className="h-6 w-28 bg-slate-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}
