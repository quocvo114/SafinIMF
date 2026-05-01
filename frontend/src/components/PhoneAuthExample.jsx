/**
 * 📱 VÍ DỤ ĐẦY ĐỦ: SỬ DỤNG PHONE AUTH
 * 
 * 3 cách dùng:
 * 1. Component đơn giản (PhoneAuthVerification.jsx)
 * 2. Service class (phoneAuth.service.js) 
 * 3. Custom Hook (usePhoneAuth.js) - KHUYÊN DÙNG
 */

import React, { useState } from 'react';
import usePhoneAuth from '../hooks/usePhoneAuth';

const PhoneAuthExample = () => {
  const {
    phoneNumber,
    setPhoneNumber,
    otp,
    setOtp,
    loading,
    error,
    success,
    verificationId,
    sendOTP,
    verifyOTP,
    reset,
  } = usePhoneAuth();

  const [step, setStep] = useState('phone'); // 'phone' or 'otp'

  // Handle gửi OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      await sendOTP(phoneNumber);
      setStep('otp');
    } catch (err) {
      console.error('Send OTP failed:', err);
    }
  };

  // Handle xác nhận OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const result = await verifyOTP(otp);
      console.log('✅ User verified:', result.user.phoneNumber);
      
      // TODO: Lưu user vào database hoặc redirect
      setStep('phone');
    } catch (err) {
      console.error('Verify OTP failed:', err);
    }
  };

  // Handle quay lại
  const handleBack = () => {
    reset();
    setStep('phone');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">📱 Xác Thực SĐT</h1>
          <p className="text-gray-600 mt-2">Đăng nhập nhanh chóng và an toàn</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-green-700 font-medium">✅ {success}</p>
          </div>
        )}

        {/* STEP 1: Nhập số điện thoại */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số Điện Thoại
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+84901234567"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                💡 Định dạng: +[Mã QG][Số SĐT]
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? '⏳ Đang gửi...' : '📤 Gửi Mã OTP'}
            </button>

            {/* Hướng dẫn test */}
            <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
              <h3 className="font-bold text-amber-900 mb-2">🧪 Test Không Tốn Phí</h3>
              <ol className="text-sm text-amber-900 space-y-1 list-decimal list-inside">
                <li>Firebase Console → Authentication</li>
                <li>Phone Numbers → Thêm số test</li>
                <li>
                  Số: <span className="font-mono bg-white px-2 py-1">+84901234567</span>
                </li>
                <li>
                  Mã: <span className="font-mono bg-white px-2 py-1">123456</span>
                </li>
              </ol>
            </div>
          </form>
        )}

        {/* STEP 2: Nhập OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã Xác Thực
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                className="w-full px-4 py-4 text-center text-3xl tracking-widest font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                📨 Kiểm tra SMS gửi đến {phoneNumber}
              </p>
            </div>

            {/* Countdown (optional) */}
            <p className="text-center text-sm text-gray-600">
              ⏱️ Mã hết hạn trong 10 phút
            </p>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? '⏳ Đang xác nhận...' : '✅ Xác Nhận'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
              >
                ↩️ Quay Lại
              </button>
            </div>

            {/* Resend OTP option */}
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
            >
              Gửi lại mã?
            </button>
          </form>
        )}

        {/* Recaptcha Container (IMPORTANT!) */}
        <div id="recaptcha-container" className="mt-4"></div>

        {/* Debug Info (Chỉ dùng khi test) */}
        {process.env.NODE_ENV === 'development' && verificationId && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600">
            <p>🔍 Verification ID: {verificationId.slice(0, 10)}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneAuthExample;
