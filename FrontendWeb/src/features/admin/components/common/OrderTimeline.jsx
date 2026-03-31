import React from "react";
import { labelAdminOrderStatus } from "../../utils/orderStatus";

export default function OrderTimeline({ timeline = [] }) {
  return (
    <div className="space-y-3">
      {timeline.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">{labelAdminOrderStatus(item.status)}</p>
            {item.note ? <p className="text-xs text-slate-500">{item.note}</p> : null}
            <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>
      ))}
      {timeline.length === 0 ? <p className="text-xs text-slate-500">Chưa có lịch sử trạng thái.</p> : null}
    </div>
  );
}
