import React from "react";

export default function TableShell({ headers = [], children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h.key || h.label} className="text-left px-3 py-2.5 text-slate-600">
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
