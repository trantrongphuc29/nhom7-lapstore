import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../config/api';
import { useCart, cartAllInStock } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { buildVariantSummary } from '../utils/productSpec';
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock';
import LoginModal from '../components/cart/LoginModal';

function formatPrice(price) {
  return Number(price).toLocaleString('vi-VN');
}

function buildDisplayTitle(productName, v, specs) {
  const summary = buildVariantSummary(v, specs);
  if (!summary) return productName;
  return `${productName} - ${summary}`;
}

/** Trạng thái từ product_admin_meta (API) */
const STOREFRONT_STATUS = {
  inactive: { label: 'Ngưng bán', hint: 'Sản phẩm đã ngừng kinh doanh.' },
  out_of_stock: { label: 'Hết hàng', hint: 'Tạm thời không còn hàng.' },
  coming_soon: { label: 'Sắp ra mắt', hint: 'Sản phẩm sắp được mở bán.' },
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const skuParam = searchParams.get('sku');
  const { addFromProduct } = useCart();
  const { success: toastSuccess, error: toastError } = useToast();
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const images = product?.images?.map(img => `${BACKEND_BASE_URL}/${img.image_url}`) || [];
  const [selectedImage, setSelectedImage] = useState(0);

  // Khóa cuộn trang khi modal mở + bù scrollbar để không lệch layout
  useEffect(() => {
    if (!showSpecsModal) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [showSpecsModal]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(API_ENDPOINTS.PRODUCT_DETAIL(id), { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) {
            setProduct(null);
            setLoading(false);
          }
          return;
        }
        const data = await r.json();
        if (cancelled) return;
        const payload = data?.data || data;
        setProduct(payload);
        setSelectedVariant(0);
        setLoading(false);
        setSelectedImage(0);
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !id) return;
      fetch(API_ENDPOINTS.PRODUCT_DETAIL(id), { cache: 'no-store' })
        .then(async (r) => {
          if (!r.ok) {
            setProduct(null);
            return;
          }
          const data = await r.json();
          const payload = data?.data || data;
          setProduct(payload);
        })
        .catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [id]);

  const applyVariantIndex = useCallback(
    (idx) => {
      setSelectedVariant(idx);
      const v = product?.variants?.[idx];
      const sku = v?.sku != null && String(v.sku).trim() !== '' ? String(v.sku).trim() : null;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (sku) next.set('sku', sku);
          else next.delete('sku');
          return next;
        },
        { replace: true }
      );
    },
    [product?.variants, setSearchParams]
  );

  useEffect(() => {
    if (!product?.variants?.length || !skuParam) return;
    const want = decodeURIComponent(String(skuParam).trim());
    const idx = product.variants.findIndex((v) => String(v.sku || '').trim() === want);
    if (idx >= 0) setSelectedVariant(idx);
  }, [product, skuParam]);

  if (loading) return (
    <div className="bg-white min-h-screen font-display">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Đang tải...</div>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="bg-white min-h-screen font-display">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Không tìm thấy sản phẩm.</div>
      <Footer />
    </div>
  );

  const { specs, variants = [] } = product;
  const variant = variants[selectedVariant] || {};
  const salePrice = Number(variant.price ?? 0);
  const listOriginal = Number(variant.original_price ?? variant.originalPrice ?? 0);
  const showOriginalStrike = listOriginal > salePrice && listOriginal > 0;
  const derivedDiscountPct =
    showOriginalStrike && listOriginal > 0
      ? Math.max(0, Math.round(((listOriginal - salePrice) / listOriginal) * 100))
      : 0;
  const discountBadgePct = derivedDiscountPct > 0 ? derivedDiscountPct : Number(variant.discount || 0);
  const imageUrl = variant.image
    ? `${BACKEND_BASE_URL}/${variant.image}`
    : product.image ? `${BACKEND_BASE_URL}/${product.image}` : null;

  const descShort = (product.shortDescription || product.description || "").trim();
  const descDetailHtml = (product.detailHtml || "").trim();

  const cartImageRel =
    variant.image ||
    product.image ||
    product.images?.[0]?.image_url ||
    product.images?.[0]?.imageUrl ||
    null;

  const productStatus = product.status ?? 'active';
  const statusUi = STOREFRONT_STATUS[productStatus];
  const variantStock = Number(variant.stock) || 0;
  const productLevelOk = productStatus === 'active';
  const canPurchase = productLevelOk && variantStock > 0;

  const handleAddToCart = () => {
    const res = addFromProduct(product, variant, specs, cartImageRel);
    if (!res.ok) {
      toastError(res.reason === 'unavailable' ? 'Sản phẩm hiện không mở bán' : 'Sản phẩm đã hết hàng');
      return;
    }
    toastSuccess('Đã thêm vào giỏ hàng');
  };

  const goCheckoutGuest = () => {
    navigate('/thong-tin-nhan-hang');
  };

  const handleBuyNow = () => {
    const res = addFromProduct(product, variant, specs, cartImageRel);
    if (!res.ok || !res.nextItems) {
      toastError(res.reason === 'unavailable' ? 'Sản phẩm hiện không mở bán' : 'Sản phẩm đã hết hàng');
      return;
    }
    if (!cartAllInStock(res.nextItems)) {
      toastError('Sản phẩm đã hết hàng');
      return;
    }
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    navigate('/thong-tin-nhan-hang');
  };

  // Nhóm variants theo ram+storage (cấu hình), lấy màu từ variant
  const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))];

  const specifications = specs ? [
    {
      group: 'Bộ vi xử lý & Card đồ hoạ', items: [
        { label: 'Bộ vi xử lý', value: specs.cpu },
        { label: 'Card đồ hoạ Onboard', value: specs.gpu_onboard },
        { label: 'Card đồ hoạ rời', value: specs.gpu_discrete || 'Không' },
      ]
    },
    {
      group: 'Bộ nhớ RAM & Ổ cứng', items: [
        { label: 'Bộ nhớ RAM', value: variant.ram || specs.ram },
        { label: 'Hỗ trợ RAM tối đa', value: specs.ram_max },
        { label: 'Ổ cứng', value: variant.storage || specs.storage },
        { label: 'Hỗ trợ ổ cứng tối đa', value: specs.storage_max },
      ]
    },
    {
      group: 'Màn hình', items: [
        { label: 'Kích thước màn hình', value: specs.screen_size },
        { label: 'Độ phân giải', value: specs.screen_resolution },
        { label: 'Công nghệ màn hình', value: specs.screen_technology },
      ]
    },
    {
      group: 'Cổng kết nối & Pin', items: [
        { label: 'Cổng giao tiếp', value: specs.ports },
        { label: 'Pin', value: specs.battery },
      ]
    },
    {
      group: 'Kích thước & Trọng lượng', items: [
        { label: 'Kích thước', value: specs.dimensions },
        { label: 'Trọng lượng', value: specs.weight },
        { label: 'Chất liệu', value: specs.material },
      ]
    },
    {
      group: 'Tính năng mở rộng', items: [
        { label: 'Kết nối không dây', value: specs.wireless },
        { label: 'Webcam', value: specs.webcam },
      ]
    },
    {
      group: 'Phần mềm', items: [
        { label: 'Hệ điều hành', value: specs.os },
      ]
    },
  ] : [];

  const allSpecRows = specifications.flatMap(g => g.items);
  const visibleRows = allSpecRows.slice(0, 8);

  return (
    <div className="bg-white font-display text-slate-900 min-h-screen">
      <Header />

      <div className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-slate-500 hover:text-slate-900 transition">
              Trang chủ
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium truncate max-w-[300px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="relative w-full h-[300px] md:h-[420px] bg-white overflow-hidden flex items-center justify-center group p-2 md:p-4">
              {images.length > 0 ? (
                <>
                  {images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImage((i) => (i - 1 + images.length) % images.length)
                        }
                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:border-slate-300"
                        aria-label="Ảnh trước"
                      >
                        <span className="material-symbols-outlined text-2xl">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImage((i) => (i + 1) % images.length)}
                        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:border-slate-300"
                        aria-label="Ảnh sau"
                      >
                        <span className="material-symbols-outlined text-2xl">chevron_right</span>
                      </button>
                    </>
                  ) : null}
                  <img
                    src={images[selectedImage]}
                    alt={
                      specs
                        ? buildDisplayTitle(product.name, variant, specs)
                        : product.name
                    }
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                  />
                </>
              ) : (
                <span className="material-symbols-outlined text-8xl text-gray-300">
                  laptop
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border overflow-hidden flex-shrink-0 bg-white ${selectedImage === index
                      ? 'border-2 border-slate-900'
                      : 'border-slate-300 hover:border-slate-500'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
              <p className="mb-4 text-center text-sm font-semibold text-slate-800">
                Mua tại LAPSTORE - An tâm trọn vẹn
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 ">
                {[
                  {
                    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                    title: 'Bảo hành chính hãng',
                    sub: '12 tháng tại trung tâm ủy quyền',
                  },
                  {
                    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
                    title: 'Giao hàng miễn phí',
                    sub: 'Toàn quốc, đóng gói cẩn thận',
                  },
                  {
                    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
                    title: 'Đổi trả trong 15 ngày',
                    sub: 'Hỗ trợ nếu lỗi từ nhà sản xuất',
                  },
                ].map((b, i) => (
                  <li
                    key={i}
                    className="flex flex-col items-center rounded-lg border border-slate-200/90 bg-white px-3 py-3 text-center sm:items-start sm:text-left"
                  >
                    <span className="mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#CCFF00] text-slate-900">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.icon} />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-slate-900 leading-snug">{b.title}</span>
                    <span className="mt-1 text-sm text-slate-600 leading-relaxed">{b.sub}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {statusUi && productStatus !== 'active' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-bold">{statusUi.label}</p>
                <p className="mt-1 text-amber-900/90">{statusUi.hint}</p>
              </div>
            ) : null}
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-snug text-slate-900">
                {specs
                  ? buildDisplayTitle(product.name, variant, specs)
                  : product.name}
              </h1>
              {(variant.sku || product.masterSku) ? (
                <p className="mt-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-500">SKU:</span>{" "}
                  <span className="font-medium text-slate-800 tracking-tight">
                    {variant.sku || product.masterSku}
                  </span>
                  <button className="copy-to-clipboard" data-clipboard-target={`#sku-${variant.id || product.id}` } onClick={() => {
                    navigator.clipboard.writeText(variant.sku || product.masterSku);
                  }}>
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </p>
              ) : null}
            </div>

            {variants.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-3">Phiên bản</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => applyVariantIndex(i)}
                      className={`inline-flex  w-fit max-w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        selectedVariant === i
                          ? "border-slate-900 bg-slate-50 font-semibold text-slate-900"
                          : "border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <span className="leading-snug break-words">
                        {specs ? buildVariantSummary(v, specs) : [v.ram, v.storage, v.version].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uniqueColors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-3">Màu sắc</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        const idx = variants.findIndex((v) => v.color === color);
                        if (idx !== -1) applyVariantIndex(idx);
                      }}
                      className={`inline-flex rounded-xl border px-3 py-2 text-sm transition ${
                        variant.color === color
                          ? "border-slate-900 bg-slate-50 font-semibold text-slate-900"
                          : "border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 space-y-5 border-t border-slate-100">
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Giá bán (đã gồm VAT)</p>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl md:text-4xl font-extrabold text-rose-600 tabular-nums">
                    {formatPrice(salePrice)}
                  </span>

                  {showOriginalStrike ? (
                    <span className="text-base text-slate-500 line-through tabular-nums">
                      {formatPrice(listOriginal)}
                    </span>
                  ) : null}

                  {discountBadgePct > 0 ? (
                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-rose-100 text-rose-600">
                      -{discountBadgePct}%
                    </span>
                  ) : null}
                </div>

                {productLevelOk ? (
                  variantStock > 0 ? (
                    <p className="text-sm text-green-600 font-medium">✔ Còn hàng</p>
                  ) : (
                    <p className="text-sm text-rose-600 font-medium">Hết hàng — phiên bản này</p>
                  )
                ) : statusUi ? (
                  <p className="text-sm text-slate-600 font-medium">{statusUi.hint}</p>
                ) : null}
                <p className="text-xs text-slate-500">Giá đã bao gồm VAT • Giao nhanh trong 24h</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!canPurchase}
                  className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base transition disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  MUA NGAY
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canPurchase}
                  className="h-12 rounded-xl border border-slate-300 hover:border-slate-500 text-slate-700 font-semibold transition disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  Thêm vào giỏ hàng
                </button>
              </div>

              <div className="pt-5 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900 mb-3">Quà tặng và ưu đãi khác</p>
                <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
                  {[
                    "Tặng balo / túi chống sốc khi mua tại cửa hàng hoặc online (số lượng có hạn).",
                    "Giảm thêm khi thanh toán qua thẻ đối tác (xem chi tiết tại quầy).",
                    "Tham gia chương trình đổi cũ lấy mới — hỗ trợ thu máy cũ giá tốt.",
                  ].map((line, idx) => (
                    <li key={idx} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {specifications.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-900">Cấu hình &amp; đặc điểm</h2>
            <div className="flex flex-col items-start gap-4 pt-2">
              <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white px-4 py-3 md:px-5 md:py-4">
                <table className="w-full table-auto text-sm">
                  <tbody>
                    {visibleRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="max-w-[40%] py-2.5 pr-3 align-top font-semibold text-slate-900">
                          {row.label}
                        </td>
                        <td className="py-2.5 font-medium text-slate-800">{row.value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setShowSpecsModal(true)}
                className="inline-flex items-center gap-2 font-semibold text-sm text-slate-800 hover:text-slate-950"
              >
                Xem tất cả thông số
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {showSpecsModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6"
                onClick={() => setShowSpecsModal(false)}
                role="presentation"
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 md:p-8 min-h-[50vh] max-h-[85vh] relative flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="specs-modal-title"
                >
                  <button
                    type="button"
                    onClick={() => setShowSpecsModal(false)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-3xl font-light leading-none p-2 focus:outline-none"
                    aria-label="Thoát"
                  >
                    ×
                  </button>
                  <h3 id="specs-modal-title" className="text-xl md:text-2xl font-bold mb-6 pr-10">
                    Cấu hình &amp; đặc điểm
                  </h3>
                  <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                    {specifications.map((group, gi) => (
                      <section
                        key={gi}
                        className={gi > 0 ? "pt-6 mt-2 border-t border-slate-100" : ""}
                      >
                        <h4 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
                          {group.group}
                        </h4>
                        <table className="w-full table-fixed border-collapse text-sm">
                          <tbody>
                            {group.items.map((row, ri) => (
                              <tr key={ri} className="border-b border-slate-100 last:border-0">
                                <td className="w-[42%] md:w-[40%] py-2.5 pr-3 text-slate-500 align-top break-words">
                                  {row.label}
                                </td>
                                <td className="py-2.5 text-slate-900 break-words">{row.value || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(descShort || descDetailHtml) ? (
          <div className="mb-12 border-t border-slate-100 pt-10">
            <h2 className="text-xl font-bold mb-4">Mô tả sản phẩm</h2>
            <div className="space-y-6">
              {descShort ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{descShort}</p>
              ) : null}
              {descDetailHtml ? (
                <div
                  className="product-detail-html text-slate-700 [&_img]:max-w-full [&_img]:h-auto"
                  dangerouslySetInnerHTML={{ __html: descDetailHtml }}
                />
              ) : null}
              {imageUrl ? (
                <div className="overflow-hidden mt-2 bg-white">
                  <img src={imageUrl} alt={product.name} className="w-full max-h-72 object-contain" />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

      </main>
      <Footer />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onGuestContinue={goCheckoutGuest} />
    </div>
  );
}
