import React from "react";
import { labelAdminOrderStatus } from "../../utils/orderStatus";

const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  confirmed: "bg-sky-100 text-sky-700",
  shipping: "bg-indigo-100 text-indigo-700",
  done: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  returned: "bg-slate-200 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  blocked: "bg-rose-100 text-rose-700",
  approved: "bg-emerald-100 text-emerald-700",
  hidden: "bg-slate-200 text-slate-700",
  spam: "bg-rose-100 text-rose-700",
};

const ORDER_KEYS = new Set(["pending", "accepted", "delivered"]);

export default function StatusBadge({ status }) {
  const cls = STATUS_COLOR[status] || "bg-slate-100 text-slate-700";
  const label = ORDER_KEYS.has(status) ? labelAdminOrderStatus(status) : status;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${cls}`}>{label}</span>
  );
}
