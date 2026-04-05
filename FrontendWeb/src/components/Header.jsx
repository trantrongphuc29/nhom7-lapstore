import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MiniCartDropdown from './cart/MiniCartDropdown';
import HeaderSearchBar from './HeaderSearchBar';
import { getStaffHomePath, isRetailCustomerRole, isStaffRole } from '../features/admin/utils/rbac';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const cartAnchorRef = useRef(null);

  const mobileAccountPath = !isAuthenticated
    ? "/login"
    : isStaffRole(user?.role)
      ? getStaffHomePath()
      : isRetailCustomerRole(user?.role)
        ? "/tai-khoan/thong-tin"
        : "/login";
  const mobileAccountLabel = !isAuthenticated
    ? "Đăng nhập"
    : isStaffRole(user?.role)
      ? "Trang quản trị"
      : "Tài khoản";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 ">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
        <div className="flex items-center gap-2 shrink-0">
        <div className="bg-[#CCFF00] p-1.5 rounded-lg text-black">
            <span className="material-symbols-outlined block">devices</span>
          </div>
          <Link to="/" className="text-xl font-bold tracking-tight">LAPSTORE</Link>
        </div>
        <HeaderSearchBar />
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <Link to="/login" className="hidden md:flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">account_circle</span>
              <span>Đăng nhập</span>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              {isRetailCustomerRole(user?.role) ? (
                <Link
                  to="/tai-khoan/thong-tin"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Tài khoản
                </Link>
              ) : null}
              {isStaffRole(user?.role) ? (
                <Link
                  to={getStaffHomePath()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition"
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/', { replace: true });
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
          <div className="relative" ref={cartAnchorRef}>
            <button
              type="button"
              onClick={() => setCartOpen((o) => !o)}
              className="relative p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
              aria-expanded={cartOpen}
              aria-haspopup="dialog"
              aria-label="Giỏ hàng"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              {itemCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-[#CCFF00] text-black text-[10px] font-bold min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full tabular-nums">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </button>
            <MiniCartDropdown open={cartOpen} onClose={() => setCartOpen(false)} anchorRef={cartAnchorRef} />
          </div>
          <Link
            to={mobileAccountPath}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            aria-label={mobileAccountLabel}
          >
            <span className="material-symbols-outlined block text-[26px] leading-none" aria-hidden>
              account_circle
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
