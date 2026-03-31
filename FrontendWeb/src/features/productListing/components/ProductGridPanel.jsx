import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../../components/ProductCard";
import ProductCardSkeleton from "../../../components/ProductCardSkeleton";
import { SORT_OPTIONS } from "../constants";
import { mapProductToCard } from "../utils/productMappers";

const ProductGridPanel = ({
  filters,
  setFilters,
  products,
  loading,
  visibleCount,
  setVisibleCount,
  compareMode,
  setCompareMode,
  compareIds,
  toggleCompareProduct,
  clearCompare,
  toast,
  setToast,
}) => {
  const navigate = useNavigate();
  const selectedCompareProducts = compareIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const showCompareBar = compareMode && selectedCompareProducts.length > 0;
  const skeletonSlots = 12;

  const handleGoCompare = () => {
    if (compareIds.length < 2) return;
    navigate(`/compare?ids=${compareIds.join(",")}`);
  };

  return (
    <section className={`flex-1 ${showCompareBar ? "pb-36" : ""}`}>
      <div className="font-bold flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 bg-white border border-slate-200 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto flex-wrap min-w-0 flex-1">
          <span className="text-sm text-slate-500 whitespace-nowrap">Sắp xếp:</span>
          {SORT_OPTIONS.map((sort) => (
            <button
              key={sort.value}
              onClick={() => setFilters({ ...filters, sort: sort.value })}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap border transition ${filters.sort === sort.value ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"}`}
            >
              {sort.label}
            </button>
          ))}
          <button
            onClick={() => setCompareMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition ${compareMode ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"}`}
          >
            <span>So sánh</span>
            <span className={`relative w-9 h-5 rounded-full transition ${compareMode ? "bg-[#CCFF00]" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${compareMode ? "left-4" : "left-0.5"}`} />
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: skeletonSlots }).map((_, i) => (
            <div key={`sk-${i}`} className="space-y-2 h-full">
              <ProductCardSkeleton />
            </div>
          ))
        ) : products.length ? (
          products.slice(0, visibleCount).map((p) => (
            <div key={p.id} className="space-y-2 h-full">
              <ProductCard product={mapProductToCard(p)} />
              {compareMode ? (
                <button
                  onClick={() => toggleCompareProduct(p.id)}
                  disabled={!compareIds.includes(p.id) && compareIds.length >= 3}
                  className={`w-full rounded-xl px-3 py-2 text-sm font-semibold border transition ${compareIds.includes(p.id) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {compareIds.includes(p.id) ? "Đã chọn so sánh" : "Chọn để so sánh"}
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <p className="text-slate-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {!loading && visibleCount < products.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-100 transition"
          >
            <span>Xem thêm</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      )}

      <div className={`fixed left-0 right-0 bottom-0 z-40 transition-transform duration-300 ${showCompareBar ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-slate-700">Sản phẩm đã chọn so sánh</p>
              <button onClick={clearCompare} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
                Xóa tất cả
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {selectedCompareProducts.map((item) => (
                <div key={item.id} className="group rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700 line-clamp-1">{item.name}</span>
                  <button
                    onClick={() => toggleCompareProduct(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-rose-600"
                    aria-label="Xóa khỏi so sánh"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleGoCompare}
                disabled={compareIds.length < 2}
                className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                So sánh ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-rose-600 text-white rounded-xl shadow-lg px-3 py-2.5 flex items-start gap-2 max-w-xs">
            <p className="text-xs leading-5">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white transition leading-none mt-0.5" aria-label="Đóng thông báo">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default ProductGridPanel;
