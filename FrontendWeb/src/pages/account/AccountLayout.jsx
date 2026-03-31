import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function greetingIconSrc() {
  const h = new Date().getHours();
  if (h < 12) return `${BACKEND_BASE_URL}/images/weather/morning.png`;
  if (h < 18) return `${BACKEND_BASE_URL}/images/weather/afternoon.png`;
  return `${BACKEND_BASE_URL}/images/weather/moon.png`;
}

/** Sidebar: pill gọn, active = nền xanh mint đặc, chữ + icon đen đậm */
const navClass = ({ isActive }) =>
  [
    'flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-full text-sm transition-colors border border-transparent',
    isActive
      ? 'bg-[#CCFF00] text-black font-bold shadow-none [&_span.material-symbols-outlined]:text-black'
      : 'text-slate-700 font-semibold hover:bg-slate-50 [&_span.material-symbols-outlined:last-child]:opacity-70',
  ].join(' ');

export default function AccountLayout() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [profileName, setProfileName] = useState('');
  const displayName = useMemo(
    () => profileName?.trim() || user?.fullName?.trim() || user?.email?.split('@')[0] || 'Bạn',
    [profileName, user]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(API_ENDPOINTS.ACCOUNT_PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        const p = json?.data || json;
        setProfileName(p?.fullName || '');
      } catch {
        // Ignore; fallback name from auth context.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-display text-slate-900">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex items-start gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-white text-slate-700 flex items-center justify-center shrink-0" aria-hidden>
            <img src={greetingIconSrc()} alt="" className="max-h-8 max-w-8 w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="text-slate-600 text-base">{greetingText()},</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{displayName}</h1>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-72 shrink-0">
            <nav className="bg-white rounded-2xl shadow-xl p-2 space-y-1.5">
              <NavLink to="/tai-khoan/thong-tin" className={navClass}>
                <span className="material-symbols-outlined text-[20px] shrink-0">person</span>
                <span className="flex-1 text-left leading-tight">Thông tin tài khoản</span>
                <span className="material-symbols-outlined text-lg shrink-0">chevron_right</span>
              </NavLink>
              <NavLink to="/tai-khoan/don-hang" className={navClass}>
                <span className="material-symbols-outlined text-[20px] shrink-0">receipt_long</span>
                <span className="flex-1 text-left leading-tight">Lịch sử đơn hàng</span>
                <span className="material-symbols-outlined text-lg shrink-0">chevron_right</span>
              </NavLink>
              <NavLink to="/tai-khoan/so-dia-chi" className={navClass}>
                <span className="material-symbols-outlined text-[20px] shrink-0">location_on</span>
                <span className="flex-1 text-left leading-tight">Sổ địa chỉ</span>
                <span className="material-symbols-outlined text-lg shrink-0">chevron_right</span>
              </NavLink>
              <NavLink to="/tai-khoan/faq" className={navClass}>
                <span className="material-symbols-outlined text-[20px] shrink-0">help</span>
                <span className="flex-1 text-left leading-tight">Câu hỏi thường gặp</span>
                <span className="material-symbols-outlined text-lg shrink-0">chevron_right</span>
              </NavLink>
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-transparent"
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
                <span className="flex-1 text-left leading-tight">Đăng xuất</span>
                <span className="material-symbols-outlined text-lg shrink-0 opacity-70">chevron_right</span>
              </button>
            </nav>
          </aside>

          <section className="flex-1 min-w-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
            <Outlet />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
