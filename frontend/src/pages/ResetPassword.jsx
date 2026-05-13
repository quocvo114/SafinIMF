import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Toast from "../components/Toast";
import authApi from "../services/api/authApi";
import banner from "../image/banner-public.jpeg";

const ResetPassword = () => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || "";

  if (!phone) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Invalid Access</h2>
          <p className="text-gray-600 mb-6">Please start from the Forgot Password page</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Forgot Password
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setToast({ message: "Vui lòng nhập OTP", type: "error" });
      return;
    }

    if (!newPassword.trim()) {
      setToast({ message: "Vui lòng nhập mật khẩu mới", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ message: "Mật khẩu không khớp", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: "Mật khẩu phải có ít nhất 6 ký tự", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.resetPassword(phone, otp, newPassword);

      if (res.data.success) {
        setToast({ 
          message: "Đặt lại mật khẩu thành công!", 
          type: "success" 
        });
        
        setTimeout(() => {
          navigate("/signin");
        }, 1500);
      } else {
        setToast({ 
          message: res.data.message || "Không thể đặt lại mật khẩu", 
          type: "error" 
        });
      }
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || "Lỗi khi đặt lại mật khẩu", 
        type: "error" 
      });
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
        {/* Banner */}
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

        {/* Form */}
        <div className="w-full md:w-1/2 min-h-screen bg-white relative flex justify-center items-center py-10">
          <div className="w-[90%] max-w-[450px] mx-auto">
            <button
              onClick={() => navigate("/forgot-password")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 mb-6">
              Enter the OTP sent to <strong>{phone}</strong> and your new password.
            </p>

            <form onSubmit={handleSubmit}>
              {/* OTP */}
              <div className="mb-5">
                <label className="text-sm font-medium">OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl 
                             text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Check your phone for the OTP code
                </p>
              </div>

              {/* NEW PASSWORD */}
              <div className="mb-5 relative">
                <label className="text-sm font-medium">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl 
                             text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-10 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="mb-6 relative">
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl 
                             text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-10 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
