import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmModal from "../components/common/ConfirmModal";
import PaginationBar from "../components/common/PaginationBar";
import TableShell from "../components/common/TableShell";
import { EmptyRow, ErrorBox, LoadingRow } from "../components/common/AsyncState";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { formatVnd } from "../utils/formatters";
import { getAdminCustomerDetail, getAdminCustomers, updateAdminCustomerStatus } from "../services/adminCustomers.service";

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const listQuery = useQuery({
    queryKey: ["admin-customers", { search: debouncedSearch, status, page }],
    queryFn: () => getAdminCustomers({ search: debouncedSearch, status, page, limit: 10 }, token),
    enabled: Boolean(token),
    keepPreviousData: true,
  });
  const detailQuery = useQuery({
    queryKey: ["admin-customer-detail", selectedId],
    queryFn: () => getAdminCustomerDetail(selectedId, token),
    enabled: Boolean(token && selectedId),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status: s }) => updateAdminCustomerStatus(id, { status: s }, token),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái khách hàng");
      listQuery.refetch();
      detailQuery.refetch();
    },
    onError: (error) => toast.error(error?.message || "Không thể cập nhật trạng thái khách hàng"),
  });

  const records = listQuery.data?.records ?? [];
  const pagination = listQuery.data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const detail = detailQuery.data;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2">
        <PageHeader title="Khách hàng" subtitle="Theo dõi danh sách khách hàng và trạng thái tài khoản" />
        <div className="mb-3 flex flex-wrap items-center gap-2 gap-y-3">
          <input className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 min-w-[200px] flex-1 sm:flex-none" placeholder="Tìm tên / email / SĐT" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 shrink-0 bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
          </select>
        </div>
        <TableShell
          headers={[
            { key: "id", label: "ID" },
            { key: "name", label: "Tên" },
            { key: "contact", label: "Liên hệ" },
            { key: "group", label: "Nhóm" },
            { key: "spent", label: "Chi tiêu" },
            { key: "status", label: "Trạng thái" },
          ]}
        >
          {listQuery.isLoading ? (
            <LoadingRow colSpan={6} text="Đang tải khách hàng..." />
          ) : (
            records.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(row.id)}>
                <td className="px-3 py-2.5">{row.id}</td>
                <td className="px-3 py-2.5">{row.fullName}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{row.email || "-"}<br />{row.phone || "-"}</td>
                <td className="px-3 py-2.5">{row.customerGroup}</td>
                <td className="px-3 py-2.5">{formatVnd(row.totalSpent)}đ</td>
                <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
              </tr>
            ))
          )}
          {!listQuery.isLoading && records.length === 0 ? <EmptyRow colSpan={6} text="Không có dữ liệu." /> : null}
        </TableShell>
        {listQuery.isError ? <div className="mt-3"><ErrorBox text={listQuery.error?.message || "Không tải được danh sách khách hàng"} /></div> : null}
        <PaginationBar
          page={pagination.page || 1}
          totalPages={pagination.totalPages || 1}
          total={pagination.total || 0}
          onPageChange={setPage}
        />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Chi tiết khách hàng</h3>
        {!selectedId ? (
          <p className="text-sm text-slate-500">Chọn một khách hàng để xem chi tiết.</p>
        ) : detailQuery.isLoading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : detail ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">{detail.fullName}</p>
              <p className="text-xs text-slate-500">{detail.email || "-"}</p>
              <p className="text-xs text-slate-500">{detail.phone || "-"}</p>
            </div>
            <div className="text-xs text-slate-600">Điểm tích lũy: {detail.loyaltyPoints}</div>
            <div className="text-xs text-slate-600">Tổng chi tiêu: {formatVnd(detail.totalSpent)}đ</div>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-60" disabled={updateMutation.isLoading} onClick={() => setPendingStatusUpdate({ id: detail.id, status: "active" })}>Mở khóa</button>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 text-white disabled:opacity-60" disabled={updateMutation.isLoading} onClick={() => setPendingStatusUpdate({ id: detail.id, status: "blocked" })}>Khóa</button>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">Đơn gần đây</p>
              <div className="space-y-1">
                {(detail.recentOrders || []).map((o) => (
                  <p key={o.id} className="text-xs text-slate-600">{o.code} - {formatVnd(o.totalAmount)}đ - {o.status}</p>
                ))}
                {(detail.recentOrders || []).length === 0 ? <p className="text-xs text-slate-500">Chưa có đơn hàng.</p> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ConfirmModal
        open={Boolean(pendingStatusUpdate)}
        title="Xác nhận cập nhật trạng thái khách hàng"
        message={`Bạn có chắc muốn chuyển trạng thái sang "${pendingStatusUpdate?.status}"?`}
        confirmText="Xác nhận"
        onCancel={() => setPendingStatusUpdate(null)}
        onConfirm={() => {
          if (updateMutation.isLoading) return;
          const payload = pendingStatusUpdate;
          setPendingStatusUpdate(null);
          if (payload) updateMutation.mutate(payload);
        }}
      />
    </div>
  );
}
