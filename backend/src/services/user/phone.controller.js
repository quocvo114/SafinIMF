/**
 * 📱 Phone Verification Controller
 * Xử lý requests từ Frontend liên quan đến SĐT
 */

const { linkPhoneNumber, isPhoneVerified, getUserPhone, unlinkPhoneNumber } = require('./phone.service');

/**
 * POST /api/phone/link
 * Liên kết SĐT xác thực từ Firebase
 *
 * Request body:
 * {
 *   "phoneNumber": "+84901234567",  ← Từ Firebase
 *   "uid": "firebase_uid"            ← Từ Firebase
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { ... },
 *   "message": "Liên kết SĐT thành công"
 * }
 */
async function linkPhone(req, res) {
  try {
    const { phoneNumber, uid } = req.body;

    // Validation
    if (!phoneNumber || !uid) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber và uid không được để trống',
      });
    }

    // Kiểm tra user đã authenticate
    if (!req.user || req.user.id !== uid) {
      return res.status(401).json({
        success: false,
        message: 'Không được phép cập nhật SĐT người khác',
      });
    }

    console.log(`📱 [Controller] Link phone for user: ${uid}`);

    // Gọi service
    const result = await linkPhoneNumber(uid, phoneNumber);

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ [Controller] Link phone error:', error.message);

    const statusCode = error.message.includes('SĐT')
      ? 400
      : error.message.includes('Không tìm thấy')
        ? 404
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

/**
 * GET /api/phone/verify-status
 * Kiểm tra xem user đã xác thực SĐT chưa
 *
 * Response:
 * {
 *   "verified": true,
 *   "phone": "+84901234567"
 * }
 */
async function checkPhoneVerifyStatus(req, res) {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không được xác thực',
      });
    }

    console.log(`🔍 [Controller] Check phone verify status for user: ${userId}`);

    const verified = await isPhoneVerified(userId);
    const phone = await getUserPhone(userId);

    return res.status(200).json({
      success: true,
      verified,
      phone: verified ? phone : null, // Chỉ show SĐT nếu xác thực
    });
  } catch (error) {
    console.error('❌ [Controller] Check status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái SĐT',
    });
  }
}

/**
 * DELETE /api/phone/unlink
 * Hủy liên kết SĐT
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Hủy liên kết SĐT thành công"
 * }
 */
async function unlinkPhone(req, res) {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không được xác thực',
      });
    }

    console.log(`🗑️ [Controller] Unlink phone for user: ${userId}`);

    const result = await unlinkPhoneNumber(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ [Controller] Unlink phone error:', error);

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy liên kết SĐT',
    });
  }
}

module.exports = {
  linkPhone,
  checkPhoneVerifyStatus,
  unlinkPhone,
};
