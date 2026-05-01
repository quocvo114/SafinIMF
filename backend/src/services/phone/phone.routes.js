/**
 * 📱 Phone Auth Routes
 * Routes để xác thực SĐT qua Firebase
 */

const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../../middleware/firebaseAuth');
const {
  linkPhoneNumber,
  checkPhoneVerifyStatus,
  unlinkPhoneNumber,
} = require('./phone.controller');

/**
 * 📤 POST /api/phone/link
 * Liên kết SĐT xác thực từ Firebase
 * 
 * Request:
 * {
 *   phoneNumber: "+84901234567",
 *   uid: "firebase-uid"
 * }
 * 
 * Headers:
 * Authorization: Bearer <firebase-token>
 */
router.post('/link', verifyFirebaseToken, linkPhoneNumber);

/**
 * 🔍 GET /api/phone/verify-status
 * Kiểm tra trạng thái xác thực SĐT
 * 
 * Headers:
 * Authorization: Bearer <firebase-token>
 */
router.get('/verify-status', verifyFirebaseToken, checkPhoneVerifyStatus);

/**
 * 🗑️ DELETE /api/phone/unlink
 * Hủy liên kết SĐT
 * 
 * Headers:
 * Authorization: Bearer <firebase-token>
 */
router.delete('/unlink', verifyFirebaseToken, unlinkPhoneNumber);

module.exports = router;
