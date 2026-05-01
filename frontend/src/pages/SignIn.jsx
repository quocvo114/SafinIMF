import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import banner from "../image/banner-public.jpeg";
import comle from "../image/comle.png";
import cone from "../image/trafficCone.png";
import authApi from "../services/api/authApi";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SignIn = () => {
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const token = credentialResponse.credential;
      
      const res = await authApi.googleLogin(token);
      
      if (res.data.success) {
        // Login thẳng
        login(res.data.token, res.data.user);
        setToast({ message: `Chào mừng ${res.data.user.full_name || 'bạn'}!`, type: "success" });
        
        const userRole = res.data.user.role;
        if (userRole === "maintenance") {
          setTimeout(() => navigate("/maintenance/dashboard"), 1500);
        } else if (userRole === "admin" || userRole === "manager") {
          setTimeout(() => navigate("/admin/overview"), 1500);
        } else {
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      }
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || "Google login thất bại",
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setToast({ message: "Google login bị lỗi, vui lòng thử lại", type: "error" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.login(phone, password);
      if (res.data.success) {
        login(res.data.token, res.data.user);
        setToast({ message: `Chào mừng ${res.data.user.full_name || 'bạn'}!`, type: "success" });
        
        // Kiểm tra role để điều hướng
        const userRole = res.data.user.role;
        if (userRole === "maintenance") {
          setTimeout(() => navigate("/maintenance/dashboard"), 1500);
        } else if (userRole === "admin" || userRole === "manager") {
          setTimeout(() => navigate("/admin/overview"), 1500);
        } else {
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      } else {
        setMessage(res.data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="w-full h-screen flex flex-col md:flex-row select-none overflow-hidden">
      {/* Dành cho mt để bàn */}
      <div className="hidden md:flex w-1/2 min-h-screen relative justify-center items-center overflow-hidden">
        <img
          src={banner}
          alt="banner"
          className="absolute inset-0 h-full w-[200%] object-cover object-right"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <h1
          className="text-white relative font-sans italic tracking-[-0.03em]"
          style={{
            fontSize: "180px",
            textShadow: "0px 15px 40px rgba(0,0,0,0.65)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Safin
        </h1>
      </div>

     
      <div className="w-full md:w-1/2 min-h-screen bg-white relative flex justify-center items-center py-10">
        <img
          src={comle}
          alt="wrench"
          className="absolute top-4 -right-20 w-56 opacity-90 hidden md:block"
          style={{ transform: "rotate(10deg)" }}
        />
        <img
          src={cone}
          alt="cone"
          className="absolute -bottom-8 left-6 w-56 opacity-90 hidden md:block"
          style={{ transform: "rotate(-20deg)" }}
        />

        <div className="w-[90%] max-w-[450px] mx-auto mt-10 md:mt-0">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2">
            Welcome, Log in to
          </h2>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
            your account.
          </h2>

          {message && (
            <p className="mb-4 text-sm text-red-600 whitespace-pre-line">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            {/* PHONE */}
            <div className="mb-5">
              <label className="text-sm font-medium">Phone</label>
              <input
                type="text"
                placeholder="Enter your phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl 
                           text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-3 relative">
              <label className="text-sm font-medium">Password</label>

              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl 
                           text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                required
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 bottom-4 text-gray-500 hover:text-gray-700"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="mb-7 text-left">
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Điều hướng đến trang forgot password
                  navigate("/forgot-password");
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition"
            >
              {loading ? "Đang đăng nhập..." : "Log In"}
            </button>
          </form>

          {/* TIẾP TỤC */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">or continue with</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* GOOGLE Đăng nhập */}
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signin_with"
                />
              </div>
            </GoogleOAuthProvider>
          ) : (
            <p className="text-center text-xs text-amber-600">
              Google login chưa được cấu hình (thiếu VITE_GOOGLE_CLIENT_ID).
            </p>
          )}

          <p className="text-center text-sm mt-5">
            Don't Have An Account Yet?{" "}
            <span
              className="text-blue-600 font-semibold cursor-pointer"
              onClick={() => navigate("/register")}
            >
              Register For Free
            </span>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
export default SignIn;
