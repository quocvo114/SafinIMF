import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import banner from "../image/banner-public.jpeg";
import cone from "../image/trafficCone.png";
import authApi from "../services/api/authApi";
import { toast } from "sonner";

const RegisterConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy dữ liệu truyền từ Register
  const { phone, password, full_name } = location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState("");
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Nếu vào thẳng /register/confirm mà không có state
  if (!phone) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Thiếu thông tin đăng ký. Vui lòng quay lại trang đăng ký.</p>
      </div>
    );
  }

  // Handle OTP input
  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);

    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Resend OTP (gọi lại API send-otp)
  const handleResendOTP = async () => {
    if (!canResend) return;
    try {
      setMessage("");
      await authApi.sendRegisterOtp(phone);
      setTimeLeft(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setMessage(err.response?.data?.message || "Không gửi lại được OTP");
    }
  };

  // Submit OTP (gọi API confirmRegister)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setMessage("Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    try {
      setMessage("");
      await authApi.confirmRegister({
        phone,
        otp: otpCode,
        password,
        full_name,
      });

      toast.success("Đăng ký thành công!");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP không đúng, thử lại.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  if (!phone) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Thiếu thông tin đăng ký. Vui lòng quay lại trang đăng ký.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-screen flex flex-col md:flex-row select-none overflow-hidden bg-white">
        {/* LEFT SIDE */}
        <div className="hidden md:flex w-1/2 min-h-screen relative justify-center items-center overflow-hidden">
          <img
            src={banner}
            alt="banner"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
          <h1
            className="text-white font-bold drop-shadow-2xl italic font-inter relative z-10"
            style={{ fontSize: "150px", letterSpacing: "3px" }}
          >
            Safin
          </h1>
        </div>

        {/* RIGHT SIDE - OTP Form */}
        <div className="w-full md:w-1/2 min-h-screen bg-white relative flex justify-center items-center py-8 px-4">
          <img
            src={cone}
            alt="cone"
            className="absolute top-4 right-4 w-20 sm:w-28 md:w-32 lg:w-40 opacity-90 hidden sm:block"
            style={{ transform: "rotate(15deg)" }}
          />

          <div className="w-full max-w-[500px] mx-auto relative z-10">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-2">
                Verify your phone
              </h2>
              <p className="text-sm text-gray-600">
                Mã OTP đã được gửi tới số <b>{phone}</b>
              </p>
            </div>

            {message && (
              <p className="mb-3 text-sm text-red-600 whitespace-pre-line">
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  OTP
                </label>

                <div className="flex gap-2 sm:gap-3 md:gap-4 justify-center mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl sm:text-2xl md:text-3xl font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend}
                    className={`text-sm font-medium transition-colors ${
                      canResend
                        ? "text-gray-500 hover:text-gray-600 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {canResend
                      ? "Resend OTP Code"
                      : `Resend OTP Code (${timeLeft}s)`}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 sm:py-3.5 md:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterConfirm;
