/**
 * Tránh lệch layout ngang khi khóa scroll (thanh cuộn biến mất):
 * bù padding phải bằng độ rộng scrollbar.
 */
export function getScrollbarWidth() {
  if (typeof window === 'undefined') return 0;
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

export function lockBodyScroll() {
  const w = getScrollbarWidth();
  document.body.style.overflow = 'hidden';
  if (w > 0) {
    document.body.style.paddingRight = `${w}px`;
  }
}

export function unlockBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
