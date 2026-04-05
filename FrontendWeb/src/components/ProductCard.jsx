import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { storefrontProductPath } from '../utils/productPaths';

/** Sau khoảng thời gian này (hover), card đổi sang ảnh thứ 2 và giữ nguyên đến khi rời chuột */
const HOVER_SHOW_SECOND_IMAGE_MS = 1000;

const colorMap = {
  'Đen': '#111827',
  'Bạc': '#cbd5e1',
  'Xám': '#6b7280',
  'Xám Không Gian': '#4b5563',
  'Đen Vũ Trụ': '#0f172a',
  'Xanh': '#2563eb',
  'Xanh Ngọc': '#0f766e',
  'Xanh Bầu Trời': '#38bdf8',
  'Vàng Ánh Sao': '#facc15',
  'Bạc Tự Nhiên': '#e5e7eb',
  'Đen Ngọc': '#1f2937',
};

const STATUS_BADGE = {
  inactive: { label: "Ngưng bán", className: "bg-slate-800 text-white" },
  out_of_stock: { label: "Hết hàng", className: "bg-rose-600 text-white" },
  coming_soon: { label: "Sắp ra mắt", className: "bg-amber-500 text-white" },
};

const ProductCard = ({ product }) => {
  const colorNames = (product.colors || []).slice(0, 4);
  const st = product.status;
  const statusBadge = st && st !== "active" ? STATUS_BADGE[st] : null;
  const hasSecondImage = Boolean(product.imageUrl2);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const hoverTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    },
    []
  );

  const onImageEnter = () => {
    if (!hasSecondImage) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setShowSecondImage(true), HOVER_SHOW_SECOND_IMAGE_MS);
  };

  const onImageLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowSecondImage(false);
  };

  return (
    <Link
      to={storefrontProductPath(product)}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-50 hover:shadow-[0_10px_40px_-4px_rgba(15,23,42,0.12)] transition-[box-shadow,border-color] duration-200 relative flex flex-col h-[490px] max-h-[490px]"
    >
      <div className="p-3 md:p-4 flex flex-col h-full min-h-0 min-w-0">
        <div
          className="relative h-[210px] md:h-[232px] w-full shrink-0 overflow-hidden rounded-xl bg-white flex items-center justify-center group/image"
          onMouseEnter={onImageEnter}
          onMouseLeave={onImageLeave}
        >
          {statusBadge ? (
            <span
              className={`absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          ) : null}
          {product.imageUrl && hasSecondImage ? (
            <div className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out group-hover/image:scale-105">
              <img
                className={`absolute inset-0 m-auto max-h-full max-w-full object-contain transition-opacity duration-300 ease-out ${
                  showSecondImage ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
                alt={product.name}
                src={product.imageUrl}
              />
              <img
                className={`absolute inset-0 m-auto max-h-full max-w-full object-contain transition-opacity duration-300 ease-out ${
                  showSecondImage ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                alt=""
                src={product.imageUrl2}
              />
            </div>
          ) : product.imageUrl ? (
            <img
              className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover/image:scale-105"
              alt={product.name}
              src={product.imageUrl}
            />
          ) : (
            <span className="material-symbols-outlined text-6xl text-slate-200">laptop</span>
          )}
        </div>

        <div className="flex flex-col flex-1 min-h-0 pt-2.5 gap-1.5 overflow-hidden">
          <h4 className="text-sm md:text-[18px] font-bold text-slate-900 leading-snug line-clamp-2 shrink-0">
            {product.name}
          </h4>

          {product.displaySku ? (
            <p className="text-[11px] md:text-xs font-mono text-slate-500 truncate shrink-0" title={product.displaySku}>
              SKU:{product.displaySku}
            </p>
          ) : null}

          {product.specSummary ? (
            <p className="text-sm md:text-[15px] text-slate-600 leading-snug line-clamp-2 shrink-0">
              {product.specSummary}
            </p>
          ) : null}

          <div className="flex flex-col gap-2.5 mt-auto pt-2 shrink-0 min-h-0">
            {colorNames.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs md:text-sm font-semibold text-slate-500 shrink-0">Màu</span>
                {colorNames.map((color) => (
                  <span
                    key={color}
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: colorMap[color] || '#d1d5db' }}
                    title={color}
                  />
                ))}
              </div>
            ) : null}

            {product.variantCount > 1 ? (
              <p className="text-xs md:text-sm font-semibold text-slate-500 leading-snug line-clamp-1">
                +{product.variantCount - 1} phiên bản khác
              </p>
            ) : null}

            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-rose-600 font-bold text-base leading-tight">{product.priceFormatted}</p>
              {product.min_discount > 0 ? (
                <span className="text-red-50 bg-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">-{product.min_discount}%</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
