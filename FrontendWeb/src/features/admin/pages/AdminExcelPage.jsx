import React, { useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { downloadExcelTemplate, downloadReportExcel, postExcelImport } from "../services/adminExcel.service";

const IMPORT_TYPES = [
  { value: "products_new", label: "Sản phẩm mới" },
  { value: "price_update", label: "Cập nhật giá hàng loạt" },
  { value: "warehouse_batch", label: "Phiếu nhập kho hàng loạt" },
];

const IMPORT_SPECS = {
  products_new: {
    title: "Sản phẩm mới",
    requiredColumns: ["name", "brand", "category", "sku", "price", "stock"],
    samples: [
      { name: "Laptop A", brand: "Lenovo", category: "Gaming", sku: "LENOVO-LOQ-001", price: 19990000, stock: 10 },
      { name: "Laptop B", brand: "Asus", category: "Văn phòng", sku: "ASUS-VIVOBOOK-002", price: 14990000, stock: 5 },
    ],
  },
  price_update: {
    title: "Cập nhật giá hàng loạt",
    requiredColumns: ["sku", "retail_price", "vat_rate", "rounding_rule"],
    samples: [
      { sku: "LENOVO-LOQ-001", retail_price: 20990000, vat_rate: 10, rounding_rule: "round_to_990" },
      { sku: "ASUS-VIVOBOOK-002", retail_price: 14990000, vat_rate: 10, rounding_rule: "round_nearest_1000" },
    ],
  },
  warehouse_batch: {
    title: "Phiếu nhập kho hàng loạt",
    requiredColumns: ["import_date", "invoice_number", "sku", "quantity", "import_price", "vat_rate", "serial_number"],
    samples: [
      {
        import_date: "2026-03-25",
        invoice_number: "HDN-0001",
        sku: "LENOVO-LOQ-001",
        quantity: 1,
        import_price: 15000000,
        vat_rate: 10,
        serial_number: "PF3ABC1234",
      },
    ],
  },
};

function sheetRowsToObjects(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function getRowKeys(rows) {
  const first = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!first || typeof first !== "object") return [];
  return Object.keys(first).map((k) => String(k).trim());
}

function normalizeKey(k) {
  return String(k || "").trim().toLowerCase();
}

function precheckWorkbookRows(type, rows) {
  if (!Array.isArray(rows)) return { ok: false, message: "Không đọc được sheet (rows rỗng)" };
  if (rows.length === 0) return { ok: false, message: "Sheet không có dữ liệu" };
  const spec = IMPORT_SPECS[type];
  if (!spec) return { ok: true };
  const keys = getRowKeys(rows).map(normalizeKey);
  const missing = (spec.requiredColumns || []).filter((c) => !keys.includes(normalizeKey(c)));
  if (missing.length > 0) {
    return { ok: false, message: `Thiếu cột bắt buộc: ${missing.join(", ")}` };
  }
  return { ok: true };
}

export default function AdminExcelPage() {
  const { token, user } = useAuth();
  const perms = user?.permissions || {};
  const [importType, setImportType] = useState("products_new");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const canProducts = perms.canEditCostAndImport;
  const canWarehouse = perms.canManageWarehouse;
  const canReport = perms.canExportFinancialReports;
  const importAllowed =
    importType === "warehouse_batch" ? canWarehouse : importType === "products_new" || importType === "price_update" ? canProducts : false;

  const parseAndPreview = async () => {
    if (!file || !token) {
      toast.error("Chọn file .xlsx");
      return;
    }
    const name = String(file?.name || "").toLowerCase();
    if (!(name.endsWith(".xlsx") || name.endsWith(".xls"))) {
      toast.error("File không đúng định dạng (.xlsx/.xls)");
      return;
    }
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const rows = sheetRowsToObjects(wb);
      const pre = precheckWorkbookRows(importType, rows);
      if (!pre.ok) {
        toast.error(pre.message || "File Excel không đúng format");
        setPreview(null);
        return;
      }
      const res = await postExcelImport({ type: importType, rows, dryRun: true }, token);
      setPreview(res);
      toast.success(`Kiểm tra: ${res.errorCount || 0} lỗi, ${res.successCount || 0} dòng hợp lệ`);
    } catch (e) {
      toast.error(e.message || "Lỗi đọc file / preview");
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    if (!file || !token) {
      toast.error("Chọn file .xlsx");
      return;
    }
    const name = String(file?.name || "").toLowerCase();
    if (!(name.endsWith(".xlsx") || name.endsWith(".xls"))) {
      toast.error("File không đúng định dạng (.xlsx/.xls)");
      return;
    }
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const rows = sheetRowsToObjects(wb);
      const pre = precheckWorkbookRows(importType, rows);
      if (!pre.ok) {
        toast.error(pre.message || "File Excel không đúng format");
        setPreview(null);
        return;
      }
      const res = await postExcelImport({ type: importType, rows, dryRun: false }, token);
      setPreview(res);
      toast.success(`Xong: ${res.successCount || 0} thành công, ${res.errorCount || 0} lỗi`);
    } catch (e) {
      toast.error(e.message || "Import thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onDownloadTemplate = async () => {
    if (!token) return;
    try {
      await downloadExcelTemplate(importType, token);
    } catch (e) {
      toast.error(e.message || "Không tải mẫu");
    }
  };

  const onDownloadReport = async (report) => {
    if (!token) return;
    try {
      await downloadReportExcel(report, token);
    } catch (e) {
      toast.error(e.message || "Không tải báo cáo");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader title="Import / Export Excel" subtitle="Preview trước khi ghi DB; tải file mẫu theo từng loại." />

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Import</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={importType}
            onChange={(e) => {
              setImportType(e.target.value);
              setPreview(null);
            }}
          >
            {IMPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={onDownloadTemplate}
          >
            Tải file mẫu
          </button>
        </div>
        {!importAllowed ? (
          <p className="text-xs text-amber-700">
            Bạn không có quyền import loại đã chọn (sản phẩm/giá: Super Admin / Kế toán; phiếu kho: quyền kho).
          </p>
        ) : null}

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold mb-1">Mẫu &amp; format ({IMPORT_SPECS[importType]?.title || importType})</p>
          <p className="text-slate-600">
            Cột bắt buộc:{" "}
            <span className="font-mono">
              {(IMPORT_SPECS[importType]?.requiredColumns || []).join(", ") || "—"}
            </span>
          </p>
          {IMPORT_SPECS[importType]?.samples?.length ? (
            <div className="mt-2">
              <p className="text-slate-600 mb-1">Ví dụ 1–2 dòng:</p>
              <pre className="whitespace-pre-wrap font-mono text-[11px]">{JSON.stringify(IMPORT_SPECS[importType].samples, null, 2)}</pre>
            </div>
          ) : null}
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          className="text-sm block w-full"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setPreview(null);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !importAllowed}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm disabled:opacity-50"
            onClick={parseAndPreview}
          >
            {loading ? "Đang xử lý…" : "Kiểm tra (preview)"}
          </button>
          <button
            type="button"
            disabled={loading || !importAllowed}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
            onClick={runImport}
          >
            {loading ? "Đang import…" : "Xác nhận import"}
          </button>
        </div>
        {preview?.errors?.length > 0 ? (
          <div className="border border-rose-100 bg-rose-50 rounded-lg p-3 max-h-48 overflow-y-auto text-xs">
            <p className="font-semibold text-rose-800 mb-1">Lỗi ({preview.errorCount})</p>
            <ul className="space-y-1 text-rose-900">
              {preview.errors.slice(0, 50).map((err, i) => (
                <li key={i}>
                  Dòng {err.row}: {err.field} — {err.message}
                </li>
              ))}
              {preview.errors.length > 50 ? <li>…</li> : null}
            </ul>
          </div>
        ) : null}
        {preview?.preview?.length > 0 ? (
          <div className="border border-slate-100 rounded-lg p-3 max-h-40 overflow-y-auto text-xs text-slate-700">
            <p className="font-semibold mb-1">Preview ({preview.preview.length} dòng)</p>
            <pre className="whitespace-pre-wrap font-mono text-[11px]">{JSON.stringify(preview.preview.slice(0, 20), null, 2)}</pre>
          </div>
        ) : null}
      </section>

      {canReport ? (
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Xuất báo cáo (Kế toán)</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="text-sm px-3 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => onDownloadReport("inventory")}>
              Tồn kho
            </button>
            <button type="button" className="text-sm px-3 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => onDownloadReport("revenue")}>
              Doanh thu
            </button>
            <button type="button" className="text-sm px-3 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => onDownloadReport("imports")}>
              Nhập hàng
            </button>
          </div>
        </section>
      ) : (
        <p className="text-xs text-slate-500">Xuất báo cáo tài chính chỉ dành cho Kế toán / Super Admin.</p>
      )}
    </div>
  );
}
