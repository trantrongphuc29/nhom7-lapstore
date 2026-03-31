export function normalizeRole(role) {
  if (!role || role === "user") return "user";
  return "admin";
}

export function isStaffRole(role) {
  return normalizeRole(role) === "admin";
}

export function getStaffHomePath() {
  return "/admin";
}

export function isRetailCustomerRole(role) {
  return normalizeRole(role) === "user";
}

export function menuItemVisible() {
  return true;
}

export function filterAdminMenu(menu) {
  return menu;
}
