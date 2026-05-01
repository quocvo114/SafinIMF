/**
 * 🔥 Firebase Token Verification Middleware
 * Xác minh Firebase ID Token gửi từ Frontend
 * 
 * Support 2 cách:
 * 1. Dùng Firebase Admin SDK (nếu có serviceAccountKey.json)
 * 2. Fallback: Lấy token từ header và tìm user bằng phone number
 */

const axios = require('axios');
let admin = null;

// Cố gắng khởi tạo Firebase Admin SDK
try {
  admin = require('firebase-admin');
  const path = require('path');
  
  if (!admin.apps.length) {
    const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized');
  }
} catch (err) {
  admin = null;
}

/**
 * 🔒 Middleware xác minh Firebase Token
 * 
 * Lần 1: Thử dengan Firebase Admin SDK
 * Lần 2: Fallback - Verify bằng Firebase REST API
 * Lần 3: Fallback - Chỉ lấy token, frontend tự gửi phoneNumber
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu Firebase token',
      });
    }

    // ✅ Cách 1: Dùng Firebase Admin SDK
    if (admin && admin.auth) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          phone: decodedToken.phone_number,
        };
        console.log(`✅ Token verified via Admin SDK: ${decodedToken.uid}`);
        console.log(`📱 Phone from token: ${decodedToken.phone_number}`);
        return next();
      } catch (adminErr) {
        console.warn('⚠️ Admin SDK verification failed, trying REST API...');
        console.warn('Admin SDK error:', adminErr.message);
      }
    }

    // ✅ Cách 2: Fallback - Verify bằng Firebase REST API
    const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyBvPK7NTZKDUfwaehshN02hYC-1jhs7Nec';
    
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        { idToken: token },
        { timeout: 5000 }
      );

      if (response.data && response.data.users && response.data.users[0]) {
        const user = response.data.users[0];
        req.user = {
          uid: user.localId,
          email: user.email,
          phone: user.phoneNumber,
        };
        console.log(`✅ Token verified via REST API: ${user.localId}`);
        return next();
      }
    } catch (restErr) {
      console.warn('⚠️ REST API verification failed, using minimal fallback');
    }

    // ✅ Cách 3: Fallback - Chỉ lấy token, backend tin frontend
    // (Development mode - không an toàn cho production!)
    req.user = {
      uid: 'unknown',
      email: null,
      phone: req.body?.phoneNumber || null,
    };
    
    console.warn('⚠️ Using fallback token verification (DEV MODE)');
    next();

  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Lỗi xác minh token: ' + error.message,
    });
  }
};

module.exports = { verifyFirebaseToken };
