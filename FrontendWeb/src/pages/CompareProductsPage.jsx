import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { BACKEND_BASE_URL } from "../config/api";
import { getProductsForCompare } from "../features/compare/services/compare.service";
import { storefrontProductPath } from "../utils/productPaths";

const fmt = (price) => new Intl.NumberFormat("vi-VN").format(price || 0);
const COMPARE_STORAGE_KEY = "lapstore_compare_ids";
const colorMap = {
  'Đen': '#111827',
  'Bạc': '#cbd5e1',
  'Xám': '#6b7280',
  'Xám Không Gian': '#4b5563',
  'Đen Vũ Trụ': '#0f172a',
  'Xanh': '#2563eb',
  'Xanh Ngọc': '#0f766e',
  'Xanh Bầu Trời': '#38bdf8',
  'Vàng Ánh Sao': '#facc15',
  'Bạc Tự Nhiên': '#e5e7eb',
  'Đen Ngọc': '#1f2937',
};

function resolveImageUrl(product, variant) {
  const raw =
    product?.image ||
    product?.images?.[0]?.image_url ||
    product?.images?.[0]?.imageUrl ||
    variant?.image ||
    null;
  if (!raw) return null;
  if (String(raw).startsWith("http")) return raw;
  return `${BACKEND_BASE_URL}/${String(raw).replace(/^\/+/, "")}`;
}

function getSpecCellValue(product, row) {
  const variant = product.variants?.[0] || {};
  if (row.source === "variantOrSpecs") {
    return variant[row.key] || product.specs?.[row.key] || "-";
  }
  return product.specs?.[row.key] || "-";
}

