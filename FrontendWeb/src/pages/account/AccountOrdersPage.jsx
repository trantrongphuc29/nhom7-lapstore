import React, { useEffect, useState } from 'react';
import { BACKEND_BASE_URL } from '../../config/api';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrderStatusLabel, isCustomerOrderDelivered } from '../../utils/customerOrderStatus';
import { fmtPrice } from '../../utils/format';

export default function AccountOrdersPage() {
  const imgSrc = (url) => (url ? (String(url).startsWith('http') ? url : `${BACKEND_BASE_URL}/${String(url).replace(/^\/+/, '')}`) : null);

  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(API_ENDPOINTS.ACCOUNT_ORDERS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        const list = data?.data ?? data;
        if (!cancelled) setRows(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <p className="text-slate-500 text-sm">Đang tải…</p>;
  }

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Lịch sử đơn hàng</h2>
      {rows.length === 0 ? (
        <p className="text-slate-600 text-sm">Bạn chưa có đơn hàng nào được liên kết với tài khoản.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => {
            const expanded = expandedIds.has(o.id);
            const items = Array.isArray(o.items) ? o.items : [];
            return (
              <article key={o.id} className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpanded(o.id)}
                  className="w-full px-4 py-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{o.orderCode}</p>
                      <span
                        className={
                          isCustomerOrderDelivered(o.status)
                            ? 'inline-flex px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-semibold'
                            : 'inline-flex px-2 py-0.5 rounded-lg bg-[#e8ff99] text-slate-900 text-xs font-semibold border border-[#CCFF00]/60'
                        }
                      >
                        {getCustomerOrderStatusLabel(o.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {items.length} sản phẩm • Giảm {fmtPrice(Number(o.discountAmount || 0))} ₫
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900 tabular-nums">{fmtPrice(o.totalAmount)} ₫</p>
                    <span className="material-symbols-outlined text-slate-500 mt-1">
                      {expanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {expanded ? (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-slate-500 mb-1">Thông tin vận chuyển</p>
                        <p className="font-medium text-slate-800 break-words">{o.shippingAddress || 'Không có thông tin'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-slate-500 mb-1">Thanh toán</p>
                        <p className="font-medium text-slate-800">{o.paymentMethod || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {items.map((it) => (
                        <div key={`${o.id}-${it.id}`} className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5">
                          <div className="w-14 h-14 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                            {imgSrc(it.image) ? (
                              <img src={imgSrc(it.image)} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-xl">laptop</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 break-words">{it.productName}</p>
                            <p className="text-xs text-slate-500 break-words">{it.variantName || 'Phiên bản mặc định'}</p>
                            <p className="text-xs text-slate-700 mt-1">
                              SL: {it.quantity} • Đơn giá: {fmtPrice(Number(it.unitPrice || 0))} ₫
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
