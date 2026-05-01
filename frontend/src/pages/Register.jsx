import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import banner from "../image/banner-public.jpeg";
import comle from "../image/comle.png";
import cone from "../image/trafficCone.png";

import authApi from "../services/api/authApi";

const Register = () => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Password không khớp!");
      return;
    }

    try {
      const res = await authApi.sendRegisterOtp(phone);

      // Điều hướng sang trang nhập OTP
      navigate("/register/confirm", {
        state: {
          phone,
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

            {message && <p className="mb-4 text-sm text-red-600">{message}</p>}

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
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="relative mb-5 sm:mb-7">
                <label className="text-sm font-medium">Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border px-4 py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute bottom-3.5 right-4"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative mb-6 sm:mb-7">
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border px-4 py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute bottom-3.5 right-4"
                >
                  {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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
