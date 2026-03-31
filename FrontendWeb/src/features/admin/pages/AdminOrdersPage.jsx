import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import OrderTimeline from "../components/common/OrderTimeline";
import ConfirmModal from "../components/common/ConfirmModal";
import PaginationBar from "../components/common/PaginationBar";
import TableShell from "../components/common/TableShell";
import { EmptyRow, ErrorBox, LoadingRow } from "../components/common/AsyncState";
import { useAuth } from "../../../context/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { formatVndCurrency } from "../utils/formatters";
import {
  getAdminOrderDetail,
  getAdminOrders,
  updateAdminOrderStatus,
} from "../services/adminOrders.service";
import { labelAdminOrderStatus } from "../utils/orderStatus";

const PAYMENT_LABELS = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  card: "Thẻ (thanh toán online)",
  e_wallet: "Ví điện tử",
};

const NEXT_STATUS_OPTIONS = {
  pending: ["accepted"],
  accepted: ["delivered"],
  delivered: [],
};

export default function AdminOrdersPage({ pendingOnly = false }) {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const selectFromNav = location.state?.selectOrderId;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(pendingOnly ? "pending" : "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [nextStatus, setNextStatus] = useState("accepted");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  // Khi đổi giữa /admin/orders và /admin/orders/pending,
  // React Router có thể chỉ đổi props chứ không remount => state filter dễ "dính".
  useEffect(() => {
    setSearch("");
    setStatus(pendingOnly ? "pending" : "");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setSelectedOrderId(null);
    setNextStatus("accepted");
    setConfirmOpen(false);
  }, [pendingOnly]);

  useEffect(() => {
    if (selectFromNav == null) return;
    const id = Number(selectFromNav);
    if (!Number.isInteger(id) || id <= 0) return;
    setSelectedOrderId(id);
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
  }, [selectFromNav, location.pathname, location.search, navigate]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dateFrom, dateTo]);

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", { search: debouncedSearch, status, dateFrom, dateTo, page }],
    queryFn: () => getAdminOrders({ search: debouncedSearch, status, dateFrom, dateTo, page, limit: 10 }, token),
    enabled: Boolean(token),
    keepPreviousData: true,
  });

  const detailQuery = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: () => getAdminOrderDetail(selectedOrderId, token),
    enabled: Boolean(token && selectedOrderId),
  });

  const selectedOrder = detailQuery.data;

  useEffect(() => {
    if (!selectedOrder) return;
    const options = NEXT_STATUS_OPTIONS[selectedOrder.status] || [];
    if (options.length > 0) setNextStatus(options[0]);
  }, [selectedOrder]);

  const updateStatusMutation = useMutation({
    mutationFn: (payload) => updateAdminOrderStatus(selectedOrderId, payload, token),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái đơn hàng");
      ordersQuery.refetch();
      detailQuery.refetch();
    },
    onError: (error) => toast.error(error?.message || "Không thể cập nhật trạng thái đơn hàng"),
  });

  const records = ordersQuery.data?.records ?? [];
  const pagination = ordersQuery.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const openConfirm = () => setConfirmOpen(true);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2">
        <PageHeader
          title={pendingOnly ? "Đơn cần xử lý" : "Tất cả đơn hàng"}
          subtitle="Theo dõi và cập nhật trạng thái đơn hàng."
        />
        <div className="mb-3 flex flex-wrap items-center gap-2 gap-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn / tên / SĐT"
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 min-w-[200px] flex-1 sm:flex-none"
          />
          {pendingOnly ? null : (
            <select
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Cần xử lý</option>
              <option value="accepted">Đã tiếp nhận</option>
              <option value="delivered">Đã giao</option>
            </select>
          )}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            title="Từ ngày"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            title="Đến ngày"
          />
        </div>
        <TableShell
          headers={[
            { key: "id", label: "ID" },
            { key: "code", label: "Mã đơn" },
            { key: "customer", label: "Khách hàng" },
            { key: "total", label: "Tổng tiền" },
            { key: "status", label: "Trạng thái" },
            { key: "payment", label: "Hình thức thanh toán" },
          ]}
        >
          {ordersQuery.isLoading ? (
            <LoadingRow colSpan={6} text="Đang tải đơn hàng..." />
          ) : (
            records.map((order) => (
              <tr
                key={order.id}
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <td className="py-2.5 px-3">{order.id}</td>
                <td className="py-2.5 px-3">{order.code}</td>
                <td className="py-2.5 px-3">{order.customerName}</td>
                <td className="py-2.5 px-3">{formatVndCurrency(order.totalAmount)}</td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-2.5 px-3 text-slate-700 text-xs">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "—"}</td>
              </tr>
            ))
          )}
          {!ordersQuery.isLoading && records.length === 0 ? <EmptyRow colSpan={6} text="Không có đơn hàng." /> : null}
        </TableShell>
        {ordersQuery.isError ? (
          <div className="mt-3">
            <ErrorBox text={ordersQuery.error?.message || "Không tải được danh sách đơn hàng"} />
          </div>
        ) : null}
        <PaginationBar
          page={pagination.page || 1}
          totalPages={pagination.totalPages || 1}
          total={pagination.total || 0}
          onPageChange={setPage}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 min-w-0">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Chi tiết đơn hàng</h3>
        {!selectedOrderId ? (
          <p className="text-sm text-slate-500">Chọn một đơn để xem chi tiết.</p>
        ) : detailQuery.isLoading ? (
          <p className="text-sm text-slate-500">Đang tải chi tiết...</p>
        ) : selectedOrder ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Mã đơn</p>
              <p className="text-sm font-semibold text-slate-700">{selectedOrder.code}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Khách hàng</p>
              <p className="text-sm text-slate-700">{selectedOrder.customerName}</p>
              <p className="text-xs text-slate-500">{selectedOrder.customerPhone}</p>
              {selectedOrder.customerEmail ? <p className="text-xs text-slate-500">{selectedOrder.customerEmail}</p> : null}
            </div>
            <div>
              <p className="text-xs text-slate-500">Địa chỉ giao hàng</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{selectedOrder.shippingAddress?.trim() || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Hình thức thanh toán</p>
              <p className="text-sm text-slate-700">{PAYMENT_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Voucher</p>
              <p className="text-sm text-slate-800 font-semibold">
                {selectedOrder.voucherDiscountAmount > 0
                  ? `Giảm ${formatVndCurrency(selectedOrder.voucherDiscountAmount)}`
                  : "Không sử dụng voucher"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Sản phẩm</p>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-100 p-2 text-xs bg-slate-50/80">
                    <p className="font-medium text-slate-800">
                      {item.productName} × {item.quantity} — {formatVndCurrency(item.unitPrice)}
                    </p>
                    <p className="text-slate-500 mt-1">{item.variantName || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Timeline</p>
              <OrderTimeline timeline={selectedOrder.timeline} />
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500 mb-2">Cập nhật trạng thái</p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 min-w-0 max-w-full bg-white shrink-0"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                >
                  {(NEXT_STATUS_OPTIONS[selectedOrder.status] || []).map((s) => (
                    <option key={s} value={s}>
                      {labelAdminOrderStatus(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="text-xs rounded-lg bg-blue-600 text-white px-3 py-1.5 disabled:opacity-60"
                  disabled={(NEXT_STATUS_OPTIONS[selectedOrder.status] || []).length === 0 || updateStatusMutation.isLoading}
                  onClick={openConfirm}
                >
                  {updateStatusMutation.isLoading ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không tìm thấy chi tiết đơn.</p>
        )}
        {detailQuery.isError ? (
          <div className="mt-3">
            <ErrorBox text={detailQuery.error?.message || "Không tải được chi tiết đơn hàng"} />
          </div>
        ) : null}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận đổi trạng thái đơn"
        message={
          nextStatus === "accepted"
            ? `Chuyển đơn sang ${labelAdminOrderStatus("accepted")}?`
            : `Chuyển đơn sang ${labelAdminOrderStatus(nextStatus)}?`
        }
        confirmText="Đổi trạng thái"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (updateStatusMutation.isLoading) return;
          setConfirmOpen(false);
          updateStatusMutation.mutate({ status: nextStatus });
        }}
      />
    </div>
  );
}
