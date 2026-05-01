/**
 * 📱 Phone Verification Routes
 * Endpoints: POST /api/phone/link, GET /api/phone/verify-status, DELETE /api/phone/unlink
 */

const express = require('express');
const router = express.Router();
const {
  linkPhone,
  checkPhoneVerifyStatus,
  unlinkPhone,
} = require('./phone.controller');
const auth = require('../../middleware/auth'); // 🔒 Require authentication

/**
 * POST /api/phone/link
 * Liên kết SĐT xác thực từ Firebase
 */
router.post('/link', auth, linkPhone);

/**
 * GET /api/phone/verify-status
 * Kiểm tra trạng thái xác thực SĐT
 */
router.get('/verify-status', auth, checkPhoneVerifyStatus);

/**
 * DELETE /api/phone/unlink
 * Hủy liên kết SĐT
 */
router.delete('/unlink', auth, unlinkPhone);

module.exports = router;
