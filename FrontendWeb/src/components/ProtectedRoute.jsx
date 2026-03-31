import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffRole, normalizeRole } from '../features/admin/utils/rbac';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user?.role);
  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
    if (!normalizedAllowed.includes(role)) return <Navigate to="/" replace />;
  } else if (!isStaffRole(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
