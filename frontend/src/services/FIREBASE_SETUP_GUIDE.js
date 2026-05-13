/**
 * ==============================================
 * 🔥 FIREBASE CONFIGURATION GUIDE
 * ==============================================
 * Hướng dẫn cấu hình Firebase Auth cho xác thực số điện thoại
 */

// ============================================
// STEP 1: Cài đặt Firebase SDK
// ============================================
// npm install firebase

// ============================================
// STEP 2: Tạo file firebase.js
// ============================================
// Tạo file: src/services/firebase.js

/*
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // <- ĐỔI ĐÂY
  authDomain: "your-project.firebaseapp.com",// <- ĐỔI ĐÂY
  projectId: "your-project-id",              // <- ĐỔI ĐÂY
  storageBucket: "your-project.appspot.com", // <- ĐỔI ĐÂY
  messagingSenderId: "123456789",            // <- ĐỔI ĐÂY
  appId: "1:123456789:web:abcd1234efgh5678", // <- ĐỔI ĐÂY
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
*/

// ============================================
// STEP 3: Cấu hình Firebase Console
// ============================================
/*
1. Vào https://console.firebase.google.com/
2. Chọn project của bạn (hoặc tạo mới)
3. Vào Authentication → Sign-in method
4. Enable "Phone" authentication
5. Thêm số test (SỐ KHÔNG TỐN PHÍ):
   - Vào Authentication → Phone Numbers
   - Click "Add phone number"
   - Nhập số: +84901234567
   - Nhập mã OTP test: 123456
   - Save
*/

// ============================================
// STEP 4: Bảo mật API Key
// ============================================
/*
⚠️ KHÔNG COMMIT API KEY vào GitHub!

Tạo file .env.local:
  VITE_FIREBASE_API_KEY=YOUR_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
  VITE_FIREBASE_APP_ID=1:123456789:web:abcd1234efgh5678

Thêm vào .gitignore:
  .env.local
  .env
  .env.*.local
*/

// ============================================
// STEP 5: (TÙY CHỌN) Kích hoạt reCAPTCHA v3
// ============================================
/*
Nếu gặp lỗi reCAPTCHA:
1. Firebase Console → Authentication → App verification settings
2. Enable "App Check" (nếu dùng React app)
3. Hoặc setup reCAPTCHA v3 keys
   - Vào https://www.google.com/recaptcha/admin
   - Tạo site key + secret key cho domain của bạn
   - Copy vào Firebase Console
*/

// ============================================
// STEP 6: Giới hạn số điện thoại bằng Firestore Rules
// ============================================
/*
(Tùy chọn) Bảo vệ user registration:

Firestore Rules:
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{document=**} {
        allow read, write: if request.auth != null && request.auth.token.phone_number_verified == true;
      }
    }
  }
*/

export default {
  setupNote: 'Xem hướng dẫn trong file này trước khi chạy',
};
