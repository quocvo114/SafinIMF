import React, { createContext, useContext, useState, useEffect } from "react";
import authApi from "../services/api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

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
      console.log("✅ Server logout called - token_version incremented");
    } catch (err) {
      console.error("❌ Server logout failed:", err.message);
    }
    
    // Clear local state & storage
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("✅ Local logout completed - localStorage cleared");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
