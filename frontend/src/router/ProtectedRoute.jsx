import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isChecking } = useAuth();

  // Nếu đang kiểm tra token, hiện loading
  if (isChecking) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    );
  }

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
