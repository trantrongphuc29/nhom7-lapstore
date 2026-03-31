import React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function DataTable({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
  onSearch,
  searchValue,
  toolbar,
}) {
  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 gap-y-3">
        <div className="flex items-center gap-2 min-w-0 flex-1 basis-[200px]">
          <span className="material-symbols-outlined text-slate-400 shrink-0">search</span>
          <input
            className="text-sm outline-none min-w-0 flex-1"
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Tìm theo tên, SKU, slug..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">{toolbar}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left py-2.5 px-3 font-semibold text-slate-600">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2.5 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-500" colSpan={columns.length}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
