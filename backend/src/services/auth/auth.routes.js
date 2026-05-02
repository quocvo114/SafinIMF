const express = require("express");
const router = express.Router();
const {
  sendRegisterOtp,
  confirmRegister,
  login,
  googleLogin,
  sendForgotPasswordOtp,
  resetPassword,
} = require("./auth.controller");

router.post("/register/send-otp", sendRegisterOtp);
router.post("/register/confirm", confirmRegister);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

module.exports = router;
