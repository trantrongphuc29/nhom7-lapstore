import React, { useState } from 'react';
import Header from '../components/Header';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

function HomePage() {
  const [filters, setFilters] = useState({
    brands: [],
    cpu: '',
    ram: '',
    minPrice: null,
    maxPrice: null,
    keyword: '',
    sort: 'newest'
  });

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Banner />
        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar filters={filters} setFilters={setFilters} />
          <ProductGrid filters={filters} setFilters={setFilters} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
