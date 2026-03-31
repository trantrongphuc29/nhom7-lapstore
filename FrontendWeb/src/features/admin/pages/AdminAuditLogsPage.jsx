import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import PaginationBar from "../components/common/PaginationBar";
import TableShell from "../components/common/TableShell";
import { EmptyRow, ErrorBox, LoadingRow } from "../components/common/AsyncState";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { getAdminAuditLogs } from "../services/adminAudit.service";

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedModuleFilter = useDebouncedValue(moduleFilter, 400);
  const debouncedActionFilter = useDebouncedValue(actionFilter, 400);
  const debouncedSearch = useDebouncedValue(search, 400);
  useEffect(() => {
    setPage(1);
  }, [debouncedModuleFilter, debouncedActionFilter, debouncedSearch]);
  const query = useQuery({
    queryKey: ["admin-audit-logs", { module: debouncedModuleFilter, action: debouncedActionFilter, search: debouncedSearch, page }],
    queryFn: () =>
      getAdminAuditLogs({ module: debouncedModuleFilter, action: debouncedActionFilter, search: debouncedSearch, page, limit: 20 }, token),
    enabled: Boolean(token),
    keepPreviousData: true,
  });
  const records = query.data?.records ?? [];
  const pagination = query.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader title="Audit logs" subtitle="Theo dõi hành động quản trị theo module" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
          placeholder="Lọc module (orders, products...)"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        />
        <input
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
          placeholder="Lọc action (create, update...)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        />
        <input
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 min-w-[220px]"
          placeholder="Tìm theo email/module/action/target"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <TableShell
        headers={[
          { key: "id", label: "ID" },
          { key: "createdAt", label: "Thời gian" },
          { key: "user", label: "User" },
          { key: "module", label: "Module" },
          { key: "action", label: "Action" },
          { key: "target", label: "Target" },
          { key: "metadata", label: "Metadata" },
        ]}
      >
        {query.isLoading ? (
          <LoadingRow colSpan={7} text="Đang tải log..." />
        ) : (
          records.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-3 py-2.5">{r.id}</td>
              <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
              <td className="px-3 py-2.5">{r.userEmail || `#${r.userId || "-"}`}</td>
              <td className="px-3 py-2.5">{r.module}</td>
              <td className="px-3 py-2.5">{r.action}</td>
              <td className="px-3 py-2.5">{r.targetType}:{r.targetId}</td>
              <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[340px]">
                {r.metadata ? <pre className="whitespace-pre-wrap break-words">{JSON.stringify(r.metadata, null, 2)}</pre> : "—"}
              </td>
            </tr>
          ))
        )}
        {!query.isLoading && records.length === 0 ? <EmptyRow colSpan={7} text="Chưa có log." /> : null}
      </TableShell>
      {query.isError ? <div className="mt-3"><ErrorBox text={query.error?.message || "Không tải được audit logs"} /></div> : null}
      <PaginationBar
        page={pagination.page || 1}
        totalPages={pagination.totalPages || 1}
        total={pagination.total || 0}
        onPageChange={setPage}
        align="end"
      />
    </div>
  );
}
