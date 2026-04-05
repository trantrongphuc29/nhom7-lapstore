import React from "react";
import { Link } from "react-router-dom";

/** current: "cart" | "shipping" | "payment" */
const steps = [
  { id: "cart", label: "Giỏ hàng", shortLabel: "Giỏ hàng", href: "/gio-hang" },
  { id: "shipping", label: "Thông tin nhận hàng", shortLabel: "Nhận hàng", href: "/thong-tin-nhan-hang" },
  { id: "payment", label: "Thanh toán", shortLabel: "Thanh toán", href: "/thanh-toan" },
];

export default function CheckoutProgress({ current = "cart" }) {
  const currentIndex = steps.findIndex((s) => s.id === current);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <nav aria-label="Tiến trình đặt hàng" className="mb-6 w-full max-w-full min-w-0 sm:mb-8">
      <ol className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-4 sm:gap-y-3 md:gap-x-6">
        {steps.map((step, i) => {
          const done = i < safeIndex;
          const active = i === safeIndex;
          const canLink = step.href && i < safeIndex;

          const inner = (
            <>
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors",
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                      ? "bg-slate-900 border-slate-900 text-[#CCFF00]"
                      : "bg-white border-slate-200 text-slate-400",
                ].join(" ")}
              >
                {done ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
              </span>
              <span
                className={[
                  "text-center text-[11px] font-semibold leading-tight sm:whitespace-nowrap sm:text-sm",
                  active ? "text-slate-900" : done ? "text-emerald-700" : "text-slate-400",
                ].join(" ")}
              >
                <span className="sm:hidden">{step.shortLabel}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </>
          );

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-4 md:gap-6">
              {canLink ? (
                <Link to={step.href} className="flex items-center gap-2.5 rounded-xl px-1 py-1 hover:bg-slate-100/80 transition min-w-0">
                  {inner}
                </Link>
              ) : (
                <div className={`flex items-center gap-2.5 px-1 py-1 min-w-0 ${active ? "" : "opacity-90"}`}>{inner}</div>
              )}
              {i < steps.length - 1 ? (
                <span
                  className={["hidden sm:block w-6 md:w-12 h-0.5 shrink-0 rounded-full", done ? "bg-emerald-400" : "bg-slate-200"].join(" ")}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
