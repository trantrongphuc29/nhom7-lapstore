import React, { useState } from 'react';

const FAQS = [
  {
    q: 'Giỏ hàng có được lưu khi đăng xuất không?',
    a: 'Giỏ hàng trên trình duyệt vẫn được lưu cục bộ. Với tài khoản đã đăng nhập, giỏ hàng đồng bộ trên máy chủ và sẽ khôi phục khi bạn đăng nhập lại.',
  },
  {
    q: 'Tôi có thể đổi mật khẩu ở đâu?',
    a: 'Vào "Thông tin tài khoản" và chọn "Đổi mật khẩu", sau đó nhập mật khẩu hiện tại và mật khẩu mới.',
  },
  {
    q: 'Làm sao cập nhật số điện thoại và họ tên?',
    a: 'Mở "Thông tin tài khoản", sửa họ tên hoặc số điện thoại — khi có thay đổi sẽ hiện nút Lưu và Hủy.',
  },
];

export default function AccountFaqPage() {
  const [open, setOpen] = useState(0);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Câu hỏi thường gặp</h2>
      <p className="text-sm text-slate-600 mb-6">Một số thắc mắc thường gặp khi mua hàng tại Lapstore.</p>
      <ul className="space-y-2">
        {FAQS.map((item, i) => (
          <li key={item.q} className="rounded-xl border border-slate-100 overflow-hidden bg-white">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
              onClick={() => setOpen((o) => (o === i ? -1 : i))}
            >
              {item.q}
              <span className="material-symbols-outlined text-slate-400 shrink-0">
                {open === i ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {open === i ? <p className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
