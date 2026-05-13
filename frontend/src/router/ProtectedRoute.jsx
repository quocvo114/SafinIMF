import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  // Nếu chưa đăng nhập -> redirect về SignIn
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // requiredRole có thể là string hoặc mảng roles
  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : requiredRole
      ? [requiredRole]
      : [];

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role thuộc nhóm quản trị/đội xử lý nhưng vào sai trang
    if (["admin", "manager", "maintenance"].includes(user.role)) {
      if (user.role === "maintenance") {
        return <Navigate to="/admin/maintenanceteam" replace />;
      }
      return <Navigate to="/admin/overview" replace />;
    }

    // User thường vào nhầm trang admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
