import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role !== "admin") {
    // Không phải admin → cho về trang chính (hoặc /forbidden)
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
