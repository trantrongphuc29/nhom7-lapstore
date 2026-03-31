import React from "react";

export default function ConfirmModal({ open, title, message, confirmText = "Xác nhận", cancelText = "Hủy", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1.5 text-sm rounded-lg border border-slate-200" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
