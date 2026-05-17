/**
 * 📱 OTP Authentication Service (Frontend)
 * Gọi API backend để request/verify OTP
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api";

class OtpAuthService {
  /**
   * 📱 Gửi OTP
   * @param {string} phoneNumber - Số điện thoại (định dạng: 0XXXXXXXXX)
   * @returns {Promise<{success, message, expiresIn}>}
   */
  async requestOtp(phoneNumber) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/request-otp`, {
        phoneNumber: phoneNumber.trim(),
      });

      return {
        success: response.data.success,
        message: response.data.message,
        expiresIn: response.data.expiresIn,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || "Lỗi gửi OTP. Vui lòng thử lại";
      console.error("❌ requestOtp error:", message);
      throw new Error(message);
    }
  }

  /**
   * ✅ Xác thực OTP
   * @param {string} phoneNumber - Số điện thoại
   * @param {string} otpCode - Mã OTP 6 số
   * @returns {Promise<{success, token, user}>}
   */
  async verifyOtp(phoneNumber, otpCode) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phoneNumber: phoneNumber.trim(),
        otpCode: otpCode.trim(),
      });

      if (response.data.success && response.data.token) {
        // Lưu token vào localStorage
        localStorage.setItem("jwtToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
        };
      }

      throw new Error(response.data.message || "Xác thực OTP thất bại");
    } catch (error) {
      const message =
        error.response?.data?.message || "Lỗi xác thực OTP. Vui lòng thử lại";
      console.error("❌ verifyOtp error:", message);
      throw new Error(message);
    }
  }

  /**
   * 🧹 Xóa token (logout)
   */
  logout() {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
  }

  /**
   * 🔍 Lấy token hiện tại
   */
  getToken() {
    return localStorage.getItem("jwtToken");
  }

  /**
   * 👤 Lấy thông tin user
   */
  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * ✅ Kiểm tra user đã login chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new OtpAuthService();
