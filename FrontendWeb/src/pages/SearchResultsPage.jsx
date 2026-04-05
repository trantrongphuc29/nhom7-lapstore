import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import { SORT_OPTIONS } from "../features/productListing/constants";
import { getProductsByFilters } from "../features/productListing/services/productListing.service";
import { mapProductToCard } from "../features/productListing/utils/productMappers";

const BASE_FILTERS = {
  brands: [],
  cpu: "",
  ram: "",
  minPrice: null,
  maxPrice: null,
  priceRanges: [],
};

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = String(params.get("q") || "").trim();
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    setSort("newest");
    setVisibleCount(5);
  }, [q]);

  useEffect(() => {
    let active = true;
    if (!q) {
      setRecords([]);
      return undefined;
    }
    setLoading(true);
    getProductsByFilters({ ...BASE_FILTERS, keyword: q, sort })
      .then((rows) => {
        if (!active) return;
        setRecords(rows || []);
      })
      .catch(() => {
        if (active) setRecords([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [q, sort]);

  const title = useMemo(() => (q ? `Kết quả tìm kiếm cho: "${q}"` : "Nhập từ khóa để tìm kiếm"), [q]);
  const visibleRecords = useMemo(() => records.slice(0, visibleCount), [records, visibleCount]);

  return (
    <div className="bg-white font-display text-slate-900 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{records.length} sản phẩm</p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {!q ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Hãy nhập từ khóa ở thanh tìm kiếm để xem kết quả.
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {visibleRecords.map((p) => (
              <div key={p.id} className="h-full">
                <ProductCard product={mapProductToCard(p)} />
              </div>
            ))}
          </div>
        )}
        {!loading && records.length > visibleCount ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((v) => v + 5)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xem thêm
            </button>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
