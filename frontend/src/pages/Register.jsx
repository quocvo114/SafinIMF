import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import banner from "../image/banner-public.jpeg";
import comle from "../image/comle.png";
import cone from "../image/trafficCone.png";

import authApi from "../services/api/authApi";

const VN_PHONE_PATTERN = /^0(?:3|5|7|8|9)\d{8}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const Register = () => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Load saved form data from localStorage
  useEffect(() => {
    const savedFormData = localStorage.getItem("registerFormData");
    if (savedFormData) {
      try {
        const data = JSON.parse(savedFormData);
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setPassword(data.password || "");
        setConfirmPassword(data.confirmPassword || "");
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [location.pathname]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const formData = {
      fullName,
      phone,
      password,
      confirmPassword,
    };
    localStorage.setItem("registerFormData", JSON.stringify(formData));
  }, [fullName, phone, password, confirmPassword]);

  const validatePhone = (phoneValue) => {
    if (!phoneValue.trim()) return "";
    if (!VN_PHONE_PATTERN.test(phoneValue.trim())) {
      return "Số điện thoại không đúng định dạng";
    }
    return "";
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) return "";
    if (!STRONG_PASSWORD_PATTERN.test(passwordValue)) {
      return "Mật khẩu cần ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt";
    }
    return "";
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    setErrors((prev) => ({
      ...prev,
      phone: validatePhone(value),
    }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value),
    }));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value && password && value !== password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu không khớp",
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const normalizedPhone = phone.trim();
    const phoneError = validatePhone(normalizedPhone);
    const passwordError = validatePassword(password);

    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }

    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu không khớp",
      }));
      return;
    }

    try {
      const res = await authApi.sendRegisterOtp(normalizedPhone);

      // Clear saved form data on successful registration
      localStorage.removeItem("registerFormData");

      // Điều hướng sang trang nhập OTP
      navigate("/register/confirm", {
        state: {
          phone: normalizedPhone,
          password,
          full_name: fullName,
          otp_demo: res.data.otp_demo, // demo nếu cần hiển thị
        },
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi khi gửi OTP");
    }
  };

  return (
    <div className="flex min-h-screen w-full select-none flex-col overflow-hidden md:flex-row">
      {/* LEFT */}
      <div className="relative hidden min-h-screen w-1/2 items-center justify-center overflow-hidden md:flex">
        <img
          src={banner}
          alt="Background banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
        <h1
          className="relative text-white italic font-bold drop-shadow-2xl"
          style={{ fontSize: "150px", letterSpacing: "3px" }}
        >
          Safin
        </h1>
      </div>

      {/* RIGHT */}
      <div className="relative flex min-h-screen w-full overflow-hidden bg-white md:w-1/2">
        <img
          src={comle}
          alt=""
          className="pointer-events-none absolute -right-12 top-3 hidden w-40 opacity-90 sm:block md:-right-20 md:top-4 md:w-56"
        />
        <img
          src={cone}
          alt=""
          className="pointer-events-none absolute -bottom-6 -left-8 hidden w-32 opacity-90 sm:block md:bottom-0 md:-left-10 md:w-56"
        />

        <div className="relative z-10 flex w-full flex-col items-center px-5 py-8 sm:px-8 sm:py-10 md:justify-center md:px-10">
          <div className="w-full max-w-[550px]">
            <h2 className="mb-2 text-3xl font-semibold sm:text-4xl">
              Welcome, Sign up
            </h2>
            <h2 className="mb-6 text-3xl font-semibold sm:mb-8 sm:text-4xl">
              to get started
            </h2>

            {message && (
              <p className="mb-4 text-xs text-red-600 break-words whitespace-normal">
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4 sm:mb-5">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="mb-4 sm:mb-5">
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="text"
                  placeholder="Enter your phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  className={`mt-1 w-full rounded-xl border px-4 py-3 ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                />
                <div className="h-5">
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative mb-5 sm:mb-7">
                <label className="text-sm font-medium">Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className={`mt-1 w-full rounded-xl border px-4 py-3 pr-12 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                />
                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
                <div className="h-5">
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600 break-words whitespace-normal leading-snug">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative mb-6 sm:mb-7">
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`mt-1 w-full rounded-xl border px-4 py-3 pr-12 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                />
                {confirmPassword && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
                <div className="h-5">
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <button className="w-full rounded-lg bg-blue-600 py-3 text-white transition hover:bg-blue-700">
                Sign Up
              </button>
            </form>

            <p className="text-center text-sm mt-5">
              Already have an account?{" "}
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/signin")}
              >
                Sign In
              </span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
