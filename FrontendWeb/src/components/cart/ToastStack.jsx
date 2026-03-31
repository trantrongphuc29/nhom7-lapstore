import React from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../context/ToastContext";

export default function ToastStack() {
  const { toasts, remove } = useToast();

  return createPortal(
    <div
      className="fixed z-[200] flex flex-col gap-2 pointer-events-none items-center bottom-4 left-4 right-4 md:items-end md:bottom-6 md:right-6 md:left-auto w-auto max-w-full"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const duration = typeof t.duration === "number" ? t.duration : 3000;
        const showBar = duration > 0 && !t.exiting;
        const barClass =
          t.type === "error"
            ? "bg-rose-500/90"
            : t.type === "undo"
              ? "bg-[#CCFF00]"
              : "bg-emerald-500/90";
        return (
          <div
            key={t.id}
            className={[
              "pointer-events-auto w-full max-w-md rounded-xl border shadow-lg relative transition-opacity duration-300 toast-animate-in overflow-hidden",
              t.exiting ? "!opacity-0" : "opacity-100",
              t.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : t.type === "undo"
                  ? "bg-slate-900 border-slate-700 text-white"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900",
            ].join(" ")}
          >
            <div className="px-4 py-3 pr-10">
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 z-10"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-lg leading-none">close</span>
              </button>
              <div className="flex gap-2 items-start pr-5">
                {t.type === "error" ? (
                  <span className="text-lg leading-none shrink-0" aria-hidden>
                    ⚠
                  </span>
                ) : null}
                <div className="flex-1 text-sm font-medium leading-snug">
                  {t.message}
                  {t.type === "undo" && t.onUndo ? (
                    <button
                      type="button"
                      onClick={() => {
                        t.onUndo();
                        remove(t.id);
                      }}
                      className="ml-2 font-bold underline underline-offset-2 text-[#CCFF00]"
                    >
                      Hoàn tác
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            {showBar ? (
              <div className="h-1 w-full bg-black/10" aria-hidden>
                <div
                  className={`h-full toast-progress-fill ${barClass}`}
                  style={{ "--toast-duration": `${duration}ms` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>,
    document.body
  );
}