function ProductCompareCardHeader({ product, onRemove }) {
  const variant = product.variants?.[0] || {};
  const imageUrl = resolveImageUrl(product, variant);
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <span className="material-symbols-outlined text-slate-300">laptop</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm sm:text-base mb-1 line-clamp-3">{product.name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-rose-600 font-bold text-sm">{fmt(variant.price)}</p>
            {Number(variant.discount) > 0 ? (
              <span className="text-red-50 bg-rose-600 text-[11px] font-bold px-2 py-0.5 rounded-full">-{variant.discount}%</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3 min-h-[20px] flex-wrap">
        {[...new Set((product.variants || []).map((v) => v.color).filter(Boolean))].slice(0, 5).map((color) => (
          <span
            key={color}
            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
            style={{ backgroundColor: colorMap[color] || "#d1d5db" }}
            title={color}
          />
        ))}
        {(product.variants || []).length > 1 ? (
          <span className="text-xs font-semibold text-slate-500">+{(product.variants || []).length - 1} phiên bản khác</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to={storefrontProductPath(product)}
          className="inline-flex justify-center rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition sm:flex-1"
        >
          Xem ngay
        </Link>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition sm:flex-1"
        >
          Xóa khỏi so sánh
        </button>
      </div>
    </div>
  );
}

function CompareProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("ids") || "";
    const parsedIds = raw
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0)
      .slice(0, 3);
    setCompareIds(parsedIds);
  }, [location.search]);

  useEffect(() => {
    if (compareIds.length < 2) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getProductsForCompare(compareIds)
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [compareIds]);

  const specRows = [
    { label: "CPU", key: "cpu", source: "specs" },
    { label: "GPU onboard", key: "gpu_onboard", source: "specs" },
    { label: "GPU rời", key: "gpu_discrete", source: "specs" },
    { label: "RAM", key: "ram", source: "variantOrSpecs" },
    { label: "RAM tối đa", key: "ram_max", source: "specs" },
    { label: "Lưu trữ", key: "storage", source: "variantOrSpecs" },
    { label: "Lưu trữ tối đa", key: "storage_max", source: "specs" },
    { label: "Kích thước màn hình", key: "screen_size", source: "specs" },
    { label: "Độ phân giải", key: "screen_resolution", source: "specs" },
    { label: "Công nghệ màn hình", key: "screen_technology", source: "specs" },
    { label: "Cổng kết nối", key: "ports", source: "specs" },
    { label: "Pin", key: "battery", source: "specs" },
    { label: "Kích thước", key: "dimensions", source: "specs" },
    { label: "Trọng lượng", key: "weight", source: "specs" },
    { label: "Chất liệu", key: "material", source: "specs" },
    { label: "Kết nối không dây", key: "wireless", source: "specs" },
    { label: "Webcam", key: "webcam", source: "specs" },
    { label: "Hệ điều hành", key: "os", source: "specs" },
  ];

  const removeFromCompare = (id) => {
    const nextIds = compareIds.filter((item) => item !== id);
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(nextIds));
    } catch (error) {
      console.error("Save compare state failed:", error);
    }
    if (nextIds.length === 0) {
      navigate("/", { replace: true });
      return;
    }
    navigate(`/compare?ids=${nextIds.join(",")}`, { replace: true });
  };

  const goBackToHome = () => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch (error) {
      console.error("Save compare state failed:", error);
    }
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Đang tải dữ liệu so sánh...</div>
        <Footer />
      </div>
    );
  }

  if (products.length < 2) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-14">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold mb-3">So sánh sản phẩm</h1>
            <p className="text-slate-500 mb-6">Cần ít nhất 2 sản phẩm để thực hiện so sánh.</p>
            <Link to="/" className="inline-flex rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition">
              Quay lại trang chủ
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-6">
          <h1 className="text-xl font-bold sm:text-2xl">So sánh sản phẩm</h1>
          <button
            type="button"
            onClick={goBackToHome}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition sm:w-auto sm:py-2"
          >
            Chọn lại sản phẩm
          </button>
        </div>

        {/* Mobile: mỗi sản phẩm một thẻ + bảng thông số dọc */}
        <div className="space-y-5 md:hidden">
          {products.map((product) => (
            <section key={product.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <ProductCompareCardHeader product={product} onRemove={removeFromCompare} />
              </div>
              <dl className="divide-y divide-slate-100">
                {specRows.map((row) => (
                  <div key={row.key} className="grid grid-cols-[minmax(0,42%)_1fr] gap-x-3 gap-y-1 px-3 py-2.5 sm:px-4">
                    <dt className="text-xs font-semibold text-slate-600 leading-snug">{row.label}</dt>
                    <dd className="text-xs text-slate-800 leading-snug whitespace-pre-wrap break-words">{getSpecCellValue(product, row)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
          <table className="w-full min-w-[1100px] table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[260px]" />
              {products.map((product) => (
                <col key={`col-${product.id}`} className="w-[300px]" />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200">
                <th
                  scope="col"
                  className="text-center px-5 py-4 text-sm font-semibold text-slate-600 sticky top-16 left-0 z-30 w-[260px] min-w-[260px] max-w-[260px] bg-white border-r border-slate-200 shadow-[6px_0_14px_-8px_rgba(15,23,42,0.18)] align-middle"
                >
                  Tiêu chí
                </th>
                {products.map((product) => {
                  const variant = product.variants?.[0] || {};
                  const imageUrl = resolveImageUrl(product, variant);
                  return (
                    <th
                      key={product.id}
                      scope="col"
                      className="px-5 py-4 text-left align-top sticky top-16 z-20 bg-white border-l border-slate-200 min-w-[280px]"
                    >
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 min-h-[220px] flex flex-col">
                        <div className="flex items-start gap-3 mb-3 min-h-[72px]">
                          <div className="w-16 h-16 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300">laptop</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 mb-1 line-clamp-2 min-h-[40px]">{product.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-rose-600 font-bold">{fmt(variant.price)}</p>
                              {Number(variant.discount) > 0 ? (
                                <span className="text-red-50 bg-rose-600 text-[11px] font-bold px-2 py-0.5 rounded-full">-{variant.discount}%</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mb-3 min-h-[20px]">
                          {[...new Set((product.variants || []).map((v) => v.color).filter(Boolean))].slice(0, 5).map((color) => (
                            <span
                              key={color}
                              className="w-4 h-4 rounded-full border border-slate-300"
                              style={{ backgroundColor: colorMap[color] || '#d1d5db' }}
                              title={color}
                            />
                          ))}
                          {(product.variants || []).length > 1 ? (
                            <span className="text-xs font-semibold text-slate-500">
                              +{(product.variants || []).length - 1} phiên bản khác
                            </span>
                          ) : null}
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <Link to={storefrontProductPath(product)} className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition">
                            Xem ngay
                          </Link>
                          <button
                            onClick={() => removeFromCompare(product.id)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {specRows.map((row, rowIndex) => {
                const labelBg = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
                return (
                  <tr key={row.key} className="border-b border-slate-100 last:border-b-0 odd:bg-white even:bg-slate-50/50">
                    <th
                      scope="row"
                      className={`text-left px-5 py-3.5 text-sm font-semibold text-slate-700 align-top sticky left-0 z-10 w-[260px] min-w-[260px] max-w-[260px] border-r border-slate-200 shadow-[6px_0_14px_-8px_rgba(15,23,42,0.12)] ${labelBg} leading-relaxed`}
                    >
                      <span className="block pr-1">{row.label}</span>
                    </th>
                    {products.map((product) => (
                      <td
                        key={`${product.id}-${row.key}`}
                        className="px-5 py-3.5 text-sm text-slate-800 align-top border-l border-slate-200 leading-relaxed whitespace-pre-wrap break-words min-h-[3rem]"
                      >
                        {getSpecCellValue(product, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CompareProductsPage;
