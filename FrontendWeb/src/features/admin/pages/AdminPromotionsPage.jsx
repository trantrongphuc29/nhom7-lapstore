import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import TableShell from "../components/common/TableShell";
import { EmptyRow, ErrorBox, LoadingRow } from "../components/common/AsyncState";
import { useAuth } from "../../../context/AuthContext";
import {
  createAdminVoucher,
  deleteAdminVoucher,
  getAdminPromotions,
  updateAdminVoucher,
} from "../services/adminPromotions.service";
import { fmtPrice } from "../../../utils/format";

function localDatetimeToMysql(value) {
  if (!value || !String(value).trim()) return null;
  const s = String(value).replace("T", " ");
  return s.length === 16 ? `${s}:00` : s;
}

function formatCellDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

/** API → input datetime-local (theo giờ trình duyệt) */
function toDatetimeLocal(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

function voucherToForm(v) {
  return {
    code: String(v.code || "").toUpperCase(),
    discountType: v.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(v.discountValue) || 0,
    minOrderValue: Number(v.minOrderValue) || 0,
    maxDiscountAmount: v.maxDiscountAmount != null ? Number(v.maxDiscountAmount) : 0,
    usageLimit: Number(v.usageLimit) || 0,
    startsAt: toDatetimeLocal(v.startsAt),
    endsAt: toDatetimeLocal(v.endsAt),
    isActive: Boolean(v.isActive),
  };
}

function discountLabel(v) {
  if (v.discountType === "percent") {
    const cap = v.maxDiscountAmount != null && Number(v.maxDiscountAmount) > 0 ? ` (tối đa ${fmtPrice(v.maxDiscountAmount)}₫)` : "";
    return `${Number(v.discountValue)}%${cap}`;
  }
  return `${fmtPrice(v.discountValue)}₫`;
}

const initialForm = () => ({
  code: "",
  discountType: "percent",
  discountValue: 10,
  minOrderValue: 0,
  maxDiscountAmount: 0,
  usageLimit: 100,
  startsAt: "",
  endsAt: "",
  isActive: true,
});

export default function AdminPromotionsPage() {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);

  const query = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: () => getAdminPromotions(token),
    enabled: Boolean(token),
  });

  const createVoucher = useMutation({
    mutationFn: (payload) => createAdminVoucher(payload, token),
    onSuccess: () => {
      toast.success("Đã tạo voucher");
      setForm(initialForm());
      setSelectedId(null);
      query.refetch();
    },
    onError: (error) => toast.error(error?.message || "Không thể tạo voucher"),
  });

  const updateVoucher = useMutation({
    mutationFn: ({ id, body }) => updateAdminVoucher(id, body, token),
    onSuccess: () => {
      toast.success("Đã cập nhật voucher");
      query.refetch();
    },
    onError: (error) => toast.error(error?.message || "Không thể cập nhật voucher"),
  });

  const removeVoucher = useMutation({
    mutationFn: (id) => deleteAdminVoucher(id, token),
    onSuccess: () => {
      toast.success("Đã xóa voucher");
      setForm(initialForm());
      setSelectedId(null);
      query.refetch();
    },
    onError: (error) => toast.error(error?.message || "Không thể xóa voucher"),
  });

  const vouchers = query.data?.vouchers ?? [];
  const saving = createVoucher.isPending || updateVoucher.isPending || removeVoucher.isPending;

  const selectRow = (v) => {
    setSelectedId(v.id);
    setForm(voucherToForm(v));
  };

  const startNew = () => {
    setSelectedId(null);
    setForm(initialForm());
  };

  const buildPayload = () => ({
    code: String(form.code || "").trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderValue: Math.max(0, Number(form.minOrderValue) || 0),
    maxDiscountAmount:
      form.discountType === "percent" ? Math.max(0, Number(form.maxDiscountAmount) || 0) || null : null,
    usageLimit: Math.max(0, Number(form.usageLimit) || 0),
    startsAt: localDatetimeToMysql(form.startsAt),
    endsAt: localDatetimeToMysql(form.endsAt),
    isActive: form.isActive,
  });

  const submit = () => {
    const code = String(form.code || "").trim();
    if (!code) {
      toast.error("Nhập mã voucher.");
      return;
    }
    if (form.discountType === "percent" && (form.discountValue <= 0 || form.discountValue > 100)) {
      toast.error("Giảm % phải từ 1 đến 100.");
      return;
    }
    if (form.discountType === "fixed" && form.discountValue <= 0) {
      toast.error("Số tiền giảm phải lớn hơn 0.");
      return;
    }
    const payload = buildPayload();
    if (selectedId != null) {
      updateVoucher.mutate({ id: selectedId, body: payload });
    } else {
      createVoucher.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (selectedId == null) return;
    if (!window.confirm(`Xóa voucher "${form.code}"? Hành động không hoàn tác.`)) return;
    removeVoucher.mutate(selectedId);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <PageHeader title="Khuyến mãi" subtitle="Chọn voucher trong danh sách để sửa, hoặc tạo mới bên phải." />
        {query.isError ? <ErrorBox text={query.error?.message || "Không tải được dữ liệu khuyến mãi"} /> : null}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Danh sách voucher</p>
          <p className="text-xs text-slate-500 mb-2">Nhấp một dòng để nạp vào form chỉnh sửa.</p>
          <TableShell
            headers={[
              { key: "code", label: "Mã" },
              { key: "discount", label: "Ưu đãi" },
              { key: "min", label: "Đơn tối thiểu" },
              { key: "usage", label: "Lượt dùng" },
              { key: "period", label: "Hiệu lực" },
              { key: "active", label: "Trạng thái" },
            ]}
          >
            {query.isLoading ? (
              <LoadingRow colSpan={6} text="Đang tải voucher..." />
            ) : (
              vouchers.map((v) => {
                const active = selectedId === v.id;
                return (
                  <tr
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectRow(v)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectRow(v);
                      }
                    }}
                    className={[
                      "border-t border-slate-100 cursor-pointer transition-colors outline-none",
                      active ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{v.code}</td>
                    <td className="px-3 py-2.5 text-sm">{discountLabel(v)}</td>
                    <td className="px-3 py-2.5 text-sm tabular-nums">{fmtPrice(v.minOrderValue || 0)}₫</td>
                    <td className="px-3 py-2.5 text-sm tabular-nums">
                      {v.usedCount ?? 0}/{Number(v.usageLimit) > 0 ? v.usageLimit : "∞"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[200px]">
                      <span className="block">{v.startsAt ? formatCellDate(v.startsAt) : "—"}</span>
                      <span className="block text-slate-400">→ {v.endsAt ? formatCellDate(v.endsAt) : "—"}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {v.isActive ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">Đang bật</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">Tắt</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {!query.isLoading && vouchers.length === 0 ? <EmptyRow colSpan={6} text="Chưa có voucher." /> : null}
          </TableShell>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 h-fit xl:sticky xl:top-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            {selectedId != null ? `Sửa voucher #${selectedId}` : "Tạo voucher mới"}
          </h3>
          <button
            type="button"
            onClick={startNew}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2"
          >
            Tạo mới
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-slate-600 font-medium">Mã hiển thị cho khách *</span>
            <input
              className="mt-1 w-full font-mono uppercase border border-slate-200 rounded-lg px-3 py-2"
              placeholder="VD: GIAM500K"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
            <span className="text-[11px] text-slate-500">Đổi mã phải trùng unique; trùng mã khác sẽ báo lỗi.</span>
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">Loại giảm *</span>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              value={form.discountType}
              onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
            >
              <option value="percent">Phần trăm trên tạm tính</option>
              <option value="fixed">Số tiền cố định (₫)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">{form.discountType === "percent" ? "Phần trăm giảm *" : "Số tiền giảm (₫) *"}</span>
            <input
              type="number"
              min={form.discountType === "percent" ? 1 : 1000}
              max={form.discountType === "percent" ? 100 : undefined}
              step={form.discountType === "percent" ? 1 : 1000}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 tabular-nums"
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value || 0) }))}
            />
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">Giá trị đơn tối thiểu (₫)</span>
            <input
              type="number"
              min={0}
              step={1000}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 tabular-nums"
              value={form.minOrderValue}
              onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value || 0) }))}
            />
            <span className="text-[11px] text-slate-500">Tạm tính giỏ phải đạt mức này mới áp dụng được mã.</span>
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">Giảm tối đa (₫)</span>
            <input
              type="number"
              min={0}
              step={1000}
              disabled={form.discountType !== "percent"}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 tabular-nums disabled:bg-slate-100 disabled:text-slate-400"
              value={form.maxDiscountAmount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: Number(e.target.value || 0) }))}
            />
            <span className="text-[11px] text-slate-500">
              Chỉ áp dụng cho voucher giảm theo %. Nhập 0 để không giới hạn.
            </span>
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">Giới hạn lượt dùng</span>
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 tabular-nums"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: Number(e.target.value || 0) }))}
            />
            <span className="text-[11px] text-slate-500">0 = không giới hạn số lần sử dụng.</span>
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">Bắt đầu có hiệu lực</span>
            <input
              type="datetime-local"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-slate-600 font-medium">Kết thúc hiệu lực</span>
            <input
              type="datetime-local"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-slate-300"
            />
            <span className="text-slate-700">Voucher đang hoạt động</span>
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full text-sm rounded-lg bg-blue-600 text-white px-3 py-2.5 font-semibold disabled:opacity-60 hover:bg-blue-700 transition"
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Đang xử lý…" : selectedId != null ? "Lưu thay đổi" : "Tạo voucher"}
          </button>
          {selectedId != null ? (
            <button
              type="button"
              className="w-full text-sm rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2.5 font-semibold hover:bg-rose-100 disabled:opacity-60 transition"
              disabled={saving}
              onClick={handleDelete}
            >
              Xóa voucher
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
