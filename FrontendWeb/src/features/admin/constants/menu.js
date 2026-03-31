export const ADMIN_MENU = [
  { key: "dashboard", label: "Dashboard", path: "/admin", icon: "dashboard", end: true },
  {
    key: "products",
    label: "Sản phẩm",
    icon: "inventory_2",
    children: [
      { key: "product-list", label: "Danh sách sản phẩm", path: "/admin/products", end: true },
      { key: "product-create", label: "Thêm sản phẩm", path: "/admin/products/new" },
      { key: "brands", label: "Thương hiệu", path: "/admin/brands" },
    ],
  },
  {
    key: "orders",
    label: "Đơn hàng",
    icon: "shopping_bag",
    children: [
      { key: "orders-all", label: "Tất cả đơn hàng", path: "/admin/orders", end: true },
      {
        key: "orders-pending",
        label: "Đơn cần xử lý",
        path: "/admin/orders/pending",
        badgeKey: "pendingOrders",
      },
    ],
  },
  { key: "customers", label: "Khách hàng", path: "/admin/customers", icon: "groups" },
  { key: "promotions", label: "Khuyến mãi", path: "/admin/promotions", icon: "sell" },
  { key: "audit-logs", label: "Nhật ký admin", path: "/admin/audit-logs", icon: "fact_check" },
  { key: "settings", label: "Cài đặt", path: "/admin/settings", icon: "settings" },
];
