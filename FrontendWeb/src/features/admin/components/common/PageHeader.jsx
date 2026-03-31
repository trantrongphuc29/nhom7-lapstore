import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
