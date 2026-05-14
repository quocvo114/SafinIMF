import React, { createContext, useContext, useState, useEffect } from "react";
import authApi from "../services/api/authApi";
import axiosClient from "../services/api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isChecking, setIsChecking] = useState(true); // Kiểm tra token khi mở app

  // Kiểm tra token hợp lệ khi app khởi động
  useEffect(() => {
    const verifyTokenOnStartup = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        try {
          // Gọi API bất kỳ với token để verify nó còn hợp lệ hay không
          // Nếu 401, token đã hết hạn
          const response = await axiosClient.get("/auth/verify", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          
          if (response.data.success) {
            // Token vẫn hợp lệ, giữ nguyên state
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          }
        } catch (error) {
          // Token hết hạn hoặc không hợp lệ
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsChecking(false);
    };

    verifyTokenOnStartup();
  }, []);

  const login = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    try {
      // Call server logout endpoint to increment token_version (invalidate all tokens)
      await authApi.logout();
// ✅ Cleanup: Server logout logging removed
      } catch (err) {
        // ✅ Cleanup: Logout error handling silenced
    }
    
    // Clear local state & storage
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";

  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isChecking }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
