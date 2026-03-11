import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <span className="material-symbols-outlined block">devices</span>
          </div>
          <a href="#" className="text-xl font-bold tracking-tight">LAPSTORE</a>
        </div>
        <div className="flex-1 max-w-xl relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></span>
          <input className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="Tìm kiếm laptop" type="text" />
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">account_circle</span>
            <span>Đăng nhập</span>
          </button>
          <button className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary transition-all">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
          </button>
          <button className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
