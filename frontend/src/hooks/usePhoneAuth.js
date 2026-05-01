/**
 * 🎣 usePhoneAuth Hook
 * Custom hook để xác thực số điện thoại qua Firebase + Backend
 * 
 * Luồng:
 * 1. Firebase xác thực SĐT
 * 2. Gửi thông tin lên Backend
 * 3. Backend lưu vào Database
 * 
 * Cách dùng:
 * const { sendOTP, verifyOTP, loading, error } = usePhoneAuth();
 */

import { useEffect, useState, useCallback } from 'react';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import * as phoneApi from '../services/api/phoneApi';

export const usePhoneAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Khởi tạo Recaptcha
  useEffect(() => {
    if (!recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('✅ Recaptcha verified'),
          'expired-callback': () => setError('Recaptcha hết hạn'),
        });
        setRecaptchaVerifier(verifier);
      } catch (err) {
        console.error('❌ Recaptcha error:', err);
        setError('Lỗi khởi tạo Recaptcha');
      }
    }

    return () => {
      recaptchaVerifier?.clear();
    };
  }, [recaptchaVerifier]);

  // 📤 Gửi OTP
  const sendOTP = useCallback(
    async (phone) => {
      setError('');
      setSuccess('');
      setLoading(true);

      try {
        if (!phone.match(/^\+\d{1,15}$/)) {
          throw new Error('Định dạng sai: +84901234567');
        }

        if (!recaptchaVerifier) {
          throw new Error('Recaptcha chưa sẵn sàng');
        }

        console.log(`📱 Gửi OTP đến ${phone}`);

        const result = await signInWithPhoneNumber(
          auth,
          phone,
          recaptchaVerifier
        );

        setConfirmationResult(result);
        setVerificationId(result.verificationId);
        setSuccess('✅ Gửi OTP thành công!');
        console.log('✅ SMS sent');

        return result;
      } catch (err) {
        const msg = err.message || 'Lỗi gửi OTP';
        setError(msg);
        console.error('❌ Send OTP error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [recaptchaVerifier]
  );

  // ✅ Xác nhận OTP
  const verifyOTP = useCallback(
    async (otpCode) => {
      setError('');
      setSuccess('');
      setLoading(true);

      try {
        if (!otpCode.match(/^\d{6}$/)) {
          throw new Error('Mã OTP phải 6 chữ số');
        }

        if (!confirmationResult) {
          throw new Error('Chưa gửi OTP');
        }

        console.log('🔑 Xác nhận OTP...');

        // 1️⃣ Firebase xác thực OTP
        const userCredential = await confirmationResult.confirm(otpCode);
        const phoneNumber = userCredential.user.phoneNumber;
        const uid = userCredential.user.uid;

        console.log('✅ Firebase verified:', phoneNumber);

        // 2️⃣ Lấy Firebase ID Token
        const token = await userCredential.user.getIdToken();

        // 3️⃣ Gửi lên Backend để lưu SĐT
        console.log('📤 Sending to Backend...');
        const backendResult = await phoneApi.linkPhoneNumber(
          phoneNumber,
          uid,
          token
        );

        setSuccess('✅ Xác thực SĐT thành công! Đã lưu vào hệ thống');
        console.log('✅ Backend saved:', backendResult);

        // Reset
        setPhoneNumber('');
        setOtp('');
        setConfirmationResult(null);
        setVerificationId(null);

        return {
          userCredential,
          backendResult,
        };
      } catch (err) {
        const msg = err.message || err.msg || 'Lỗi xác nhận OTP';
        setError(msg);
        console.error('❌ Verify OTP error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [confirmationResult]
  );

  // Reset state
  const reset = useCallback(() => {
    setPhoneNumber('');
    setOtp('');
    setError('');
    setSuccess('');
    setVerificationId(null);
    setConfirmationResult(null);
  }, []);

  return {
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
  };
};

export default usePhoneAuth;
