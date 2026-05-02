/**
 * 📱 Phone Auth Controller
 * Xử lý liên kết SĐT xác thực từ Firebase
 */

const userRepo = require('../user/user.repository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * 📤 Liên kết SĐT xác thực từ Firebase
 * Endpoint: POST /api/phone/link
 *
 * Request Body:
 * {
 *   phoneNumber: "+84901234567",  // SĐT từ Firebase
 *   uid: "firebase-uid"            // Firebase UID
 * }
 *
 * Headers:
 * Authorization: Bearer <firebase-token>
 */
async function linkPhoneNumber(req, res) {
  try {
    const { phoneNumber, uid, password, fullName } = req.body;
    const firebaseUid = req.user?.uid; // Từ middleware verifyFirebaseToken

    console.log(`\n=== linkPhoneNumber DEBUG ===`);
    console.log(`📱 Phone from request: ${phoneNumber}`);
    console.log(`🆔 UID from request body: ${uid}`);
    console.log(`🆔 Firebase UID from middleware: ${firebaseUid}`);
    console.log(`🔑 Password provided: ${password ? 'YES' : 'NO'}`);
    console.log(`👤 Full name provided: ${fullName || 'None'}`);

    // Validate input
    if (!phoneNumber || !uid) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu phoneNumber hoặc uid',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mật khẩu',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    console.log(`✅ Input validation passed`);

    // 1. Kiểm tra SĐT đã tồn tại chưa
    const existingUser = await userRepo.findByPhone(phoneNumber);

    if (existingUser) {
      // SĐT đã đăng ký - Cập nhật password và full_name nếu chưa có
      console.log(`✅ User already exists with phone: ${phoneNumber}`);

      const updateData = {};
      
      // Update password nếu user chưa có password
      if (!existingUser.password && hashedPassword) {
        updateData.password = hashedPassword;
        console.log(`✅ Password will be updated`);
      }

      // Update full_name nếu được cung cấp và user chưa có
      if (fullName && !existingUser.full_name) {
        updateData.full_name = fullName;
        console.log(`✅ Full name will be updated to: ${fullName}`);
      }

      // Perform update if needed
      let updatedUser = existingUser;
      if (Object.keys(updateData).length > 0) {
        updatedUser = await userRepo.updateByPhone(phoneNumber, updateData);
        console.log(`✅ User updated`);
      }

      // Tạo JWT token cho ứng dụng
      const appToken = jwt.sign(
        {
          user_id: updatedUser.user_id,
          phone: updatedUser.phone,
          role: updatedUser.role,
          firebase_uid: uid,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Đăng nhập thành công!',
        isNewUser: false,
        user: {
          user_id: updatedUser.user_id,
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          email: updatedUser.email,
          role: updatedUser.role,
        },
        token: appToken,
        firebase_uid: uid,
      });
    }

    // 2. SĐT chưa đăng ký - Tạo user mới
    console.log(`✨ Creating new user with phone: ${phoneNumber}`);

    const user_id = await userRepo.getNextUserId();
    const newUser = await userRepo.create({
      user_id,
      phone: phoneNumber,
      full_name: fullName || "Người dùng mới",
      phone_verified: true,
      firebase_uid: uid,
      password: hashedPassword,
      role: 'citizen',
      created_at: new Date(),
    });

    // Tạo JWT token cho ứng dụng
    const appToken = jwt.sign(
      {
        user_id: newUser.user_id,
        phone: newUser.phone,
        role: newUser.role,
        firebase_uid: uid,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Tài khoản mới được tạo thành công!',
      isNewUser: true,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name || "Người dùng mới",
        phone: newUser.phone,
        email: newUser.email || "",
        role: newUser.role,
      },
      token: appToken,
      firebase_uid: uid,
    });
  } catch (error) {
    console.error('❌ linkPhoneNumber error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message,
    });
  }
}

/**
 * 🔍 Kiểm tra trạng thái xác thực SĐT
 * Endpoint: GET /api/phone/verify-status
 */
async function checkPhoneVerifyStatus(req, res) {
  try {
    const firebaseUid = req.user?.uid;
    const phoneFromUser = req.user?.phone;

    console.log(`🔍 Checking verify status for UID: ${firebaseUid}`);

    // Tìm user bằng phone hoặc firebase_uid
    let user = null;

    if (phoneFromUser) {
      user = await userRepo.findByPhone(phoneFromUser);
    }

    if (!user) {
      return res.json({
        success: true,
        verified: false,
        message: 'SĐT chưa được xác thực',
      });
    }

    return res.json({
      success: true,
      verified: !!user.phone_verified,
      user: {
        user_id: user.user_id,
        phone: user.phone,
        full_name: user.full_name,
      },
      message: user.phone_verified
        ? 'SĐT đã xác thực'
        : 'SĐT chưa xác thực',
    });
  } catch (error) {
    console.error('❌ checkPhoneVerifyStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message,
    });
  }
}

/**
 * 🗑️ Hủy liên kết SĐT
 * Endpoint: DELETE /api/phone/unlink
 */
async function unlinkPhoneNumber(req, res) {
  try {
    const firebaseUid = req.user?.uid;
    const phoneFromUser = req.user?.phone;

    console.log(`🗑️ Unlinking phone for UID: ${firebaseUid}`);

    // Tìm user và xóa firebase_uid / phone_verified
    let user = null;

    if (phoneFromUser) {
      user = await userRepo.findByPhone(phoneFromUser);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
    }

    // Update lại user
    const updatedUser = await userRepo.updateProfile(user.user_id, {
      phone_verified: false,
      firebase_uid: null,
    });

    return res.json({
      success: true,
      message: 'Hủy liên kết SĐT thành công',
      user: {
        user_id: updatedUser.user_id,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error('❌ unlinkPhoneNumber error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message,
    });
  }
}

module.exports = {
  linkPhoneNumber,
  checkPhoneVerifyStatus,
  unlinkPhoneNumber,
};
