/** Nhãn 3 trạng thái đơn hàng trong admin (khớp DB: pending | accepted | delivered). */
export const ADMIN_ORDER_STATUS_LABEL = {
  pending: "Cần xử lý",
  accepted: "Đã tiếp nhận",
  delivered: "Đã giao",
};

export function labelAdminOrderStatus(status) {
  if (!status) return "—";
  return ADMIN_ORDER_STATUS_LABEL[status] || String(status);
}
