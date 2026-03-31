import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { VIETNAM_PROVINCES } from "../../data/vietnamProvinces";

export default function ProvincePickerModal({ open, onClose, onSelect, currentValue }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return VIETNAM_PROVINCES;
    return VIETNAM_PROVINCES.filter((p) => p.toLowerCase().includes(t));
  }, [q]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[170] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="province-picker-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 id="province-picker-title" className="text-lg font-bold text-slate-900">
              Chọn tỉnh / thành phố
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm tỉnh, thành phố..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Danh sách 63 tỉnh, thành phố</p>
        </div>
        <ul className="overflow-y-auto flex-1 mini-cart-scroll px-2 py-2">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-500">Không tìm thấy kết quả.</li>
          ) : (
            filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(name);
                    onClose();
                  }}
                  className={[
                    "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition",
                    currentValue === name ? "bg-slate-900 text-[#CCFF00]" : "text-slate-800 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {name}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body
  );
}
