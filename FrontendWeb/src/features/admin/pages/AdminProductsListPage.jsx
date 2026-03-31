import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import PageHeader from "../components/common/PageHeader";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import { useAdminProductsQuery } from "../hooks/useAdminProductsQuery";
import {
  bulkDeleteAdminProducts,
  bulkUpdateAdminProductStatus,
} from "../services/adminProducts.service";
import { useAuth } from "../../../context/AuthContext";
import { formatVndCurrency } from "../utils/formatters";
import { normalizeRole } from "../utils/rbac";

export default function AdminProductsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const role = normalizeRole(user?.role);
  const canManageProducts = role === "admin";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [rowSelection, setRowSelection] = useState({});

  const { data, isLoading } = useAdminProductsQuery({
    page,
    limit: 10,
    search,
    status,
    sortBy,
    sortDir,
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (payload) => bulkUpdateAdminProductStatus(payload, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: (payload) => bulkDeleteAdminProducts(payload, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const records = data?.records || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]).map(Number),
    [rowSelection]
  );

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: "",
        cell: ({ row }) => (
          <input
            type="checkbox"
            disabled={!canManageProducts}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      { accessorKey: "name", header: "Tên sản phẩm" },
      {
        id: "skuBlock",
        header: "SKU",
        cell: ({ row }) => (
          <div className="text-xs max-w-[240px]">
            <p className="font-mono font-semibold text-slate-800 truncate" title={row.original.sku || ""}>
              {row.original.sku || "—"}
            </p>
            {row.original.variantSkus ? (
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2" title={row.original.variantSkus}>
                {row.original.variantSkus}
              </p>
            ) : null}
          </div>
        ),
      },
      { accessorKey: "brand", header: "Thương hiệu" },
      {
        accessorKey: "salePrice",
        header: "Giá bán",
        cell: ({ row }) => formatVndCurrency(row.original.salePrice || 0),
      },
      { accessorKey: "stock", header: "Tồn kho" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => navigate(`/admin/products/${row.original.id}/edit`)}
          >
            {canManageProducts ? "Sửa" : "Xem"}
          </button>
        ),
      },
    ],
    [navigate, canManageProducts]
  );

  const exportExcel = () => {
    const header = ["id", "name", "sku", "variantSkus", "brand", "salePrice", "stock", "status"];
    const lines = records.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      variantSkus: r.variantSkus || "",
      brand: r.brand,
      salePrice: r.salePrice,
      stock: r.stock,
      status: r.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(lines, { header });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "admin-products.xlsx");
  };

  return (
    <div>
      <PageHeader title="Danh sách sản phẩm" subtitle="Server-side search/filter/sort/pagination cho module sản phẩm admin." />
      <div className="mb-3 flex flex-wrap items-center gap-2 gap-y-3">
        <select
          className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 bg-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
          <option value="out_of_stock">Hết hàng</option>
          <option value="coming_soon">Sắp ra mắt</option>
        </select>
        <select className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 bg-white" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">Mới nhất</option>
          <option value="name">Tên</option>
          <option value="sale_price">Giá</option>
          <option value="stock">Tồn kho</option>
        </select>
        <select className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 bg-white" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
        <button className="text-xs rounded-lg border border-slate-200 px-3 py-1.5" onClick={exportExcel}>
          Xuất Excel
        </button>
        {canManageProducts && selectedIds.length > 0 ? (
          <>
            <button
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5"
              onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: "active" })}
            >
              Hiện hàng loạt
            </button>
            <button
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5"
              onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: "inactive" })}
            >
              Ẩn hàng loạt
            </button>
            <button
              className="text-xs rounded-lg border border-rose-200 text-rose-600 px-3 py-1.5"
              onClick={() => bulkDeleteMutation.mutate({ ids: selectedIds })}
            >
              Xóa hàng loạt
            </button>
          </>
        ) : null}
      </div>
      {isLoading ? (
        <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <DataTable
          columns={columns}
          data={records}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onSearch={setSearch}
          searchValue={search}
        />
      )}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>Tổng: {pagination.total || 0}</span>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </button>
          <span>
            {pagination.page || 1}/{pagination.totalPages || 1}
          </span>
          <button
            className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
