import React from 'react';

const Sidebar = ({ filters, setFilters }) => {
  const handleBrandChange = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    setFilters({ ...filters, brands: newBrands });
  };

  const handleCpuChange = (cpu) => {
    setFilters({ ...filters, cpu: filters.cpu === cpu ? '' : cpu });
  };

  const handleRamChange = (ram) => {
    setFilters({ ...filters, ram: filters.ram === ram ? '' : ram });
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-20 bg-white dark:bg-background-dark p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">tune</span>
          Bộ lọc tìm kiếm
        </h3>
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Thương hiệu</p>
          <div className="space-y-2">
            {['Dell', 'Apple', 'HP', 'Asus', 'Lenovo', 'Acer', 'MSI'].map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  checked={filters.brands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 border-slate-300" 
                  type="checkbox" 
                />
                <span className="text-sm group-hover:text-primary transition-colors">{brand}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">CPU</p>
          <div className="flex flex-wrap gap-2">
            {['Core i5', 'Core i7', 'Ryzen 5', 'Apple M2'].map(cpu => (
              <button 
                key={cpu} 
                onClick={() => handleCpuChange(cpu)}
                className={`px-3 py-1.5 text-xs ${filters.cpu === cpu ? 'bg-primary/10 text-primary border-primary' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-300'} border rounded-lg font-medium`}
              >
                {cpu}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">RAM</p>
          <div className="flex flex-wrap gap-2">
            {['8GB', '16GB', '32GB'].map((ram) => (
              <button 
                key={ram} 
                onClick={() => handleRamChange(ram)}
                className={`px-3 py-1.5 text-xs ${filters.ram === ram ? 'bg-primary/10 text-primary border-primary' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-300'} border rounded-lg font-medium`}
              >
                {ram}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
