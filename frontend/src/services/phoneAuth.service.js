/**
 * 📱 Phone Authentication Service
 * Sử dụng Firebase Auth SDK v10 để xác thực số điện thoại
 *
 * ⚠️ MỚI SETUP: Cần điền API key và cấu hình Firebase
 */

import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export class PhoneAuthService {
  constructor(auth) {
    this.auth = auth;
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  /**
   * 🔒 Khởi tạo RecaptchaVerifier (Invisible)
   * @param {string} containerId - ID của DOM element chứa recaptcha
   * @param {Function} onSuccess - Callback khi recaptcha verify thành công
   * @param {Function} onExpired - Callback khi recaptcha hết hạn
   */
  async initRecaptcha(
    containerId = 'recaptcha-container',
    onSuccess = null,
    onExpired = null
  ) {
    try {
      this.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        containerId,
        {
          size: 'invisible',
          callback: (response) => {
            console.log('✅ Recaptcha verified:', response);
            onSuccess?.(response);
          },
          'expired-callback': () => {
            console.warn('⚠️ Recaptcha expired');
            onExpired?.();
          },
        }
      );

      console.log('🔒 Recaptcha initialized successfully');
      return this.recaptchaVerifier;
    } catch (error) {
      console.error('❌ Recaptcha init error:', error);
      throw error;
    }
  }

  /**
   * 📤 Gửi OTP đến số điện thoại
   * @param {string} phoneNumber - Số điện thoại (E.164 format): +84901234567
   * @returns {Promise<string>} - verificationId
   *
   * 🧪 SỐ TEST (KHÔNG TỐN PHÍ):
   * - Vào Firebase Console → Authentication → Phone Numbers
   * - Thêm số test với mã OTP
   * - Ví dụ: +84901234567 → mã 123456
   */
  async sendOTP(phoneNumber) {
    try {
      // Validate số điện thoại (E.164)
      if (!phoneNumber.match(/^\+\d{1,15}$/)) {
        throw new Error('Invalid phone number format. Use E.164: +84901234567');
      }

      if (!this.recaptchaVerifier) {
        throw new Error('RecaptchaVerifier not initialized. Call initRecaptcha() first.');
      }

      console.log(`📱 Sending OTP to: ${phoneNumber}`);

      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier
      );

      console.log('✅ OTP sent successfully');
      return this.confirmationResult.verificationId;
    } catch (error) {
      console.error('❌ Send OTP error:', error.code, error.message);
      throw this._formatError(error);
    }
  }

  /**
   * ✅ Xác nhận mã OTP
   * @param {string} otp - Mã OTP 6 chữ số: 123456
   * @returns {Promise<UserCredential>} - Firebase user credential
   */
  async verifyOTP(otp) {
    try {
      // Validate OTP
      if (!otp.match(/^\d{6}$/)) {
        throw new Error('OTP must be 6 digits');
      }

      if (!this.confirmationResult) {
        throw new Error('No pending verification. Call sendOTP() first.');
      }

      console.log('🔑 Verifying OTP...');

      const userCredential = await this.confirmationResult.confirm(otp);

      console.log('✅ OTP verified successfully');
      console.log('👤 User:', userCredential.user.phoneNumber);

      // Reset
      this.confirmationResult = null;

      return userCredential;
    } catch (error) {
      console.error('❌ Verify OTP error:', error.code, error.message);
      throw this._formatError(error);
    }
  }

  /**
   * 🗑️ Clear RecaptchaVerifier
   */
  clearRecaptcha() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
      console.log('🗑️ Recaptcha cleared');
    }
  }

  /**
   * 🎯 Format lỗi Firebase thành message dễ hiểu
   */
  _formatError(error) {
    const errorMap = {
      'auth/invalid-phone-number':
        'Số điện thoại không hợp lệ. Định dạng: +84901234567',
      'auth/quota-exceeded': 'Quá nhiều thử, vui lòng thử lại sau',
      'auth/user-disabled': 'Tài khoản bị vô hiệu hóa',
      'auth/too-many-requests': 'Quá nhiều yêu cầu, thử lại sau',
      'auth/invalid-verification-code': 'Mã OTP không chính xác',
      'auth/code-expired': 'Mã OTP hết hạn, vui lòng gửi lại',
      'auth/session-expired': 'Phiên làm việc hết hạn',
      'auth/invalid-app-credential': 'Lỗi cấu hình Firebase API Key',
    };

    return new Error(errorMap[error.code] || error.message);
  }
}

export default PhoneAuthService;
