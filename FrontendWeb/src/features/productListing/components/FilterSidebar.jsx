import React, { useEffect, useRef, useState } from "react";
import OdometerNumber from "../../../components/common/OdometerNumber";
import { CPU_OPTIONS, PRICE_RANGE_OPTIONS, RAM_OPTIONS } from "../constants";

export function FilterPanelContent({ filters, setFilters, productCount = 0, productsLoading = false, brandOptions = [] }) {
  const [animatedCount, setAnimatedCount] = useState(productCount);
  const animatedCountRef = useRef(productCount);

  useEffect(() => {
    animatedCountRef.current = animatedCount;
  }, [animatedCount]);

  useEffect(() => {
    const from = animatedCountRef.current;
    const to = Math.max(0, Number(productCount) || 0);
    if (from === to) return undefined;

    const duration = 450;
    const start = performance.now();
    let rafId = null;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setAnimatedCount(next);
      animatedCountRef.current = next;
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setAnimatedCount(to);
        animatedCountRef.current = to;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [productCount]);

  const handleBrandChange = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    setFilters({ ...filters, brands: newBrands });
  };

  const handleCpuChange = (cpu) => {
    setFilters({ ...filters, cpu: filters.cpu === cpu ? "" : cpu });
  };

  const handleRamChange = (ram) => {
    setFilters({ ...filters, ram: filters.ram === ram ? "" : ram });
  };

  const priceRanges = filters.priceRanges || [];
  const togglePriceRange = (id) => {
    const next = priceRanges.includes(id) ? priceRanges.filter((x) => x !== id) : [...priceRanges, id];
    setFilters({ ...filters, priceRanges: next });
  };

  return (
    <>
      <p
        className="mb-3 flex min-h-[1.5rem] items-center justify-start gap-1.5 pl-0 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:pl-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {productsLoading ? (
          <span className="text-slate-400">...</span>
        ) : (
          <OdometerNumber value={animatedCount} className="text-base font-semibold text-slate-700 dark:text-slate-200" />
        )}
        <span className="text-base font-semibold text-slate-700 dark:text-slate-200">sản phẩm</span>
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-background-dark sm:p-5">
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold">Thương hiệu</p>
          <div className="space-y-2">
            {brandOptions.map((brand) => (
              <label key={brand} className="group flex cursor-pointer items-center gap-2">
                <input
                  checked={filters.brands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                  className="form-checkbox h-4 w-4 rounded border border-gray-300 bg-white text-[#00ccff] focus-visible:ring-2 focus-visible:ring-[#00ccff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-transparent dark:bg-gray-900 dark:checked:bg-[#00ccff]"
                  type="checkbox"
                />
                <span className="text-sm transition-colors group-hover:text-[#00ccff]">{brand}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-6 border-t border-slate-200 pt-2 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">CPU</p>
          <div className="flex flex-wrap gap-2">
            {CPU_OPTIONS.map((cpu) => (
              <button
                key={cpu}
                type="button"
                onClick={() => handleCpuChange(cpu)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  filters.cpu === cpu
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-slate-100 hover:border-slate-300 dark:bg-slate-800"
                }`}
              >
                {cpu}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6 border-t border-slate-200 pt-2 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">RAM</p>
          <div className="flex flex-wrap gap-2">
            {RAM_OPTIONS.map((ram) => (
              <button
                key={ram}
                type="button"
                onClick={() => handleRamChange(ram)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  filters.ram === ram
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-slate-100 hover:border-slate-300 dark:bg-slate-800"
                }`}
              >
                {ram}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-2 border-t border-slate-200 pt-2 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">Khoảng giá</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {PRICE_RANGE_OPTIONS.map((opt) => (
              <label key={opt.id} className="group flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={priceRanges.includes(opt.id)}
                  onChange={() => togglePriceRange(opt.id)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-[#00ccff] focus:ring-[#00ccff]"
                />
                <span className="text-xs leading-snug text-slate-700 transition-colors group-hover:text-[#00ccff] dark:text-slate-200">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function FilterSidebar(props) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="lg:sticky lg:top-20">
        <FilterPanelContent {...props} />
      </div>
    </aside>
  );
}
