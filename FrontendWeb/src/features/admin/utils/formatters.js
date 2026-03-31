export function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

/** Hiển thị đầy đủ: 25.000.000 đ */
export function formatVndCurrency(value) {
  return `${formatVnd(value)} đ`;
}
