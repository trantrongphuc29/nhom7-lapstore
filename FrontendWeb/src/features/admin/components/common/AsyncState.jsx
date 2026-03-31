import React from "react";

export function LoadingRow({ colSpan = 1, text = "Đang tải dữ liệu..." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-6 text-center text-slate-500">
        {text}
      </td>
    </tr>
  );
}

export function EmptyRow({ colSpan = 1, text = "Không có dữ liệu." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-6 text-center text-slate-500">
        {text}
      </td>
    </tr>
  );
}

export function ErrorBox({ text = "Có lỗi xảy ra." }) {
  return <div className="text-sm rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2">{text}</div>;
}
