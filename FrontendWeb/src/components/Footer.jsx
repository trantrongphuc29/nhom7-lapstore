import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold tracking-tight">LAPSTORE</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Hệ thống bán lẻ máy tính công nghệ hàng đầu, mang đến trải nghiệm mua sắm hiện đại và chuyên nghiệp.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-primary" href="#">Hướng dẫn mua hàng</a></li>
              <li><a className="hover:text-primary" href="#">Chính sách bảo hành</a></li>
              <li><a className="hover:text-primary" href="#">Chính sách vận chuyển</a></li>
              <li><a className="hover:text-primary" href="#">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span>Hotline: 1910 633 570</span>
              </li>
              <li className="flex items-start gap-2">
                <span>Email: lapstore@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <span>Địa chỉ: 180 Cao Lỗ, Phường 4, Quận 8, TPHCM</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Nhận bản tin</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Đăng ký để nhận thông tin khuyến mãi mới nhất.</p>
            <div className="flex gap-2">
              <input className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-4" placeholder="Email của bạn" type="email" />
              <button className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ">Gửi</button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
          <p className="text-xs text-slate-400">© 2026 LAPSTORE. All rights reserved. Designed for excellence.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
