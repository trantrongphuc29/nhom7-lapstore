import React, { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getJson, patchJson, postJson } from '../../services/apiClient';

function authOpts(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function isAuthFailureMessage(msg) {
  const m = String(msg || '').toLowerCase();
  return m.includes('invalid or expired token') || m.includes('authentication required') || m.includes('unauthorized');
}

function FieldIcon({ children }) {
  return (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[22px] pointer-events-none">
      {children}
    </span>
  );
}

export default function AccountProfilePage() {
  const { token, refreshUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [baseline, setBaseline] = useState({ fullName: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  const dirty = useMemo(() => {
    const fn = fullName.trim();
    const ph = phone.trim();
    return fn !== baseline.fullName.trim() || ph !== baseline.phone.trim();
  }, [fullName, phone, baseline]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getJson(API_ENDPOINTS.ACCOUNT_PROFILE, authOpts(token));
        const p = data?.data || data;
        if (!cancelled) {
          const fn = p.fullName || '';
          const ph = p.phone || '';
          setFullName(fn);
          setPhone(ph);
          setEmail(p.email || '');
          setBaseline({ fullName: fn, phone: ph });
        }
      } catch (e) {
        if (!cancelled && !isAuthFailureMessage(e?.message)) {
          toastError(e.message || 'Lỗi tải hồ sơ');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, toastError]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!token || !dirty) return;
    setSaving(true);
    try {
      await patchJson(
        API_ENDPOINTS.ACCOUNT_PROFILE,
        { fullName: fullName.trim(), phone: phone.trim() },
        authOpts(token)
      );
      await refreshUser();
      const nextFn = fullName.trim();
      const nextPh = phone.trim();
      setBaseline({ fullName: nextFn, phone: nextPh });
      toastSuccess('Đã lưu thông tin');
    } catch (err) {
      if (!isAuthFailureMessage(err?.message)) {
        toastError(err.message || 'Cập nhật thất bại');
      }
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setFullName(baseline.fullName);
    setPhone(baseline.phone);
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (pwd.next !== pwd.confirm) {
      toastError('Mật khẩu mới không khớp');
      return;
    }
    try {
      await postJson(
        API_ENDPOINTS.ACCOUNT_PASSWORD,
        {
          currentPassword: pwd.current,
          newPassword: pwd.next,
          confirmPassword: pwd.confirm,
        },
        authOpts(token)
      );
      toastSuccess('Đã đổi mật khẩu');
      setPwdOpen(false);
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      if (!isAuthFailureMessage(err?.message)) {
        toastError(err.message || 'Đổi mật khẩu thất bại');
      }
    }
  };

  const inputRing = 'focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/80 focus:border-[#CCFF00]';

  if (loading) {
    return <p className="text-slate-500 text-sm">Đang tải…</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin tài khoản</h2>
      <form onSubmit={onSave} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
          <div className="relative">
            <FieldIcon>person</FieldIcon>
            <input
              className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 ${inputRing}`}
              value={fullName}
              onChange={(ev) => setFullName(ev.target.value)}
              placeholder="Nhập họ tên"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
          <div className="relative">
            <FieldIcon>call</FieldIcon>
            <input
              className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 ${inputRing}`}
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="Số điện thoại"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <FieldIcon>mail</FieldIcon>
            <input
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-600"
              value={email}
              readOnly
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {dirty ? (
            <>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-black text-white font-semibold text-sm shadow-md disabled:opacity-60"
              >
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Hủy
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setPwdOpen(true)}
            className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50"
          >
            Đổi mật khẩu
          </button>
        </div>
      </form>

      {pwdOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Đổi mật khẩu</h3>
            <form onSubmit={onChangePassword} className="space-y-4">
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/80"
                placeholder="Mật khẩu hiện tại"
                value={pwd.current}
                onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                required
              />
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/80"
                placeholder="Mật khẩu mới"
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                required
                minLength={3}
              />
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/80"
                placeholder="Nhập lại mật khẩu mới"
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700"
                  onClick={() => setPwdOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-semibold border border-[#b8e600]"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
