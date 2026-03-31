import React, { useEffect, useRef, useState } from "react";
import OdometerNumber from "../../../components/common/OdometerNumber";
import { CPU_OPTIONS, PRICE_RANGE_OPTIONS, RAM_OPTIONS } from "../constants";

const FilterSidebar = ({ filters, setFilters, productCount = 0, productsLoading = false, brandOptions = [] }) => {
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
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-20">
        <p
          className="mb-3 flex items-center justify-start gap-1.5 min-h-[1.5rem] text-sm font-semibold text-slate-700 dark:text-slate-200 pl-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {productsLoading ? (
            <span className="text-slate-400">...</span>
          ) : (
            <OdometerNumber
              value={animatedCount}
              className="text-base font-semibold text-slate-700 dark:text-slate-200"
            />
          )}
          <span className="text-base font-semibold text-slate-700 dark:text-slate-200">sản phẩm</span>
        </p>

        <div className="bg-white dark:bg-background-dark p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3">Thương hiệu</p>
            <div className="space-y-2">
              {brandOptions.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                    className="h-4 w-4 dark:checked:bg-[#00ccff] dark:checked:border-transparent disabled:opacity-50 disabled:cursor-not-allowed form-checkbox rounded bg-white dark:bg-gray-900 border border-gray-300 focus-visible:ring-2 focus-visible:ring-[#00ccff] focus-visible:ring-offset-2 text-[#00ccff]"
                    type="checkbox"
                  />
                  <span className="text-sm group-hover:text-[#00ccff] transition-colors">{brand}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-slate-200 dark:border-slate-800 pt-2">
            <p className="text-sm font-semibold mb-3">CPU</p>
            <div className="flex flex-wrap gap-2">
              {CPU_OPTIONS.map((cpu) => (
                <button
                  key={cpu}
                  onClick={() => handleCpuChange(cpu)}
                  className={`px-3 py-1.5 text-xs ${filters.cpu === cpu ? "bg-primary/10 text-primary border-primary" : "bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-300"} border rounded-lg font-medium`}
                >
                  {cpu}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-slate-200 dark:border-slate-800 pt-2">
            <p className="text-sm font-semibold mb-3">RAM</p>
            <div className="flex flex-wrap gap-2">
              {RAM_OPTIONS.map((ram) => (
                <button
                  key={ram}
                  onClick={() => handleRamChange(ram)}
                  className={`px-3 py-1.5 text-xs ${filters.ram === ram ? "bg-primary/10 text-primary border-primary" : "bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-300"} border rounded-lg font-medium`}
                >
                  {ram}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-slate-200 dark:border-slate-800 pt-2">
            <p className="text-sm font-semibold mb-3">Khoảng giá</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {PRICE_RANGE_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer group min-w-0">
                  <input
                    type="checkbox"
                    checked={priceRanges.includes(opt.id)}
                    onChange={() => togglePriceRange(opt.id)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-[#00ccff] focus:ring-[#00ccff]"
                  />
                  <span className="text-xs leading-snug text-slate-700 dark:text-slate-200 group-hover:text-[#00ccff] transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
