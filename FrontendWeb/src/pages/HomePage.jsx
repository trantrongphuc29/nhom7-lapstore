import React from 'react';
import Header from '../components/layout/Header';
import Banner from '../components/layout/Banner';
import Footer from '../components/layout/Footer';
import {
  DEFAULT_PRODUCT_FILTERS,
  FilterSidebar,
  ProductGridPanel,
  useProductListing,
} from '../features/productListing';

function HomePage() {
  const {
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
    productCount,
    brandOptions,
  } = useProductListing(DEFAULT_PRODUCT_FILTERS);

  return (
    <div className="bg-white font-display text-slate-900 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Banner />
        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            productCount={productCount}
            productsLoading={loading}
            brandOptions={brandOptions}
          />
          <ProductGridPanel
            filters={filters}
            setFilters={setFilters}
            products={products}
            loading={loading}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            compareMode={compareMode}
            setCompareMode={setCompareMode}
            compareIds={compareIds}
            toggleCompareProduct={toggleCompareProduct}
            clearCompare={clearCompare}
            toast={toast}
            setToast={setToast}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
