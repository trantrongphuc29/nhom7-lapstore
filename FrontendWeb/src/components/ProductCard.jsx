import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { storefrontProductPath } from '../utils/productPaths';

/** Sau khoảng thời gian này (hover), card đổi sang ảnh thứ 2 và giữ nguyên đến khi rời chuột */
const HOVER_SHOW_SECOND_IMAGE_MS = 800;

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
      className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-100 bg-white transition-[box-shadow,border-color] duration-200 hover:border-slate-50 hover:shadow-[0_10px_40px_-4px_rgba(15,23,42,0.12)] sm:min-h-[380px] sm:rounded-2xl lg:h-[490px] lg:max-h-[490px]"
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-3 md:p-4">
        <div
          className="group/image relative flex h-[110px] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white sm:h-[160px] md:h-[210px] lg:h-[232px] lg:rounded-xl"
          onMouseEnter={onImageEnter}
          onMouseLeave={onImageLeave}
        >
          {statusBadge ? (
            <span
              className={`absolute left-1 top-1 z-10 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm sm:left-2 sm:top-2 sm:rounded-md sm:px-2 sm:text-[10px] ${statusBadge.className}`}
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
            <span className="material-symbols-outlined text-4xl text-slate-200 sm:text-6xl">laptop</span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden pt-1.5 sm:gap-1.5 sm:pt-2.5">
          <h4 className="line-clamp-2 shrink-0 text-[11px] font-bold leading-snug text-slate-900 sm:text-sm md:text-[18px]">
            {product.name}
          </h4>

          {product.displaySku ? (
            <p
              className="hidden shrink-0 truncate font-mono text-[11px] text-slate-500 sm:block md:text-xs"
              title={product.displaySku}
            >
              SKU:{product.displaySku}
            </p>
          ) : null}

          {product.specSummary ? (
            <p className="line-clamp-2 shrink-0 text-[10px] leading-snug text-slate-600 sm:text-sm md:text-[15px]">
              {product.specSummary}
            </p>
          ) : null}

          <div className="mt-auto flex min-h-0 shrink-0 flex-col gap-1.5 pt-1 sm:gap-2.5 sm:pt-2">
            {colorNames.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="shrink-0 text-[10px] font-semibold text-slate-500 sm:text-xs md:text-sm">Màu</span>
                {colorNames.map((color) => (
                  <span
                    key={color}
                    className="h-3 w-3 rounded-full border border-slate-300 sm:h-4 sm:w-4"
                    style={{ backgroundColor: colorMap[color] || '#d1d5db' }}
                    title={color}
                  />
                ))}
              </div>
            ) : null}

            {product.variantCount > 1 ? (
              <p className="line-clamp-1 text-[10px] font-semibold leading-snug text-slate-500 sm:text-xs md:text-sm">
                +{product.variantCount - 1} phiên bản khác
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <p className="text-sm font-bold leading-tight text-rose-600 sm:text-base">{product.priceFormatted}</p>
              {product.min_discount > 0 ? (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-red-50 sm:px-2 sm:text-[10px]">
                  -{product.min_discount}%
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
