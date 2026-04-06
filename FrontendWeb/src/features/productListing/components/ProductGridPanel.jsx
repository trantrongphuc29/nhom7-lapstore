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
  onOpenMobileFilters,
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
    <section
      className={`flex-1 ${showCompareBar ? "pb-52 sm:pb-44 md:pb-40" : ""}`}
    >
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 font-bold sm:flex-row sm:items-center sm:gap-2 sm:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 whitespace-nowrap text-sm text-slate-500">Sắp xếp:</span>
          {SORT_OPTIONS.map((sort) => (
            <button
              key={sort.value}
              type="button"
              onClick={() => setFilters({ ...filters, sort: sort.value })}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs whitespace-nowrap transition ${
                filters.sort === sort.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {sort.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCompareMode((prev) => !prev)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
              compareMode
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>So sánh</span>
            <span className={`relative h-5 w-9 rounded-full transition ${compareMode ? "bg-[#CCFF00]" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${compareMode ? "left-4" : "left-0.5"}`} />
            </span>
          </button>
        </div>
        {typeof onOpenMobileFilters === "function" ? (
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm lg:hidden"
            aria-label="Mở bộ lọc"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">tune</span>
            <span>Lọc</span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
                  type="button"
                  onClick={() => toggleCompareProduct(p.id)}
                  disabled={!compareIds.includes(p.id) && compareIds.length >= 3}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[11px] font-semibold leading-tight transition sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm ${
                    compareIds.includes(p.id)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {compareIds.includes(p.id) ? "Đã chọn" : "Chọn so sánh"}
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

      <div
        className={`fixed left-0 right-0 bottom-0 z-40 transition-transform duration-300 pb-[env(safe-area-inset-bottom,0px)] ${showCompareBar ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-slate-700 sm:text-sm">Đã chọn so sánh ({compareIds.length}/3)</p>
              <button
                type="button"
                onClick={clearCompare}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition sm:text-sm"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 max-h-[40vh] overflow-y-auto overscroll-contain md:max-h-none md:overflow-visible">
              {selectedCompareProducts.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl border border-slate-200 px-2.5 py-2 bg-slate-50 flex items-center justify-between gap-2 sm:px-3"
                >
                  <span className="min-w-0 text-xs text-slate-700 line-clamp-2 sm:text-sm sm:line-clamp-1">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompareProduct(item.id)}
                    className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Xóa khỏi so sánh"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-stretch sm:justify-end">
              <button
                type="button"
                onClick={handleGoCompare}
                disabled={compareIds.length < 2}
                className="w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:py-2.5"
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
