import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import CustomerProtectedRoute from "../components/CustomerProtectedRoute";
import ProtectedRoute from "../components/ProtectedRoute";
import AccountLayout from "../pages/account/AccountLayout";
import AccountAddressesPage from "../pages/account/AccountAddressesPage";
import AccountFaqPage from "../pages/account/AccountFaqPage";
import AccountOrdersPage from "../pages/account/AccountOrdersPage";
import AccountProfilePage from "../pages/account/AccountProfilePage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import CompareProductsPage from "../pages/CompareProductsPage";
import AdminRoutes from "../features/admin/routes/AdminRoutes";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import OrderSuccessPage from "../pages/OrderSuccessPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import RegisterPage from "../pages/RegisterPage";
import SearchResultsPage from "../pages/SearchResultsPage";
import ShippingInfoPage from "../pages/ShippingInfoPage";
import UsersPage from "../pages/UsersPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/tim-kiem" element={<SearchResultsPage />} />
      <Route path="/compare" element={<CompareProductsPage />} />
      <Route path="/gio-hang" element={<CartPage />} />
      <Route path="/thong-tin-nhan-hang" element={<ShippingInfoPage />} />
      <Route path="/thanh-toan" element={<CheckoutPage />} />
      <Route path="/dat-hang-thanh-cong" element={<OrderSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/tai-khoan"
        element={(
          <CustomerProtectedRoute>
            <AccountLayout />
          </CustomerProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="thong-tin" replace />} />
        <Route path="thong-tin" element={<AccountProfilePage />} />
        <Route path="don-hang" element={<AccountOrdersPage />} />
        <Route path="so-dia-chi" element={<AccountAddressesPage />} />
        <Route path="faq" element={<AccountFaqPage />} />
      </Route>
      <Route
        path="/admin/*"
        element={(
          <ProtectedRoute>
            <AdminRoutes />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}
