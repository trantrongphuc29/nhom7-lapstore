import React from "react";

/** Cùng khung với ProductCard — dùng khi đang tải sau khi đổi bộ lọc */
export default function ProductCardSkeleton() {
  return (
    <div
      className="h-[468px] max-h-[468px] rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col p-3 md:p-4"
      aria-hidden
    >
      <div className="h-[210px] md:h-[232px] w-full shrink-0 rounded-xl bg-slate-200 animate-pulse" />
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
