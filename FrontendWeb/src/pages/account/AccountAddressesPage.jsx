import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_ENDPOINTS } from '../../config/api';
import { VIETNAM_PROVINCES } from '../../data/vietnamProvinces';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/bodyScrollLock';

const emptyForm = {
  recipientName: '',
  phone: '',
  line1: '',
  line2: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false,
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/80 focus:border-[#CCFF00]';

const labelClass = 'block text-sm font-medium text-slate-800 mb-1.5';

export default function AccountAddressesPage() {
  const { token, user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePrefill, setProfilePrefill] = useState({ recipientName: '', phone: '' });

  const load = useCallback(async () => {
    if (!token) return;
    const res = await fetch(API_ENDPOINTS.ACCOUNT_ADDRESSES, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải địa chỉ');
    const rows = data?.data ?? data;
    setList(Array.isArray(rows) ? rows : []);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        await load();
      } catch (e) {
        if (!cancelled) toastError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, toastError, load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(API_ENDPOINTS.ACCOUNT_PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const p = data?.data || data;
        setProfilePrefill({
          recipientName: p?.fullName?.trim?.() || '',
          phone: p?.phone?.trim?.() || '',
        });
      } catch {
        if (cancelled) return;
        setProfilePrefill({
          recipientName: user?.fullName?.trim?.() || '',
          phone: user?.phone?.trim?.() || '',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  const onChange = (ev) => {
    const { name, value, type, checked } = ev.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      recipientName: profilePrefill.recipientName || user?.fullName || '',
      phone: profilePrefill.phone || user?.phone || '',
    });
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({
      recipientName: row.recipientName || '',
      phone: row.phone || '',
      line1: row.line1 || '',
      line2: row.line2 || '',
      ward: row.ward || '',
      district: row.district || '',
      province: row.province || '',
      isDefault: Boolean(row.isDefault),
    });
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }, []);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [modalOpen]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!form.province) {
      toastError('Vui lòng chọn khu vực');
      return;
    }
    try {
      const body = {
        ...form,
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2?.trim() || '',
        ward: form.ward?.trim() || '',
        district: form.district?.trim() || '',
        province: form.province,
      };
      if (editingId) {
        const res = await fetch(API_ENDPOINTS.ACCOUNT_ADDRESS(editingId), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại');
        toastSuccess('Đã cập nhật địa chỉ');
      } else {
        const res = await fetch(API_ENDPOINTS.ACCOUNT_ADDRESSES, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Thêm thất bại');
        toastSuccess('Đã thêm địa chỉ');
      }
      closeModal();
      await load();
    } catch (err) {
      toastError(err.message || 'Thao tác thất bại');
    }
  };

  const onDelete = async (id) => {
    if (!token || !window.confirm('Xóa địa chỉ này?')) return;
    try {
      const res = await fetch(API_ENDPOINTS.ACCOUNT_ADDRESS(id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xóa thất bại');
      toastSuccess('Đã xóa');
      await load();
    } catch (err) {
      toastError(err.message || 'Xóa thất bại');
    }
  };

  if (loading) {
    return <p className="text-slate-500 text-sm">Đang tải…</p>;
  }

  const count = list.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Sổ địa chỉ</h2>
        <p className="text-sm text-slate-500 mt-1">
          {count} địa chỉ được lưu
        </p>
      </div>

      {count > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{a.recipientName}</p>
                  <p className="text-sm text-slate-600">{a.phone}</p>
                </div>
                {a.isDefault ? (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-900 bg-[#CCFF00]/90 px-2 py-0.5 rounded border border-[#b8e600]">
                    Mặc định
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-700">
                {[a.line1, a.line2, a.ward, a.district, a.province].filter(Boolean).join(', ')}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openEditModal(a)}
                  className="text-sm font-semibold text-slate-800 hover:text-black underline-offset-2 hover:underline"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openAddModal}
        className="rounded-2xl border border-slate-200 bg-white py-4 px-4 text-center font-bold text-slate-900 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        + Thêm địa chỉ nhận
      </button>

      {modalOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/45 p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="address-modal-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeModal();
              }}
            >
              <div
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[min(90dvh,640px)] flex flex-col overflow-hidden border border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="relative flex items-center justify-center min-h-[3rem] px-4 pt-3 pb-3 border-b border-slate-100 shrink-0 sm:px-5">
              <h3 id="address-modal-title" className="text-center text-base font-bold text-slate-900 pr-10 pl-10">
                {editingId ? 'Sửa địa chỉ người nhận' : 'Thêm địa chỉ người nhận'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-lg text-slate-500 border border-transparent hover:bg-slate-100 hover:text-slate-900 transition-colors sm:right-4"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[22px] leading-none">close</span>
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="addr-name">Họ và tên</label>
                    <input
                      id="addr-name"
                      name="recipientName"
                      className={inputClass}
                      placeholder="Nhập họ và tên"
                      value={form.recipientName}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="addr-phone">Số điện thoại</label>
                    <input
                      id="addr-phone"
                      name="phone"
                      type="tel"
                      className={inputClass}
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="addr-province">Khu vực</label>
                  <div className="relative">
                    <select
                      id="addr-province"
                      name="province"
                      className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                      value={form.province}
                      onChange={onChange}
                      required
                    >
                      <option value="">Chọn khu vực...</option>
                      {VIETNAM_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <span className="material-symbols-outlined text-[20px] leading-none">expand_more</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="addr-line1">Địa chỉ nhận hàng</label>
                  <input
                    id="addr-line1"
                    name="line1"
                    className={inputClass}
                    placeholder="Nhập địa chỉ cụ thể"
                    value={form.line1}
                    onChange={onChange}
                    required
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-800">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={form.isDefault}
                    onChange={onChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#CCFF00] focus:ring-2 focus:ring-[#0b0b0b]/80"
                  />
                  Dùng làm địa chỉ giao hàng mặc định
                </label>
              </div>

              <div className="border-t border-slate-100 px-5 py-4 shrink-0 bg-white">
                <button
                  type="submit"
                  className="w-full rounded-full py-3.5 font-bold text-sm text-white bg-slate-900 border shadow- hover:brightness-95 transition-all"
                >
                  Lưu
                </button>
              </div>
            </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
