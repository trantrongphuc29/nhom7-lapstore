// Cấu hình base URL cho API và Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nhom7-web-backend.gt.tc/api';
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://nhom7-web-backend.gt.tc';

export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/products/read.php`,
  PRODUCT_DETAIL: `${API_BASE_URL}/products/read_one.php`,
  CREATE_PRODUCT: `${API_BASE_URL}/products/create.php`,
  UPDATE_PRODUCT: `${API_BASE_URL}/products/update.php`,
  DELETE_PRODUCT: `${API_BASE_URL}/products/delete.php`,
  BANNERS: `${API_BASE_URL}/banners/read.php`,
  USERS: `${BACKEND_BASE_URL}/users/`,
  USER_CREATE: `${API_BASE_URL}/users/create.php`,
  USER_UPDATE: `${API_BASE_URL}/users/update.php`,
  USER_DELETE: `${API_BASE_URL}/users/delete.php`,
};

export { BACKEND_BASE_URL };
export default API_BASE_URL;
