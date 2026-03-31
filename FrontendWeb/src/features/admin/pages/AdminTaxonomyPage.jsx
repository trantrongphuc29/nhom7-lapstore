import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";
import PageHeader from "../components/common/PageHeader";
import TableShell from "../components/common/TableShell";
import { EmptyRow, ErrorBox, LoadingRow } from "../components/common/AsyncState";
import {
  createAdminBrand,
  deleteAdminBrand,
  getAdminBrands,
  updateAdminBrand,
} from "../services/adminTaxonomy.service";

const BRAND_INITIAL = { id: null, name: "", slug: "", sortOrder: 0, isActive: true };

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminTaxonomyPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(BRAND_INITIAL);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ["admin-taxonomy", "brand"],
    queryFn: () => getAdminBrands(token),
    enabled: Boolean(token),
  });

  const upsertMutation = useMutation({
    mutationFn: (payload) => {
      return payload.id ? updateAdminBrand(payload.id, payload, token) : createAdminBrand(payload, token);
    },
    onSuccess: () => {
      toast.success(form.id ? "Đã cập nhật thương hiệu" : "Đã tạo thương hiệu");
      query.refetch();
      setForm(BRAND_INITIAL);
    },
    onError: (error) => toast.error(error?.message || "Không thể lưu thương hiệu"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminBrand(id, token),
    onSuccess: () => {
      toast.success("Đã xóa thương hiệu");
      query.refetch();
      if (form.id) setForm(BRAND_INITIAL);
    },
    onError: (error) => toast.error(error?.message || "Không thể xóa thương hiệu"),
  });

  const records = query.data ?? [];
  const filtered = (() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((r) => r.name?.toLowerCase().includes(keyword) || r.slug?.toLowerCase().includes(keyword));
  })();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2">
        <PageHeader title="Quản lý thương hiệu" subtitle="Quản trị danh sách thương hiệu dùng cho sản phẩm" />
        <div className="mb-3">
          <input
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc slug"
          />
        </div>
        <TableShell
          headers={[
            { key: "id", label: "ID" },
            { key: "name", label: "Tên" },
            { key: "slug", label: "Slug" },
            { key: "products", label: "SP dùng" },
            { key: "sort", label: "Thứ tự" },
            { key: "status", label: "Trạng thái" },
            { key: "actions", label: "Thao tác" },
          ]}
        >
          {query.isLoading ? (
            <LoadingRow colSpan={7} text="Đang tải..." />
          ) : (
            filtered.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2.5">{row.id}</td>
                <td className="px-3 py-2.5">{row.name}</td>
                <td className="px-3 py-2.5">{row.slug}</td>
                <td className="px-3 py-2.5">{Number(row.productCount || 0)}</td>
                <td className="px-3 py-2.5">{row.sortOrder || 0}</td>
                <td className="px-3 py-2.5">{row.isActive ? "Hoạt động" : "Ẩn"}</td>
                <td className="px-3 py-2.5">
                  <button className="text-xs text-blue-600 hover:underline mr-3" onClick={() => setForm({ ...row })}>
                    Sửa
                  </button>
                  <button
                    className="text-xs text-rose-600 hover:underline"
                    onClick={() => {
                      if (!window.confirm(`Xóa thương hiệu "${row.name}"?`)) return;
                      deleteMutation.mutate(row.id);
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
          {!query.isLoading && filtered.length === 0 ? <EmptyRow colSpan={7} text="Không có dữ liệu." /> : null}
        </TableShell>
        {query.isError ? <div className="mt-3"><ErrorBox text={query.error?.message || "Không tải được thương hiệu"} /></div> : null}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{form.id ? "Cập nhật thương hiệu" : "Tạo thương hiệu mới"}</h3>
        <div className="space-y-2">
          <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="Tên" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="flex gap-2">
            <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            <button
              type="button"
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
              onClick={() => setForm((f) => ({ ...f, slug: slugify(f.name) }))}
            >
              Tạo slug
            </button>
          </div>
          <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value || 0) }))} />
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Hoạt động
          </label>
          <div className="flex gap-2 pt-1">
            <button
              className="text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 disabled:opacity-60"
              disabled={upsertMutation.isLoading || deleteMutation.isLoading}
              onClick={() => {
                const payload = { ...form, slug: form.slug || slugify(form.name) };
                upsertMutation.mutate(payload);
              }}
            >
              {upsertMutation.isLoading ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Tạo mới"}
            </button>
            <button className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-60" disabled={upsertMutation.isLoading || deleteMutation.isLoading} onClick={() => setForm(BRAND_INITIAL)}>
              Làm mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
