import axiosClient from "./axiosClient";

const authApi = {
  sendRegisterOtp(phone) {
    return axiosClient.post("/auth/register/send-otp", { phone });
  },

  confirmRegister(payload) {
    // payload: { phone, otp, password, full_name }
    return axiosClient.post("/auth/register/confirm", payload);
  },

  login(phone, password) {
    return axiosClient.post("/auth/login", { phone, password });
  },

  googleLogin(googleToken) {
    return axiosClient.post("/auth/google-login", { token: googleToken });
  },

  sendOTP(phone) {
    // Gửi OTP để reset password
    return axiosClient.post("/auth/forgot-password/send-otp", { phone });
  },

  resetPassword(phone, otp, newPassword) {
    // Reset password với OTP
    return axiosClient.post("/auth/forgot-password/reset", { 
      phone, 
      otp, 
      newPassword 
    });
  },
};

export default authApi;
