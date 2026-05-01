import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../services/firebase'; // Đảm bảo import auth từ Firebase config của bạn

const PhoneAuthVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  // ============================================
  // KHỞI TẠO RECAPTCHA (Invisible)
  // ============================================
  useEffect(() => {
    // ⚠️ QUAN TRỌNG: Chỉ khởi tạo Recaptcha một lần
    if (!recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible', // Invisible recaptcha
          callback: (response) => {
            console.log('🔒 Recaptcha verified:', response);
          },
          'expired-callback': () => {
            console.warn('⚠️ Recaptcha expired');
            setError('Recaptcha hết hạn, vui lòng thử lại');
          },
        });

        setRecaptchaVerifier(verifier);
        console.log('✅ Recaptcha initialized');
      } catch (err) {
        console.error('❌ Lỗi khởi tạo Recaptcha:', err);
        setError('Lỗi khởi tạo Recaptcha');
      }
    }

    // Cleanup function
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);

  // ============================================
  // HÀM GỬI OTP
  // ============================================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Validate số điện thoại (E.164 format: +84901234567)
      if (!phoneNumber.match(/^\+\d{1,15}$/)) {
        throw new Error('Số điện thoại không hợp lệ. Định dạng: +84901234567');
      }

      console.log('📱 Gửi OTP đến:', phoneNumber);

      // 🔒 Sử dụng recaptchaVerifier đã khởi tạo
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );

      // Lưu verification ID để dùng lúc verify OTP
      setVerificationId(confirmationResult.verificationId);
      setStep('otp');
      setMessage('✅ Mã xác thực đã được gửi! Kiểm tra SMS của bạn.');

      console.log('✅ SMS gửi thành công');
    } catch (err) {
      console.error('❌ Lỗi gửi OTP:', err.code, err.message);

      // Xử lý các lỗi phổ biến
      const errorMessages = {
        'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
        'auth/quota-exceeded': 'Quá nhiều lần thử, vui lòng thử lại sau',
        'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa',
        'auth/too-many-requests': 'Quá nhiều yêu cầu, vui lòng thử lại sau',
      };

      setError(errorMessages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HÀM XÁC NHẬN OTP
  // ============================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Validate OTP (6 chữ số)
      if (!otp.match(/^\d{6}$/)) {
        throw new Error('Mã OTP phải là 6 chữ số');
      }

      if (!verificationId) {
        throw new Error('Lỗi: verificationId không tồn tại. Vui lòng gửi OTP lại');
      }

      console.log('🔑 Xác nhận OTP...');

      // Xác nhận mã OTP
      const credential = await recaptchaVerifier
        .verify()
        .then(() => {
          return confirmationResult.confirm(otp);
        });

      console.log('✅ Xác thực thành công!', credential.user);
      setMessage('✅ Xác thực số điện thoại thành công!');
      setStep('phone'); // Reset về bước đầu
      setPhoneNumber('');
      setOtp('');
      setVerificationId(null);

      // TODO: Lưu user info hoặc chuyển hướng trang
      console.log('👤 User info:', credential.user.phoneNumber);
    } catch (err) {
      console.error('❌ Lỗi xác nhận OTP:', err.code, err.message);

      const errorMessages = {
        'auth/invalid-verification-code': 'Mã OTP không chính xác',
        'auth/code-expired': 'Mã OTP đã hết hạn, vui lòng gửi lại',
        'auth/session-expired': 'Phiên làm việc hết hạn, vui lòng thử lại',
      };

      setError(errorMessages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESET FORM
  // ============================================
  const handleReset = () => {
    setPhoneNumber('');
    setOtp('');
    setVerificationId(null);
    setStep('phone');
    setMessage('');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Xác Thực Số Điện Thoại</h2>

      {/* Tin nhắn thành công */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {/* Tin nhắn lỗi */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI */}
      {step === 'phone' && (
        <form onSubmit={handleSendOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số Điện Thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+84901234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              ℹ️ Định dạng: +[mã quốc gia][số điện thoại]
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? '⏳ Đang gửi...' : '📤 Gửi Mã OTP'}
          </button>

          {/* Hướng dẫn số Test */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-semibold text-yellow-800 mb-2">
              🧪 Hướng dẫn Test (không tốn phí):
            </p>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>Vào Firebase Console → Authentication → Phone Numbers</li>
              <li>Thêm số test: <code className="bg-white px-1 rounded">+84901234567</code></li>
              <li>Gán mã test: <code className="bg-white px-1 rounded">123456</code></li>
              <li>Nhập số & mã trên vào form này để test</li>
            </ol>
          </div>
        </form>
      )}

      {/* BƯỚC 2: NHẬP OTP */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã OTP (6 chữ số)
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength="6"
              className="w-full px-4 py-2 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              ℹ️ Kiểm tra SMS gửi đến {phoneNumber}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {loading ? '⏳ Đang xác nhận...' : '✅ Xác Nhận'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex-1 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ↩️ Quay Lại
            </button>
          </div>
        </form>
      )}

      {/* Container cho Recaptcha Invisible */}
      <div id="recaptcha-container" className="mt-4"></div>
    </div>
  );
};

export default PhoneAuthVerification;
