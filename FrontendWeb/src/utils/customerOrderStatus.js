/** Giao diện khách chỉ hiển thị: Đã đặt | Hoàn thành. */
export function getCustomerOrderStatusLabel(status) {
  if (status === "delivered") return "Hoàn thành";
  return "Đã đặt";
}

export function isCustomerOrderDelivered(status) {
  return status === "delivered";
}
