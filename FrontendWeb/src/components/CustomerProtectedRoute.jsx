import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStaffHomePath, isRetailCustomerRole } from '../features/admin/utils/rbac';

export default function CustomerProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (!isRetailCustomerRole(user?.role)) {
    return <Navigate to={getStaffHomePath()} replace />;
  }

  return children;
}
