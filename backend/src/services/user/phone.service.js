/**
 * 📱 Phone Verification Service
 * Xử lý liên kết SĐT xác thực từ Firebase
 */

const User = require('./user.model');

/**
 * 📝 Cập nhật SĐT xác thực cho user
 * Được gọi sau khi Firebase xác thực SĐT thành công
 *
 * @param {string} userId - ID user từ Firebase
 * @param {string} phoneNumber - SĐT đã xác thực (format E.164: +84901234567)
 * @returns {Promise<Object>} - User object
 */
async function linkPhoneNumber(userId, phoneNumber) {
  try {
    // Validate
    if (!userId || !phoneNumber) {
      throw new Error('userId và phoneNumber không được để trống');
    }

    if (!phoneNumber.match(/^\+\d{1,15}$/)) {
      throw new Error('Định dạng SĐT sai (E.164)');
    }

    console.log(`📱 Linking phone for user ${userId}: ${phoneNumber}`);

    // Kiểm tra SĐT có bị dùng bởi user khác không
    const existingUser = await User.findOne({
      phone: phoneNumber,
      user_id: { $ne: userId }, // Không phải user này
    });

    if (existingUser) {
      throw new Error('SĐT này đã được liên kết với tài khoản khác');
    }

    // Cập nhật user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        phone: phoneNumber,
        phone_verified: true,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error('Không tìm thấy user');
    }

    console.log(`✅ Phone linked successfully for user ${userId}`);
    return {
      success: true,
      user: updatedUser,
      message: 'Liên kết SĐT thành công',
    };
  } catch (error) {
    console.error('❌ Link phone error:', error.message);
    throw error;
  }
}

/**
 * 🔍 Kiểm tra xem user đã xác thực SĐT chưa
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isPhoneVerified(userId) {
  try {
    const user = await User.findById(userId);
    return user?.phone_verified || false;
  } catch (error) {
    console.error('❌ Check phone verified error:', error);
    return false;
  }
}

/**
 * 📱 Lấy SĐT của user
 *
 * @param {string} userId
 * @returns {Promise<string>}
 */
async function getUserPhone(userId) {
  try {
    const user = await User.findById(userId);
    return user?.phone || null;
  } catch (error) {
    console.error('❌ Get user phone error:', error);
    return null;
  }
}

/**
 * 🗑️ Xóa liên kết SĐT (tùy chọn)
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function unlinkPhoneNumber(userId) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        phone: null,
        phone_verified: false,
        updated_at: new Date(),
      },
      { new: true }
    );

    console.log(`✅ Phone unlinked for user ${userId}`);
    return {
      success: true,
      user: updatedUser,
      message: 'Hủy liên kết SĐT thành công',
    };
  } catch (error) {
    console.error('❌ Unlink phone error:', error);
    throw error;
  }
}

module.exports = {
  linkPhoneNumber,
  isPhoneVerified,
  getUserPhone,
  unlinkPhoneNumber,
};
