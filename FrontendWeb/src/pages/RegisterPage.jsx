import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emailError = useMemo(() => {
    if (!form.email) return 'Email là bắt buộc';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không đúng định dạng';
    return '';
  }, [form.email]);

  const passwordError = useMemo(() => {
    if (!form.password) return 'Mật khẩu là bắt buộc';
    if (form.password.length < 3) return 'Mật khẩu tối thiểu 3 ký tự';
    return '';
  }, [form.password]);

  const confirmPasswordError = useMemo(() => {
    if (!form.confirmPassword) return 'Xác nhận mật khẩu là bắt buộc';
    if (form.confirmPassword !== form.password) return 'Mật khẩu xác nhận không khớp';
    return '';
  }, [form.confirmPassword, form.password]);

  const canSubmit = !emailError && !passwordError && !confirmPasswordError && !isLoading;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      setError('');
      setSuccess('');
      await register(form.email.trim().toLowerCase(), form.password, form.confirmPassword);
      setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Đăng ký</h1>
        <p className="text-sm text-slate-500 mb-6">Tạo tài khoản mới để bắt đầu trải nghiệm.</p>

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
            />
            {form.password && passwordError ? <p className="text-sm text-red-600 mt-1">{passwordError}</p> : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
            {form.confirmPassword && confirmPasswordError ? <p className="text-sm text-red-600 mt-1">{confirmPasswordError}</p> : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 transition disabled:opacity-60"
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
