// Cấu hình base URL cho API và Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nhom7-lapstore-backend.up.railway.app/api';
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://nhom7-lapstore-backend.up.railway.app';

export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/products`,
  PRODUCT_DETAIL: (id) => `${API_BASE_URL}/products/${id}`,
  BANNERS: `${API_BASE_URL}/banners`,
  USERS: `${API_BASE_URL}/users`,
  USER_DETAIL: (id) => `${API_BASE_URL}/users/${id}`,
};

export { BACKEND_BASE_URL };
export default API_BASE_URL;