import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProductsByFilters } from "../features/productListing/services/productListing.service";
import { BACKEND_BASE_URL } from "../config/api";
import { storefrontProductPath } from "../utils/productPaths";

/**
 * Thanh tìm kiếm pill: nền xám nhạt, nút tròn xanh mint + icon tìm kiếm.
 */
export default function HeaderSearchBar() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestProducts, setSuggestProducts] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 220);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    if (!debouncedKeyword) {
      setSuggestProducts([]);
      return undefined;
    }
    setLoading(true);
    getProductsByFilters({
      brands: [],
      cpu: "",
      ram: "",
      minPrice: null,
      maxPrice: null,
      priceRanges: [],
      keyword: debouncedKeyword,
      sort: "newest",
    })
      .then((records) => {
        if (!active) return;
        setSuggestProducts((records || []).slice(0, 5));
      })
      .catch(() => {
        if (active) setSuggestProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedKeyword]);

  const suggestKeywords = useMemo(() => {
    if (!debouncedKeyword) return [];
    const q = debouncedKeyword.toLowerCase();
    const options = new Set();
    suggestProducts.forEach((p) => {
      const brand = String(p.brand || "").trim();
      if (brand && brand.toLowerCase().includes(q)) options.add(brand);
      const name = String(p.name || "").trim();
      if (name) {
        const words = name.split(/\s+/).filter(Boolean);
        words.forEach((w) => {
          if (w.length >= 2 && w.toLowerCase().includes(q)) options.add(w);
        });
        if (name.toLowerCase().includes(q)) options.add(name);
      }
    });
    return Array.from(options).slice(0, 5);
  }, [debouncedKeyword, suggestProducts]);

  const resolveImage = (p) => {
    const raw =
      p.image ||
      p.image_url ||
      p.fallback_image ||
      p.thumbnail ||
      null;
    if (!raw) return "";
    return String(raw).startsWith("http") ? raw : `${BACKEND_BASE_URL}/${String(raw).replace(/^\//, "")}`;
  };

  const formatPrice = (p) => {
    const sale = Number(p.min_price || p.retail_price || p.price || 0);
    const discount = Number(p.min_discount || p.discount || 0);
    const original = discount > 0 ? Math.round((sale * 100) / Math.max(1, 100 - discount)) : 0;
    return {
      saleText: sale > 0 ? sale.toLocaleString("vi-VN") : "Liên hệ",
      originalText: original > sale ? original.toLocaleString("vi-VN") : "",
      discount,
    };
  };

  const goSearch = (value) => {
    const q = String(value || "").trim();
    if (!q) return;
    setOpen(false);
    navigate(`/tim-kiem?q=${encodeURIComponent(q)}`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    goSearch(keyword);
  };

  return (
    <div className="flex-1 max-w-xl hidden md:block relative" ref={rootRef}>
      <form
        className="flex items-center rounded-full border border-slate-200 bg-[#f8fafc] shadow-sm shadow-slate-200/80 p-1 pr-3 gap-0 min-h-[40px]"
        onSubmit={onSubmit}
      >
        <button
          type="submit"
          className="shrink-0 w-9 h-9 ml-0.5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#CCFF00" }}
          aria-label="Tìm kiếm"
        >
          <span className="material-symbols-outlined text-black text-[22px] leading-none">search</span>
        </button>
        <input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (keyword.trim()) setOpen(true);
          }}
          type="search"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-slate-800 placeholder:text-slate-400 py-2 pl-2 pr-1 focus:ring-0"
          placeholder="Xin chào, bạn đang tìm gì?"
          autoComplete="off"
          aria-label="Tìm kiếm sản phẩm"
        />
      </form>

      {open && keyword.trim() ? (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-[0_16px_36px_rgba(15,23,42,0.12)] p-4 z-50">
          {suggestKeywords.length > 0 ? (
            <>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Có thể bạn muốn tìm kiếm</h4>
              <div className="space-y-1.5 mb-4">
                {suggestKeywords.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => goSearch(k)}
                    className="block text-left text-[#2f3b8f] hover:underline text-[15px]"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <h4 className="text-sm font-semibold text-slate-900 mb-2">Sản phẩm</h4>
          {loading ? (
            <p className="text-sm text-slate-500">Đang tìm...</p>
          ) : suggestProducts.length === 0 ? (
            <p className="text-sm text-slate-500">Không có gợi ý phù hợp</p>
          ) : (
            <div className="space-y-2">
              {suggestProducts.map((p) => {
                const pricing = formatPrice(p);
                return (
                  <Link
                    key={p.id}
                    to={storefrontProductPath(p)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-2.5 hover:bg-slate-50"
                  >
                    <div className="w-14 h-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                      {resolveImage(p) ? (
                        <img src={resolveImage(p)} alt={p.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300">laptop</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900 line-clamp-1">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-rose-600 font-bold">{pricing.saleText}</span>
                        {pricing.originalText ? (
                          <span className="text-slate-500 line-through">{pricing.originalText}</span>
                        ) : null}
                        {pricing.discount > 0 ? (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                            -{pricing.discount}%
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
