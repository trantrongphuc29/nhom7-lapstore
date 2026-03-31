import React from "react";

export default function StatCard({ icon, label, value, trend }) {
  const isPositive = (trend || 0) >= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="material-symbols-outlined text-slate-500">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{value}</p>
      {trend != null && !Number.isNaN(Number(trend)) ? (
        <p className={`mt-2 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          {isPositive ? "+" : ""}
          {Number(trend).toFixed(1)}% so với hôm qua
        </p>
      ) : null}
    </div>
  );
}
