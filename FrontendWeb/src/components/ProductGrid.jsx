import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { API_ENDPOINTS } from "../config/api";

const ProductGrid = ({ filters, setFilters }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (filters.brands?.length) params.append("brand", filters.brands.join(","));
        if (filters.cpu) params.append("cpu", filters.cpu);
        if (filters.ram) params.append("ram", filters.ram);
        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        if (filters.keyword) params.append("keyword", filters.keyword);

        const url = params.toString()
          ? `${API_ENDPOINTS.PRODUCTS}?${params.toString()}`
          : API_ENDPOINTS.PRODUCTS;

        const res = await fetch(url);
        const data = await res.json();

        let result = data.records || [];

        switch (filters.sort) {
          case "price-asc":
            result.sort((a, b) => a.price - b.price);
            break;
          case "price-desc":
            result.sort((a, b) => b.price - a.price);
            break;
          case "newest":
            result.sort((a, b) => b.id - a.id);
            break;
          case "bestseller":
            result.sort((a, b) => b.reviews - a.reviews);
            break;
          default:
            break;
        }

        setProducts(result);
        setVisibleCount(12);
      } catch (err) {
        console.error("Fetch products error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const sortOptions = [
    { value: "newest", label: "Mới nhất" },
    { value: "bestseller", label: "Bán chạy" },
    { value: "price-asc", label: "Giá thấp - cao" },
    { value: "price-desc", label: "Giá cao - thấp" },
  ];

  if (loading) {
    return (
      <section className="flex-1 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500">Đang tải sản phẩm...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-background-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm">
          <span className="font-bold text-primary">{products.length}</span> sản phẩm được tìm thấy
        </p>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-slate-500 whitespace-nowrap">Sắp xếp:</span>

          {sortOptions.map((sort) => (
            <button
              key={sort.value}
              onClick={() => setFilters({ ...filters, sort: sort.value })}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
                filters.sort === sort.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length ? (
          products.slice(0, visibleCount).map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                price: new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(product.price),
                oldPrice:
                  product.original_price > 0
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.original_price)
                    : null,
                badge: product.discount ? `-${product.discount}%` : null,
                specs: [product.cpu, product.ram, product.storage].filter(Boolean),
              }}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {visibleCount < products.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span>Xem thêm</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;