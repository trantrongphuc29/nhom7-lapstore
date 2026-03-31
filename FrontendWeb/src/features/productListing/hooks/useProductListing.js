import { useEffect, useState } from "react";
import { DEFAULT_PRODUCT_FILTERS } from "../constants";
import { getProductsByFilters } from "../services/productListing.service";

const COMPARE_STORAGE_KEY = "lapstore_compare_ids";

export function useProductListing(initialFilters = DEFAULT_PRODUCT_FILTERS) {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const normalized = parsed.map(Number).filter(Number.isFinite).slice(0, 3);
      setCompareIds(normalized);
      if (normalized.length > 0) setCompareMode(true);
    } catch (error) {
      console.error("Load compare state failed:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getProductsByFilters(DEFAULT_PRODUCT_FILTERS)
      .then((records) => {
        if (!isMounted) return;
        const unique = [...new Set((records || []).map((item) => String(item?.brand || "").trim()).filter(Boolean))];
        setBrandOptions(unique);
      })
      .catch(() => {
        if (isMounted) setBrandOptions([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const result = await getProductsByFilters(filters);
        if (!isMounted) return;
        setProducts(result);
        const dynamicBrands = [...new Set((result || []).map((item) => String(item?.brand || "").trim()).filter(Boolean))];
        if (dynamicBrands.length > 0) {
          setBrandOptions((prev) => [...new Set([...(prev || []), ...dynamicBrands])]);
        }
        setVisibleCount(12);
      } catch (error) {
        console.error("Fetch products error:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  /** Khi quay lại tab (sau khi admin đổi trạng thái), làm mới danh sách không bật skeleton */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      getProductsByFilters(filters)
        .then((result) => setProducts(result))
        .catch((err) => console.error("Fetch products error:", err));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [filters]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch (error) {
      console.error("Save compare state failed:", error);
    }
  }, [compareIds]);

  const toggleCompareProduct = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) {
        setToast({ id: Date.now(), message: "So sánh tối đa 3 sản phẩm" });
        return prev;
      }
      return [...prev, id];
    });
  };

  return {
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
    clearCompare: () => setCompareIds([]),
    toast,
    setToast,
    productCount: products.length,
    brandOptions,
  };
}
