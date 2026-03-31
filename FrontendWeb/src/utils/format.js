export function fmtPrice(n) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(Number(n) || 0));
}
