import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStaffHomePath, isStaffRole } from '../features/admin/utils/rbac';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const emailError = useMemo(() => {
    if (!form.email) return 'Email là bắt buộc';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không đúng định dạng';
    return '';
  }, [form.email]);

  const passwordError = useMemo(() => {
    if (!form.password) return 'Mật khẩu là bắt buộc';
    if (form.password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    return '';
  }, [form.password]);

  const canSubmit = !emailError && !passwordError && !isLoading;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setError('');
      const user = await login(form.email.trim().toLowerCase(), form.password);
      if (isStaffRole(user?.role)) {
        navigate(getStaffHomePath(), { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Đăng nhập</h1>
        <p className="text-sm text-slate-500 mb-6">Truy cập tài khoản của bạn để tiếp tục mua sắm.</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
              placeholder="you@example.com"
            />
            {form.email && emailError ? <p className="text-sm text-red-600 mt-1">{emailError}</p> : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
              placeholder="********"
            />
            {form.password && passwordError ? <p className="text-sm text-red-600 mt-1">{passwordError}</p> : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 transition disabled:opacity-60"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-slate-900 underline">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
